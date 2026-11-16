
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  registrationId: string;
  paymentStatus: string;
};

export default function OnsitePaymentActions({
  registrationId,
  paymentStatus,
}: Props) {
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  async function processPayment(decision: "verified" | "rejected") {
    const action = decision === "verified" ? "verify" : "reject";

    const confirmed = window.confirm(
      decision === "verified"
        ? "Are you sure you want to verify this combined payment?"
        : "Are you sure you want to reject this combined payment? This will also reject the walk-in registration.",
    );

    if (!confirmed) return;

    setProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/admin/onsite", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationId,
          decision,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || `Could not ${action} the payment.`,
        );
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  }

  if (paymentStatus !== "pending_verification") {
    return null;
  }

  return (
    <div className="mt-5 border-t border-gray-100 pt-4">
      <p className="mb-3 text-xs font-semibold tracking-wide text-gray-400">
        PAYMENT VERIFICATION
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => processPayment("verified")}
          disabled={processing}
          className="rounded-lg bg-[#304b38] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#243b2b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? "Processing..." : "Verify Payment"}
        </button>

        <button
          type="button"
          onClick={() => processPayment("rejected")}
          disabled={processing}
          className="rounded-lg border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing ? "Processing..." : "Reject Payment"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
