
"use client";

import { useMemo, useState } from "react";

type Delegate = {
  fullName: string;
  age: string;
  sex: string;
  occupation: string;
  discountType: string;
};

const createDelegate = (): Delegate => ({
  fullName: "",
  age: "",
  sex: "",
  occupation: "",
  discountType: "none",
});

const occupations = [
  "Elementary",
  "Junior High School",
  "Senior High School",
  "College",
  "Career/Working",
];

const discounts = [
  { value: "none", label: "No Discount" },
  { value: "pastor_child", label: "Pastor's Child (50% off)" },
  { value: "missionary_child", label: "Missionary's Child (50% off)" },
  { value: "bible_school_student", label: "Bible School Student (50% off)" },
];

export default function OnsiteRegistrationForm() {
  const [churchName, setChurchName] = useState("");
  const [churchAddress, setChurchAddress] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");

  const [delegates, setDelegates] = useState<Delegate[]>([
    createDelegate(),
  ]);

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [gcashReference, setGcashReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [successDetails, setSuccessDetails] = useState<{
    registrationId: string;
    delegateCount: number;
    totalAmount: number;
  } | null>(null);

  const totalAmount = useMemo(
    () =>
      delegates.reduce(
        (total, delegate) =>
          total + (delegate.discountType === "none" ? 700 : 350),
        0,
      ),
    [delegates],
  );

  function updateDelegate(
    index: number,
    field: keyof Delegate,
    value: string,
  ) {
    setDelegates((current) =>
      current.map((delegate, i) =>
        i === index ? { ...delegate, [field]: value } : delegate,
      ),
    );
  }

  function addDelegate() {
    setDelegates((current) => [...current, createDelegate()]);
  }

  function removeDelegate(index: number) {
    setDelegates((current) =>
      current.length === 1
        ? current
        : current.filter((_, i) => i !== index),
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");
    setSuccessDetails(null);

    if (
      !churchName.trim() ||
      !churchAddress.trim() ||
      !representativeName.trim() ||
      !contactNumber.trim() ||
      !emailAddress.trim()
    ) {
      setErrorMessage("Please complete all required church information.");
      return;
    }

    if (paymentMethod === "GCash" && !gcashReference.trim()) {
      setErrorMessage("Please enter the GCash reference number.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/onsite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          churchName: churchName.trim(),
          churchAddress: churchAddress.trim(),
          representativeName: representativeName.trim(),
          contactNumber: contactNumber.trim(),
          emailAddress: emailAddress.trim(),
          delegates: delegates.map((delegate) => ({
            fullName: delegate.fullName.trim(),
            age: Number(delegate.age),
            sex: delegate.sex,
            occupation: delegate.occupation,
            discountType: delegate.discountType,
          })),
          paymentMethod,
          gcashReference: gcashReference.trim(),
          notes: notes.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Registration could not be saved.",
        );
      }

      setSuccessDetails({
        registrationId: result.registrationId,
        delegateCount: result.delegateCount,
        totalAmount: result.totalAmount,
      });

      setMessage(
        "Walk-in registration saved successfully. Payment and registration are awaiting verification.",
      );

      setChurchName("");
      setChurchAddress("");
      setRepresentativeName("");
      setContactNumber("");
      setEmailAddress("");
      setDelegates([createDelegate()]);
      setPaymentMethod("Cash");
      setGcashReference("");
      setNotes("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {message && successDetails && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-800">
          <p className="font-bold">{message}</p>
          <div className="mt-3 space-y-1">
            <p>
              Registration ID:{" "}
              <span className="font-mono font-semibold">
                {successDetails.registrationId}
              </span>
            </p>
            <p>Delegates: {successDetails.delegateCount}</p>
            <p>
              Combined payment: ₱
              {successDetails.totalAmount.toLocaleString("en-PH")}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* CHURCH INFORMATION */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-bold text-[#304b38]">
            Church Information
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Please provide the complete church and representative information.
            All fields are required.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Church Name *
            </span>
            <input
              required
              maxLength={200}
              value={churchName}
              onChange={(event) => setChurchName(event.target.value)}
              placeholder="Enter the church name"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#66836b]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Representative's Full Name *
            </span>
            <input
              required
              maxLength={200}
              value={representativeName}
              onChange={(event) =>
                setRepresentativeName(event.target.value)
              }
              placeholder="Enter representative's full name"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#66836b]"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-medium">
              Church Address *
            </span>
            <textarea
              required
              maxLength={500}
              value={churchAddress}
              onChange={(event) => setChurchAddress(event.target.value)}
              rows={2}
              placeholder="Enter the complete church address"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#66836b]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Contact Number *
            </span>
            <input
              required
              type="tel"
              maxLength={50}
              value={contactNumber}
              onChange={(event) => setContactNumber(event.target.value)}
              placeholder="Enter contact number"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#66836b]"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Email Address *
            </span>
            <input
              required
              type="email"
              maxLength={254}
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              placeholder="Enter email address"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#66836b]"
            />
          </label>
        </div>

        <p className="text-xs text-gray-400">
          All delegates in this walk-in registration will belong to this church.
        </p>
      </section>

      {/* DELEGATES */}
      <section className="space-y-6">
        <h3 className="text-lg font-bold text-[#304b38]">
          Delegate Information
        </h3>

        {delegates.map((delegate, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 p-5"
          >
            <div className="mb-5 flex items-center justify-between">
              <h4 className="font-bold text-[#304b38]">
                Delegate {index + 1}
              </h4>

              {delegates.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDelegate(index)}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium">
                  Full Name
                </span>
                <input
                  required
                  maxLength={200}
                  value={delegate.fullName}
                  onChange={(event) =>
                    updateDelegate(index, "fullName", event.target.value)
                  }
                  placeholder="Enter delegate's full name"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#66836b]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Age
                </span>
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={delegate.age}
                  onChange={(event) =>
                    updateDelegate(index, "age", event.target.value)
                  }
                  placeholder="Enter age"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#66836b]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Sex
                </span>
                <select
                  required
                  value={delegate.sex}
                  onChange={(event) =>
                    updateDelegate(index, "sex", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#66836b]"
                >
                  <option value="">Select sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Occupation
                </span>
                <select
                  required
                  value={delegate.occupation}
                  onChange={(event) =>
                    updateDelegate(index, "occupation", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#66836b]"
                >
                  <option value="">Select occupation</option>
                  {occupations.map((occupation) => (
                    <option key={occupation} value={occupation}>
                      {occupation}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Discount Eligibility
                </span>
                <select
                  required
                  value={delegate.discountType}
                  onChange={(event) =>
                    updateDelegate(index, "discountType", event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#66836b]"
                >
                  {discounts.map((discount) => (
                    <option key={discount.value} value={discount.value}>
                      {discount.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-lg bg-[#f7f8f5] px-4 py-3">
              <span className="text-sm text-gray-500">
                Delegate registration fee
              </span>
              <span className="font-bold text-[#304b38]">
                ₱{delegate.discountType === "none" ? "700" : "350"}
              </span>
            </div>
          </div>
        ))}
      </section>

      <button
        type="button"
        onClick={addDelegate}
        className="rounded-lg border border-[#304b38] px-5 py-3 text-sm font-semibold text-[#304b38] hover:bg-[#f1f5ef]"
      >
        + Add Another Delegate
      </button>

      {/* PAYMENT */}
      <section className="border-t border-gray-200 pt-6">
        <h4 className="text-lg font-bold">Combined Payment</h4>
        <p className="mt-1 text-sm text-gray-500">
          One full payment is required for all delegates in this registration.
        </p>

        <div className="mt-5 rounded-xl bg-[#f7f8f5] p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Number of delegates
            </span>
            <span className="font-semibold">{delegates.length}</span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Total amount due
            </span>
            <span className="text-2xl font-bold text-[#304b38]">
              ₱{totalAmount.toLocaleString("en-PH")}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Payment Method
            </span>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#66836b]"
            >
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
            </select>
          </label>

          {paymentMethod === "GCash" && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                GCash Reference Number
              </span>
              <input
                required
                maxLength={100}
                value={gcashReference}
                onChange={(event) => setGcashReference(event.target.value)}
                placeholder="Enter GCash reference number"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#66836b]"
              />
            </label>
          )}
        </div>

        <label className="mt-5 block">
          <span className="mb-1 block text-sm font-medium">
            Notes (Optional)
          </span>
          <textarea
            maxLength={1000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Additional information about this walk-in registration"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#66836b]"
          />
        </label>
      </section>

      <div className="flex justify-end border-t border-gray-200 pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[#304b38] px-6 py-3 font-semibold text-white hover:bg-[#243b2b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving Registration..." : "Save Walk-in Registration"}
        </button>
      </div>
    </form>
  );
}
