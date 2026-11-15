
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DiscountActions({
  delegateId,
}: {
  delegateId: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  async function processDiscount(action: "verify" | "reject") {
    const confirmed = window.confirm(
      action === "verify"
        ? "Confirm that this delegate qualifies for the 50% discount?"
        : "Are you sure this delegate does not qualify for the discount?"
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/discounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delegateId,
          action,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Something went wrong.");
        setMessageType("error");
        return;
      }

      setMessage(result.message);
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
    <div className="mt-4">
      {message && (
        <p
          role="status"
          className={`mb-3 rounded-lg p-3 text-sm ${
            messageType === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => processDiscount("verify")}
          disabled={loading}
          className="rounded-lg bg-[#304b38] px-4 py-2 text-sm font-semibold text-white hover:bg-[#243b2c] disabled:opacity-50"
        >
          {loading ? "Processing..." : "Verify Discount"}
        </button>

        <button
          type="button"
          onClick={() => processDiscount("reject")}
          disabled={loading}
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Reject Discount
        </button>
      </div>
    </div>
  );
}
