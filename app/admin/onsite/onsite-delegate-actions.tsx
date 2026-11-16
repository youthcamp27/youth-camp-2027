
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdditionalPayment = {
  "Payment Method": string | null;
  "GCash Reference": string | null;
  Status: string;
} | null;

type Props = {
  delegateId: string;
  discountStatus: string;
  additionalPayment: AdditionalPayment;
};

export default function OnsiteDelegateActions({
  delegateId,
  discountStatus,
  additionalPayment,
}: Props) {
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [gcashReference, setGcashReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendRequest(
    body: Record<string, string>,
  ) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/onsite", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong.");
      }

      setMessage(result.message || "Action completed successfully.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  function confirmDecision(
    action: string,
    decision: "verified" | "rejected",
    description: string,
  ) {
    if (!window.confirm(`Are you sure you want to ${description}?`)) {
      return;
    }

    void sendRequest({
      action,
      delegateId,
      decision,
    });
  }

  function recordAdditionalPayment() {
    if (
      paymentMethod === "GCash" &&
      !gcashReference.trim()
    ) {
      setError("Enter the GCash reference number.");
      return;
    }

    if (
      !window.confirm(
        "Record this additional ₱350 payment information?",
      )
    ) {
      return;
    }

    void sendRequest({
      action: "record_additional_payment",
      delegateId,
      paymentMethod,
      gcashReference: gcashReference.trim(),
    });
  }

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      {discountStatus === "pending" && (
        <div>
          <p className="text-sm font-semibold">
            Discount Verification
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Review the delegate's discount eligibility.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                confirmDecision(
                  "verify_discount",
                  "verified",
                  "verify this discount claim",
                )
              }
              className="rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
            >
              Verify Discount
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                confirmDecision(
                  "verify_discount",
                  "rejected",
                  "reject this discount claim",
                )
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Reject Discount
            </button>
          </div>
        </div>
      )}

      {discountStatus === "rejected" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            Additional Payment Required
          </p>

          <p className="mt-1 text-xs text-amber-800">
            The discount claim was rejected. The delegate must pay
            an additional ₱350 before the registration can be verified.
          </p>

          {!additionalPayment ? (
            <p className="mt-3 text-xs text-red-700">
              Additional payment record not found. Contact the system administrator.
            </p>
          ) : additionalPayment.Status === "pending_verification" &&
            additionalPayment["Payment Method"] === null ? (
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-gray-700">
                Additional Payment Method
                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(event.target.value)
                  }
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="GCash">GCash</option>
                </select>
              </label>

              {paymentMethod === "GCash" && (
                <label className="block text-xs font-semibold text-gray-700">
                  GCash Reference Number
                  <input
                    type="text"
                    value={gcashReference}
                    onChange={(event) =>
                      setGcashReference(event.target.value)
                    }
                    maxLength={100}
                    placeholder="Enter reference number"
                    disabled={loading}
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
              )}

              <button
                type="button"
                onClick={recordAdditionalPayment}
                disabled={loading}
                className="rounded-lg bg-[#304b38] px-4 py-2 text-xs font-semibold text-white hover:bg-[#243a2b] disabled:opacity-50"
              >
                Record Additional Payment
              </button>
            </div>
          ) : additionalPayment.Status === "pending_verification" ? (
            <div className="mt-3">
              <p className="text-xs text-gray-700">
                Method: {additionalPayment["Payment Method"]}
              </p>

              {additionalPayment["Payment Method"] === "GCash" && (
                <p className="mt-1 break-all text-xs text-gray-700">
                  Reference: {additionalPayment["GCash Reference"]}
                </p>
              )}

              <p className="mt-2 text-xs font-semibold text-amber-800">
                Additional payment awaiting verification
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    confirmDecision(
                      "verify_additional_payment",
                      "verified",
                      "verify this additional payment",
                    )
                  }
                  className="rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                >
                  Verify ₱350 Payment
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    confirmDecision(
                      "verify_additional_payment",
                      "rejected",
                      "reject this additional payment",
                    )
                  }
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Reject Payment
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs font-semibold text-gray-700">
              Additional Payment:{" "}
              {additionalPayment.Status === "verified"
                ? "Verified"
                : "Rejected"}
            </p>
          )}
        </div>
      )}

      {message && (
        <p className="mt-3 text-xs font-medium text-green-700">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-3 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-2 text-xs text-gray-500">
          Processing...
        </p>
      )}
    </div>
  );
}
