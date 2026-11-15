
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentActions({
  paymentId,
}: {
  paymentId: string;
}) {
  const router = useRouter();

  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  async function processPayment(action: "verify" | "reject") {
    setMessage("");

    if (action === "verify") {
      const confirmed = window.confirm(
        "Have you checked the GCash transaction and confirmed that the full required amount was received?"
      );

      if (!confirmed) return;
    }

    if (action === "reject") {
      const confirmed = window.confirm(
        "Are you sure you want to reject this payment?"
      );

      if (!confirmed) return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          action,
          financeNotes: notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Something went wrong.");
        setMessageType("error");
        return;
      }

      setMessage(result.message || "Payment updated successfully.");
      setMessageType("success");

      router.refresh();
    } catch {
      setMessage("Could not connect to the server. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <label
        htmlFor={`finance-notes-${paymentId}`}
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        Finance Notes
      </label>

      <textarea
        id={`finance-notes-${paymentId}`}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Add verification details or reason for rejection..."
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#66836b] focus:ring-2 focus:ring-[#66836b]/20"
      />

      {message && (
        <p
          role="status"
          className={`mt-3 rounded-lg p-3 text-sm ${
            messageType === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => processPayment("verify")}
          disabled={loading}
          className="rounded-lg bg-[#304b38] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#243b2c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing..." : "Verify Payment"}
        </button>

        <button
          type="button"
          onClick={() => processPayment("reject")}
          disabled={loading}
          className="rounded-lg border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reject Payment
        </button>
      </div>
    </div>
  );
}
