
import { randomUUID } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { registrationSchema } from "@/lib/registration-schema";
import { z } from "zod";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function isValidImageSignature(
  bytes: Uint8Array,
  type: string
): boolean {
  if (type === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (type === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (type === "image/webp") {
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }

  return false;
}

export async function POST(request: Request) {
  let uploadedReceiptPath: string | null = null;

  try {
    const formData = await request.formData();

    const registrationText = formData.get("registration");
    const receipt = formData.get("receipt");

    if (typeof registrationText !== "string") {
      return Response.json(
        { message: "Registration information is missing." },
        { status: 400 }
      );
    }

    if (!(receipt instanceof File)) {
      return Response.json(
        { message: "Please attach your GCash receipt." },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(registrationText);
    } catch {
      return Response.json(
        { message: "Registration information is not valid JSON." },
        { status: 400 }
      );
    }

    const result = registrationSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        {
          message: "Please check your registration information.",
          errors: z.treeifyError(result.error),
        },
        { status: 400 }
      );
    }

    if (
      receipt.size === 0 ||
      receipt.size > MAX_FILE_SIZE ||
      !["image/jpeg", "image/png", "image/webp"].includes(receipt.type)
    ) {
      return Response.json(
        {
          message: "Receipt must be a JPG, PNG, or WebP image no larger than 5 MB.",
        },
        { status: 400 }
      );
    }

    const receiptBytes = new Uint8Array(await receipt.arrayBuffer());

    if (!isValidImageSignature(receiptBytes, receipt.type)) {
      return Response.json(
        { message: "The uploaded receipt is not a valid image." },
        { status: 400 }
      );
    }

    const registration = result.data;

    const receiptExtension = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    }[receipt.type];

    uploadedReceiptPath = `${randomUUID()}.${receiptExtension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("gcash-receipts")
      .upload(uploadedReceiptPath, receiptBytes, {
        contentType: receipt.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Receipt upload failed:", uploadError.message);

      return Response.json(
        { message: "We could not upload your receipt. Please try again." },
        { status: 500 }
      );
    }

    const { data: registrationId, error: databaseError } =
      await supabaseAdmin.rpc("create_registration_submission", {
        p_church: {
          churchName: registration.churchName,
          churchAddress: registration.churchAddress,
          representativeName: registration.representativeName,
          contactNumber: registration.contactNumber,
          emailAddress: registration.emailAddress,
        },
        p_delegates: registration.delegates,
        p_gcash_reference: registration.gcashReference,
        p_receipt_path: uploadedReceiptPath,
      });

    if (databaseError || !registrationId) {
      console.error(
        "Registration database error:",
        databaseError?.message
      );

      await supabaseAdmin.storage
        .from("gcash-receipts")
        .remove([uploadedReceiptPath]);

      uploadedReceiptPath = null;

      return Response.json(
        { message: "We could not save your registration. Please try again." },
        { status: 500 }
      );
    }

    return Response.json(
      {
        message: "Registration submitted successfully!",
        registrationId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration submission error:", error);

    if (uploadedReceiptPath) {
      await supabaseAdmin.storage
        .from("gcash-receipts")
        .remove([uploadedReceiptPath]);
    }

    return Response.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
