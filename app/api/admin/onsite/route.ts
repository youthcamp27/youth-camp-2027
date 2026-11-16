
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ALLOWED_OCCUPATIONS = [
  "Elementary",
  "Junior High School",
  "Senior High School",
  "College",
  "Career/Working",
];

const ALLOWED_DISCOUNTS = [
  "none",
  "pastor_child",
  "missionary_child",
  "bible_school_student",
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DelegateInput = {
  fullName: string;
  age: number;
  sex: string;
  occupation: string;
  discountType: string;
};

async function authorizeAdmin() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  const email = data?.claims?.email;

  if (
    error ||
    typeof email !== "string" ||
    !process.env.ADMIN_EMAIL ||
    email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()
  ) {
    return null;
  }

  return email;
}

function invalidRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  const email = await authorizeAdmin();

  if (!email) {
    return invalidRequest("Unauthorized.", 401);
  }

  let body: {
    churchName?: string;
    churchAddress?: string;
    representativeName?: string;
    contactNumber?: string;
    emailAddress?: string;
    delegates?: DelegateInput[];
    paymentMethod?: string;
    gcashReference?: string;
    notes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return invalidRequest("Invalid request data.");
  }

  const churchName =
    typeof body.churchName === "string"
      ? body.churchName.trim()
      : "";

  const churchAddress =
    typeof body.churchAddress === "string"
      ? body.churchAddress.trim()
      : "";

  const representativeName =
    typeof body.representativeName === "string"
      ? body.representativeName.trim()
      : "";

  const contactNumber =
    typeof body.contactNumber === "string"
      ? body.contactNumber.trim()
      : "";

  const emailAddress =
    typeof body.emailAddress === "string"
      ? body.emailAddress.trim()
      : "";

  const delegates = body.delegates;
  const paymentMethod = body.paymentMethod;

  const gcashReference =
    typeof body.gcashReference === "string"
      ? body.gcashReference.trim()
      : "";

  const notes =
    typeof body.notes === "string"
      ? body.notes.trim()
      : "";

  // Validate required church information.
  if (!churchName || churchName.length > 200) {
    return invalidRequest(
      "Enter a valid church name (maximum 200 characters)."
    );
  }

  if (!churchAddress || churchAddress.length > 500) {
    return invalidRequest(
      "Enter a valid church address (maximum 500 characters)."
    );
  }

  if (!representativeName || representativeName.length > 200) {
    return invalidRequest(
      "Enter the representative's full name (maximum 200 characters)."
    );
  }

  if (!contactNumber || contactNumber.length > 50) {
    return invalidRequest(
      "Enter a valid contact number (maximum 50 characters)."
    );
  }

  if (
    !emailAddress ||
    emailAddress.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)
  ) {
    return invalidRequest("Enter a valid email address.");
  }

  if (
    !Array.isArray(delegates) ||
    delegates.length < 1 ||
    delegates.length > 100
  ) {
    return invalidRequest("Add between 1 and 100 delegates.");
  }

  if (paymentMethod !== "Cash" && paymentMethod !== "GCash") {
    return invalidRequest("Select Cash or GCash as the payment method.");
  }

  if (paymentMethod === "GCash" && !gcashReference) {
    return invalidRequest("Enter the GCash reference number.");
  }

  if (gcashReference.length > 100 || notes.length > 1000) {
    return invalidRequest("Some information is too long.");
  }

  const normalizedDelegates = [];

  for (const delegate of delegates) {
    if (
      !delegate ||
      typeof delegate.fullName !== "string" ||
      !delegate.fullName.trim() ||
      delegate.fullName.trim().length > 200 ||
      !Number.isInteger(delegate.age) ||
      delegate.age < 1 ||
      delegate.age > 100 ||
      !["Male", "Female"].includes(delegate.sex) ||
      !ALLOWED_OCCUPATIONS.includes(delegate.occupation) ||
      !ALLOWED_DISCOUNTS.includes(delegate.discountType)
    ) {
      return invalidRequest(
        "One or more delegate details are invalid."
      );
    }

    const discounted = delegate.discountType !== "none";

    normalizedDelegates.push({
      "Full Name": delegate.fullName.trim(),
      Age: delegate.age,
      Sex: delegate.sex,
      Occupation: delegate.occupation,
      "Discount Type": delegate.discountType,
      "Discount Verification": false,
      "Registration Fee": discounted ? 350 : 700,
      Timestamp: new Date().toISOString(),
      "Discount Status": discounted
        ? "pending"
        : "not_applicable",
    });
  }

  const totalAmount = normalizedDelegates.reduce(
    (total, delegate) => total + delegate["Registration Fee"],
    0
  );

  // Create the on-site registration with complete church information.
  const { data: registration, error: registrationError } =
    await supabaseAdmin
      .from("On-Site Registrations")
      .insert({
        "Church Name": churchName,
        "Church Address": churchAddress,
        "Delegation Head Name": representativeName,
        "Contact No.": contactNumber,
        "Email Address": emailAddress,
        "Registered By": email,
        Notes: notes || null,
        Status: "pending_verification",
      })
      .select("id")
      .single();

  if (registrationError || !registration) {
    console.error(
      "On-site registration creation failed:",
      registrationError
    );

    return invalidRequest(
      "Could not create the walk-in registration.",
      500
    );
  }

  const registrationId = registration.id;

  const delegateRecords = normalizedDelegates.map((delegate) => ({
    ...delegate,
    onsite_registration_id: registrationId,
  }));

  const { error: delegateError } = await supabaseAdmin
    .from("Delegates")
    .insert(delegateRecords);

  if (delegateError) {
    console.error(
      "On-site delegate creation failed:",
      delegateError
    );

    await supabaseAdmin
      .from("On-Site Registrations")
      .delete()
      .eq("id", registrationId);

    return invalidRequest(
      "Could not save the delegates. No registration was retained.",
      500
    );
  }

  const { error: paymentError } = await supabaseAdmin
    .from("On-Site Payments")
    .insert({
      registration_id: registrationId,
      Amount: totalAmount,
      "Payment Method": paymentMethod,
      "GCash Reference":
        paymentMethod === "GCash" ? gcashReference : null,
      Status: "pending_verification",
    });

  if (paymentError) {
    console.error(
      "On-site payment creation failed:",
      paymentError
    );

    await supabaseAdmin
      .from("On-Site Registrations")
      .delete()
      .eq("id", registrationId);

    return invalidRequest(
      "Could not save the payment. No registration was retained.",
      500
    );
  }

  return NextResponse.json(
    {
      success: true,
      registrationId,
      delegateCount: normalizedDelegates.length,
      totalAmount,
      message:
        "Walk-in registration saved and awaiting verification.",
    },
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest) {
  const email = await authorizeAdmin();

  if (!email) {
    return invalidRequest("Unauthorized.", 401);
  }

  let body: {
    action?: string;
    registrationId?: string;
    delegateId?: string;
    decision?: string;
    paymentMethod?: string;
    gcashReference?: string;
  };

  try {
    body = await request.json();
  } catch {
    return invalidRequest("Invalid request data.");
  }

  const action = body.action;

  // 1. Verify or reject a delegate's discount claim.
  if (action === "verify_discount") {
    const delegateId = body.delegateId;
    const decision = body.decision;

    if (
      typeof delegateId !== "string" ||
      !UUID_PATTERN.test(delegateId)
    ) {
      return invalidRequest("A valid delegate ID is required.");
    }

    if (decision !== "verified" && decision !== "rejected") {
      return invalidRequest("Select a valid discount decision.");
    }

    const { data, error } = await supabaseAdmin.rpc(
      "verify_onsite_discount",
      {
        p_delegate_id: delegateId,
        p_decision: decision,
      }
    );

    if (error) {
      console.error("Discount verification failed:", error);

      return invalidRequest(
        error.message || "Could not process the discount claim."
      );
    }

    return NextResponse.json({
      success: true,
      result: data,
      message:
        decision === "verified"
          ? "Discount claim verified."
          : "Discount claim rejected. An additional ₱350 payment is required.",
    });
  }

  // 2. Record the chosen method for an additional ₱350 payment.
  if (action === "record_additional_payment") {
    const delegateId = body.delegateId;
    const paymentMethod = body.paymentMethod;

    const gcashReference =
      typeof body.gcashReference === "string"
        ? body.gcashReference.trim()
        : "";

    if (
      typeof delegateId !== "string" ||
      !UUID_PATTERN.test(delegateId)
    ) {
      return invalidRequest("A valid delegate ID is required.");
    }

    if (paymentMethod !== "Cash" && paymentMethod !== "GCash") {
      return invalidRequest("Select Cash or GCash.");
    }

    if (paymentMethod === "GCash" && !gcashReference) {
      return invalidRequest("Enter the GCash reference number.");
    }

    if (gcashReference.length > 100) {
      return invalidRequest(
        "The GCash reference number is too long."
      );
    }

    const { data: additionalPayment, error: lookupError } =
      await supabaseAdmin
        .from("On-Site Additional Payments")
        .select('id, "Status", "Payment Method"')
        .eq("delegate_id", delegateId)
        .maybeSingle();

    if (lookupError || !additionalPayment) {
      console.error(
        "Additional payment lookup failed:",
        lookupError
      );

      return invalidRequest(
        "No additional payment record was found for this delegate."
      );
    }

    if (additionalPayment.Status !== "pending_verification") {
      return invalidRequest(
        "This additional payment has already been processed."
      );
    }

    if (additionalPayment["Payment Method"] !== null) {
      return invalidRequest(
        "A payment method has already been recorded."
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("On-Site Additional Payments")
      .update({
        "Payment Method": paymentMethod,
        "GCash Reference":
          paymentMethod === "GCash" ? gcashReference : null,
      })
      .eq("id", additionalPayment.id)
      .is("Payment Method", null)
      .eq("Status", "pending_verification");

    if (updateError) {
      console.error(
        "Additional payment recording failed:",
        updateError
      );

      return invalidRequest(
        "Could not record the additional payment.",
        500
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Additional payment details recorded and awaiting verification.",
    });
  }

  // 3. Verify or reject the additional ₱350 payment.
  if (action === "verify_additional_payment") {
    const delegateId = body.delegateId;
    const decision = body.decision;

    if (
      typeof delegateId !== "string" ||
      !UUID_PATTERN.test(delegateId)
    ) {
      return invalidRequest("A valid delegate ID is required.");
    }

    if (decision !== "verified" && decision !== "rejected") {
      return invalidRequest("Select a valid payment decision.");
    }

    const { data, error } = await supabaseAdmin.rpc(
      "verify_onsite_additional_payment",
      {
        p_delegate_id: delegateId,
        p_decision: decision,
        p_verified_by: email,
      }
    );

    if (error) {
      console.error(
        "Additional payment verification failed:",
        error
      );

      return invalidRequest(
        error.message ||
          "Could not process the additional payment."
      );
    }

    return NextResponse.json({
      success: true,
      result: data,
      message:
        decision === "verified"
          ? "Additional payment verified."
          : "Additional payment rejected.",
    });
  }

  // 4. Verify or reject the combined on-site payment.
  const registrationId = body.registrationId;
  const decision = body.decision;

  if (
    typeof registrationId !== "string" ||
    !UUID_PATTERN.test(registrationId)
  ) {
    return invalidRequest("A valid registration ID is required.");
  }

  if (decision !== "verified" && decision !== "rejected") {
    return invalidRequest("Select a valid payment decision.");
  }

  const { data, error } = await supabaseAdmin.rpc(
    "verify_onsite_payment",
    {
      p_registration_id: registrationId,
      p_decision: decision,
      p_verified_by: email,
    }
  );

  if (error) {
    console.error(
      "On-site payment verification failed:",
      error
    );

    return invalidRequest(
      error.message || "Could not process the payment."
    );
  }

  return NextResponse.json({
    success: true,
    result: data,
    message:
      decision === "verified"
        ? "Payment verification completed."
        : "Payment has been rejected.",
  });
}
