
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    const email = data?.claims?.email;

    if (
      error ||
      typeof email !== "string" ||
      !process.env.ADMIN_EMAIL ||
      email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const delegateId = body.delegateId;
    const action = body.action;

    if (
      typeof delegateId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(delegateId) ||
      !["verify", "reject"].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid discount request." },
        { status: 400 }
      );
    }

    const { data: delegate, error: delegateError } =
      await supabaseAdmin
        .from("Delegates")
        .select("*")
        .eq("id", delegateId)
        .maybeSingle();

    if (delegateError || !delegate) {
      return NextResponse.json(
        { error: "Delegate not found." },
        { status: 404 }
      );
    }

    const discountType = delegate["Discount Type"];

    const eligibleTypes = [
      "pastor_child",
      "missionary_child",
      "bible_school_student",
    ];

    if (!eligibleTypes.includes(discountType)) {
      return NextResponse.json(
        { error: "This delegate has no eligible discount claim." },
        { status: 400 }
      );
    }

    if (delegate["Discount Status"] !== "pending") {
      return NextResponse.json(
        { error: "This discount claim has already been processed." },
        { status: 409 }
      );
    }

    const isVerified = action === "verify";

    const { data: updatedDelegate, error: updateError } =
      await supabaseAdmin
        .from("Delegates")
        .update({
          "Discount Status": isVerified ? "verified" : "rejected",
          "Discount Verification": isVerified,
          "Registration Fee": isVerified ? 300 : 600,
        })
        .eq("id", delegateId)
        .eq("Discount Status", "pending")
        .select("id")
        .maybeSingle();

    if (updateError || !updatedDelegate) {
      console.error("Discount update error:", updateError?.message);

      return NextResponse.json(
        { error: "Could not update the discount claim." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: isVerified
        ? "Discount successfully verified. Registration fee updated to ₱300."
        : "Discount rejected. Registration fee updated to ₱600.",
    });
  } catch (error) {
    console.error("Discount verification error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
