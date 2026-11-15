
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify administrator access.
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    const email = data?.claims?.email;
    const userId = data?.claims?.sub;

    if (
      error ||
      typeof email !== "string" ||
      typeof userId !== "string" ||
      !process.env.ADMIN_EMAIL ||
      email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 }
      );
    }

    // 2. Read and validate the request.
    const body = await request.json();

    const paymentId = body.paymentId;
    const action = body.action;

    const financeNotes =
      typeof body.financeNotes === "string"
        ? body.financeNotes.trim().slice(0, 1000)
        : "";

    if (
      typeof paymentId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId) ||
      !["verify", "reject"].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid payment request." },
        { status: 400 }
      );
    }

    // 3. Retrieve the payment.
    const { data: payment, error: paymentError } =
      await supabaseAdmin
        .from("Payments")
        .select("*")
        .eq("id", paymentId)
        .maybeSingle();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment record not found." },
        { status: 404 }
      );
    }

    if (payment.Status !== "pending_verification") {
      return NextResponse.json(
        { error: "This payment has already been processed." },
        { status: 409 }
      );
    }

    // 4. Retrieve delegates and their discount information.
    if (action === "verify") {
      const { data: delegates, error: delegatesError } =
        await supabaseAdmin
          .from("Delegates")
          .select(
            '"Registration Fee", "Discount Type", "Discount Status"'
          )
          .eq("registration_id", payment.registration_id);

      if (delegatesError || !delegates || delegates.length === 0) {
        return NextResponse.json(
          { error: "Could not verify the registration fees." },
          { status: 500 }
        );
      }

      // 5. Check every claimed discount.
      for (const delegate of delegates) {
        const discountType = delegate["Discount Type"];
        const discountStatus = delegate["Discount Status"];
        const fee = Number(delegate["Registration Fee"]);

        if (!Number.isFinite(fee) || fee <= 0) {
          return NextResponse.json(
            { error: "A delegate has an invalid registration fee." },
            { status: 400 }
          );
        }

        if (!discountType || discountType === "none") {
          continue;
        }

        if (discountStatus === "pending") {
          return NextResponse.json(
            {
              error:
                "Approval blocked. Verify or reject every claimed discount before approving this payment.",
            },
            { status: 400 }
          );
        }

        if (discountStatus === "verified" && fee !== 300) {
          return NextResponse.json(
            {
              error:
                "A verified discount has an incorrect registration fee. Please review the delegate record.",
            },
            { status: 400 }
          );
        }

        if (discountStatus === "rejected" && fee !== 600) {
          return NextResponse.json(
            {
              error:
                "A rejected discount has an incorrect registration fee. Please review the delegate record.",
            },
            { status: 400 }
          );
        }

        if (
          discountStatus !== "verified" &&
          discountStatus !== "rejected"
        ) {
          return NextResponse.json(
            {
              error:
                "A discount claim has an invalid status. Please review the delegate record.",
            },
            { status: 400 }
          );
        }
      }

      // 6. Calculate the complete required payment.
      const requiredAmount = delegates.reduce(
        (total, delegate) =>
          total + Number(delegate["Registration Fee"]),
        0
      );

      const submittedAmount = Number(payment.Amount);

      if (
        !Number.isFinite(requiredAmount) ||
        !Number.isFinite(submittedAmount) ||
        requiredAmount <= 0 ||
        Math.round(requiredAmount * 100) !==
          Math.round(submittedAmount * 100)
      ) {
        return NextResponse.json(
          {
            error: `Approval blocked. The full required amount is ₱${requiredAmount.toLocaleString("en-PH")}, but the submitted payment is ₱${submittedAmount.toLocaleString("en-PH")}. A new full payment is required if the amount is insufficient.`,
          },
          { status: 400 }
        );
      }
    }

    // 7. Process payment and registration status together.
    const { error: decisionError } = await supabaseAdmin.rpc(
      "process_payment_decision",
      {
        p_payment_id: paymentId,
        p_action: action,
        p_user_id: userId,
        p_finance_notes: financeNotes,
      }
    );

    if (decisionError) {
      console.error("Payment decision error:", decisionError.message);

      if (decisionError.message.includes("already been processed")) {
        return NextResponse.json(
          { error: "This payment has already been processed." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Could not process the payment decision." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === "verify"
          ? "Payment verified and registration approved."
          : "Payment rejected and registration returned to review.",
    });
  } catch (error) {
    console.error("Payment processing error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
