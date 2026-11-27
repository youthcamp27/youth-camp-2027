
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type Delegate = {
  id: number;
  fullName: string;
  nickname: string;
  age: string;
  sex: string;
  category: string;
  discount: string;
};

type ChurchInfo = {
  churchName: string;
  churchAddress: string;
  representativeName: string;
  contactNumber: string;
  emailAddress: string;
  gcashReference: string;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#66836b] focus:ring-2 focus:ring-[#66836b]/20";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

export default function Registration() {
  const [delegates, setDelegates] = useState<Delegate[]>([
    {
      id: 1,
      fullName: "",
      nickname: "",
      age: "",
      sex: "",
      category: "",
      discount: "None",
    },
  ]);

  const [church, setChurch] = useState<ChurchInfo>({
    churchName: "",
    churchAddress: "",
    representativeName: "",
    contactNumber: "",
    emailAddress: "",
    gcashReference: "",
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedReference, setSubmittedReference] = useState("");

  const total = delegates.reduce(
    (sum, delegate) =>
      sum + (delegate.discount === "None" ? 600 : 300),
    0
  );

  const updateChurch = (field: keyof ChurchInfo, value: string) => {
    setChurch((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const addDelegate = () => {
    if (delegates.length >= 100) return;

    setDelegates((previous) => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        fullName: "",
        nickname: "",
        age: "",
        sex: "",
        category: "",
        discount: "None",
      },
    ]);
  };

  const removeDelegate = (id: number) => {
    if (delegates.length === 1) return;

    setDelegates((previous) =>
      previous.filter((delegate) => delegate.id !== id)
    );
  };

  const updateDelegate = (
    id: number,
    field: keyof Delegate,
    value: string
  ) => {
    setDelegates((previous) =>
      previous.map((delegate) =>
        delegate.id === id
          ? { ...delegate, [field]: value }
          : delegate
      )
    );
  };

  const handleReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!receiptFile) {
      setError("Please select your GCash receipt.");
      return;
    }

    setShowReview(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = async () => {
    if (!receiptFile) {
      setError("Please select your GCash receipt.");
      setShowReview(false);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const registration = {
        ...church,
        delegates: delegates.map((delegate) => ({
          fullName: delegate.fullName.trim(),
          nickname: delegate.nickname.trim(),
          age: Number(delegate.age),
          sex: delegate.sex,
          category: delegate.category,
          discount:
            delegate.discount === "None"
              ? "none"
              : delegate.discount === "Pastor's Child"
                ? "pastor_child"
                : delegate.discount === "Missionary's Child"
                  ? "missionary_child"
                  : "bible_school_student",
        })),
      };

      const formData = new FormData();

      formData.append("registration", JSON.stringify(registration));
      formData.append("receipt", receiptFile);

      const response = await fetch("/api/registrations", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Registration submission failed."
        );
      }

      setSubmittedReference(result.registrationId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeFile = (file: File | null) => {
    setReceiptFile(file);
    setError("");
  };

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#20251f]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-sm text-gray-600 hover:text-black">
            ← Home
          </Link>

          <div className="text-right">
            <h1 className="font-bold tracking-wider">YOUTH CAMP 2027</h1>
            <p className="text-[10px] tracking-[0.2em] text-gray-500">
              REGISTRATION
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-16">
        {submittedReference ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm md:p-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#e9f0e9] text-3xl text-[#304b38]">
              ✓
            </div>

            <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#66836b]">
              Registration Received
            </p>

            <h2 className="mb-5 text-3xl font-bold md:text-4xl">
              Thank You!
            </h2>

            <p className="mx-auto max-w-xl leading-relaxed text-gray-600">
              Your church registration has been submitted successfully.
              The finance team will review your GCash payment, and the
              organizers will verify any discount eligibility.
            </p>

            <div className="my-8 rounded-xl bg-[#f3f5f1] p-6">
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Registration Reference
              </p>
              <p className="mt-3 break-all text-sm font-semibold text-[#304b38]">
                {submittedReference}
              </p>
            </div>

            <p className="mb-8 text-sm text-gray-500">
              Please keep this reference for your records.
            </p>

            <Link
              href="/"
              className="inline-block rounded-xl bg-[#304b38] px-8 py-4 font-semibold text-white transition hover:bg-[#243b2c]"
            >
              Back to Home
            </Link>
          </section>
        ) : (
          <>
            <div className="mb-12">
              <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#66836b]">
                Be Part of the Gathering
              </p>

              <h2 className="mb-5 text-4xl font-bold md:text-5xl">
                {showReview ? "Review Registration." : "Church Registration."}
              </h2>

              <p className="max-w-2xl leading-relaxed text-gray-600">
                {showReview
                  ? "Please review all the information carefully before submitting."
                  : "Welcome! Please provide your church information and the details of your delegates. Make sure all information is correct before submitting your registration."}
              </p>
            </div>

            {error && (
              <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}

            {!showReview ? (
              <form className="space-y-10" onSubmit={handleReview}>
                {/* SECTION 1 */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-9">
                  <div className="mb-8">
                    <p className="mb-2 text-xs font-semibold tracking-widest text-[#66836b]">
                      SECTION 01
                    </p>
                    <h3 className="text-2xl font-bold">
                      Church Information
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Tell us about your church and its representative.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Church Name *</label>
                      <input
                        required
                        maxLength={150}
                        className={inputClass}
                        placeholder="Enter your church name"
                        value={church.churchName}
                        onChange={(e) =>
                          updateChurch("churchName", e.target.value)
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>Church Address *</label>
                      <input
                        required
                        minLength={5}
                        maxLength={300}
                        className={inputClass}
                        placeholder="Complete church address"
                        value={church.churchAddress}
                        onChange={(e) =>
                          updateChurch("churchAddress", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Representative's Full Name *
                      </label>
                      <input
                        required
                        maxLength={150}
                        className={inputClass}
                        placeholder="Full name"
                        value={church.representativeName}
                        onChange={(e) =>
                          updateChurch("representativeName", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Contact Number *</label>
                      <input
                        required
                        type="tel"
                        maxLength={20}
                        className={inputClass}
                        placeholder="09XX XXX XXXX"
                        value={church.contactNumber}
                        onChange={(e) =>
                          updateChurch("contactNumber", e.target.value)
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>Email Address *</label>
                      <input
                        required
                        type="email"
                        maxLength={254}
                        className={inputClass}
                        placeholder="example@email.com"
                        value={church.emailAddress}
                        onChange={(e) =>
                          updateChurch("emailAddress", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </section>

                {/* SECTION 2 */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-9">
                  <div className="mb-8">
                    <p className="mb-2 text-xs font-semibold tracking-widest text-[#66836b]">
                      SECTION 02
                    </p>
                    <h3 className="text-2xl font-bold">
                      Delegate Information
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Enter the information of every participant your church
                      will be registering.
                    </p>
                  </div>

                  <div className="mb-6 rounded-xl bg-[#f3f5f1] p-4">
                    <p className="text-sm font-medium text-[#304b38]">
                      Registering multiple delegates?
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Add as many as needed using the button below. Bulk
                      spreadsheet uploading will be added separately.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {delegates.map((delegate, index) => (
                      <div
                        key={delegate.id}
                        className="rounded-xl border border-gray-200 p-5"
                      >
                        <div className="mb-6 flex items-center justify-between">
                          <h4 className="font-semibold">
                            Delegate {index + 1}
                          </h4>

                          {delegates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDelegate(delegate.id)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <label className={labelClass}>Full Name *</label>
                            <input
                              required
                              minLength={2}
                              maxLength={150}
                              className={inputClass}
                              placeholder="Delegate's complete name"
                              value={delegate.fullName}
                              onChange={(e) =>
                                updateDelegate(
                                  delegate.id,
                                  "fullName",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className={labelClass}>
                              Nickname / Name to be Printed on Delegate ID
                              <span className="ml-2 text-xs font-normal text-gray-400">
                                (Optional)
                              </span>
                            </label>

                            <input
                              maxLength={100}
                              className={inputClass}
                              placeholder="Enter preferred name for delegate ID"
                              value={delegate.nickname}
                              onChange={(e) =>
                                updateDelegate(
                                  delegate.id,
                                  "nickname",
                                  e.target.value
                                )
                              }
                            />

                            <p className="mt-2 text-xs text-gray-500">
                              Leave blank if you want your official full name
                              printed on your ID.
                            </p>
                          </div>

                          <div>
                            <label className={labelClass}>Age *</label>
                            <input
                              required
                              type="number"
                              min="1"
                              max="100"
                              className={inputClass}
                              placeholder="Age"
                              value={delegate.age}
                              onChange={(e) =>
                                updateDelegate(
                                  delegate.id,
                                  "age",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div>
                            <label className={labelClass}>Sex *</label>
                            <select
                              required
                              className={inputClass}
                              value={delegate.sex}
                              onChange={(e) =>
                                updateDelegate(
                                  delegate.id,
                                  "sex",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Select sex</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>

                          <div>
                            <label className={labelClass}>Category *</label>
                            <select
                              required
                              className={inputClass}
                              value={delegate.category}
                              onChange={(e) =>
                                updateDelegate(
                                  delegate.id,
                                  "category",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">Select category</option>
                              <option value="Elementary">Elementary</option>
                              <option value="Junior High School">
                                Junior High School
                              </option>
                              <option value="Senior High School">
                                Senior High School
                              </option>
                              <option value="College">College</option>
                              <option value="Career/Working">
                                Career / Working
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className={labelClass}>
                              Discount Eligibility *
                            </label>
                            <select
                              required
                              className={inputClass}
                              value={delegate.discount}
                              onChange={(e) =>
                                updateDelegate(
                                  delegate.id,
                                  "discount",
                                  e.target.value
                                )
                              }
                            >
                              <option value="None">No Discount</option>
                              <option value="Pastor's Child">
                                Pastor's Child
                              </option>
                              <option value="Missionary's Child">
                                Missionary's Child
                              </option>
                              <option value="Bible School Student">
                                Bible School Student
                              </option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                          <span className="text-sm text-gray-500">
                            Registration fee
                          </span>
                          <span className="font-semibold">
                            ₱{delegate.discount === "None" ? "600" : "300"}
                          </span>
                        </div>

                        {delegate.discount !== "None" && (
                          <p className="mt-2 text-xs text-amber-700">
                            Discount eligibility will be subject to organizer
                            verification.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addDelegate}
                    disabled={delegates.length >= 100}
                    className="mt-6 w-full rounded-xl border-2 border-dashed border-[#66836b] px-5 py-4 font-medium text-[#304b38] transition hover:bg-[#f3f5f1] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {delegates.length >= 100
                      ? "Maximum of 100 Delegates"
                      : "+ Add Another Delegate"}
                  </button>
                </section>

                {/* SECTION 3 */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-9">
                  <div className="mb-8">
                    <p className="mb-2 text-xs font-semibold tracking-widest text-[#66836b]">
                      SECTION 03
                    </p>
                    <h3 className="text-2xl font-bold">Payment Summary</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Review the estimated registration fees for your church.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total delegates</span>
                      <span className="font-semibold">{delegates.length}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Regular registration
                      </span>
                      <span>
                        {delegates.filter((d) => d.discount === "None").length}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Discounted registration
                      </span>
                      <span>
                        {delegates.filter((d) => d.discount !== "None").length}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Estimated Total</span>
                        <span className="text-3xl font-bold text-[#304b38]">
                          ₱{total.toLocaleString("en-PH")}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-gray-500">
                      Final fees may be subject to organizer verification of
                      discount eligibility and payment.
                    </p>
                  </div>
                </section>

                {/* SECTION 4 */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-9">
                  <div className="mb-8">
                    <p className="mb-2 text-xs font-semibold tracking-widest text-[#66836b]">
                      SECTION 04
                    </p>
                    <h3 className="text-2xl font-bold">GCash Payment</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Complete your payment and provide the transaction details
                      below.
                    </p>
                  </div>

                  <div className="mb-8 rounded-xl bg-[#f3f5f1] p-5">
                    <h4 className="mb-4 font-semibold text-[#304b38]">
                      Payment Instructions
                    </h4>

                    <p className="mb-5 text-sm leading-relaxed text-gray-600">
                      Please send the total registration fee through GCash.
                      You may pay for all delegates under your church in one
                      transaction.
                    </p>

                    <div className="rounded-xl border border-gray-200 bg-white p-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                        GCash Account Details
                      </p>

                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Account Name</p>
                          <p className="font-semibold">To be announced</p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">GCash Number</p>
                          <p className="font-semibold">To be announced</p>
                        </div>
                      </div>

                      <div className="mt-5 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                        <p className="text-sm font-medium text-gray-500">
                          Official GCash QR Code
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                          QR code will be added once provided by the youth
                          director.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 rounded-xl border border-[#66836b]/30 p-5">
                    <p className="text-sm text-gray-500">
                      Total Amount to Pay
                    </p>
                    <p className="mt-2 text-3xl font-bold text-[#304b38]">
                      ₱{total.toLocaleString("en-PH")}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      This amount covers all {delegates.length} registered
                      delegates.
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className={labelClass}>
                      GCash Reference Number *
                    </label>
                    <input
                      required
                      minLength={6}
                      maxLength={30}
                      className={inputClass}
                      placeholder="Enter your GCash reference number"
                      value={church.gcashReference}
                      onChange={(e) =>
                        updateChurch("gcashReference", e.target.value)
                      }
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      You can find this number in your GCash transaction
                      receipt.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Upload GCash Receipt *
                    </label>
                    <input
                      required
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-[#f3f5f1] file:px-4 file:py-2 file:font-medium file:text-[#304b38]"
                      onChange={(e) =>
                        changeFile(e.target.files?.[0] || null)
                      }
                    />
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      Upload a clear screenshot of your successful GCash
                      transaction. One receipt may cover the entire church
                      registration. Accepted formats: JPG, PNG, and WebP.
                      Maximum file size: 50 MB.
                    </p>

                    {receiptFile && (
                      <p className="mt-3 text-sm text-[#304b38]">
                        Selected file: {receiptFile.name}
                      </p>
                    )}
                  </div>

                  <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
                    <h4 className="font-semibold text-amber-900">
                      Important Payment Notice
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-amber-800">
                      All payments will be manually reviewed by the finance
                      team. Submitting a receipt does not automatically confirm
                      your payment. Discount eligibility will also be verified
                      by the organizers.
                    </p>
                  </div>
                </section>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#304b38] px-6 py-4 font-semibold text-white transition hover:bg-[#243b2c]"
                >
                  Review Registration →
                </button>
              </form>
            ) : (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-9">
                <div className="mb-8">
                  <p className="mb-2 text-xs font-semibold tracking-widest text-[#66836b]">
                    FINAL REVIEW
                  </p>
                  <h3 className="text-2xl font-bold">
                    Review Your Registration
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Please check all the information carefully before
                    submitting.
                  </p>
                </div>

                <div className="mb-8">
                  <h4 className="mb-4 font-semibold text-[#304b38]">
                    Church Information
                  </h4>

                  <div className="space-y-3 text-sm">
                    <p>
                      <span className="text-gray-500">Church:</span>{" "}
                      {church.churchName}
                    </p>
                    <p>
                      <span className="text-gray-500">Address:</span>{" "}
                      {church.churchAddress}
                    </p>
                    <p>
                      <span className="text-gray-500">Representative:</span>{" "}
                      {church.representativeName}
                    </p>
                    <p>
                      <span className="text-gray-500">Contact:</span>{" "}
                      {church.contactNumber}
                    </p>
                    <p>
                      <span className="text-gray-500">Email:</span>{" "}
                      {church.emailAddress}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-8">
                  <h4 className="mb-4 font-semibold text-[#304b38]">
                    Delegate Information ({delegates.length})
                  </h4>

                  <div className="space-y-4">
                    {delegates.map((delegate, index) => (
                      <div
                        key={delegate.id}
                        className="rounded-xl bg-[#f3f5f1] p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <p className="font-semibold">
                            Delegate {index + 1}
                          </p>
                          <p className="font-semibold">
                            ₱{delegate.discount === "None" ? "600" : "300"}
                          </p>
                        </div>

                        <p className="text-sm">{delegate.fullName}</p>

                        <p className="mt-1 text-xs text-gray-500">
                          Name on ID:{" "}
                          {delegate.nickname.trim() || delegate.fullName}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Age: {delegate.age} · {delegate.sex} ·{" "}
                          {delegate.category}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Discount: {delegate.discount}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-200 pt-8">
                  <h4 className="mb-4 font-semibold text-[#304b38]">
                    Payment Information
                  </h4>

                  <div className="space-y-3 text-sm">
                    <p>
                      <span className="text-gray-500">
                        GCash Reference Number:
                      </span>{" "}
                      {church.gcashReference}
                    </p>

                    <p>
                      <span className="text-gray-500">Receipt File:</span>{" "}
                      {receiptFile?.name}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-5">
                    <span className="font-semibold">
                      Total Registration Fee
                    </span>
                    <span className="text-2xl font-bold text-[#304b38]">
                      ₱{total.toLocaleString("en-PH")}
                    </span>
                  </div>
                </div>

                <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm leading-relaxed text-amber-800">
                    Please verify that all information is correct. Your
                    payment and discount eligibility will still be subject to
                    verification by the organizers.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="mt-8 w-full rounded-xl bg-[#304b38] px-6 py-4 font-semibold text-white transition hover:bg-[#243b2c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Submitting Registration..."
                    : "Confirm and Submit Registration →"}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setError("");
                    setShowReview(false);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mt-4 w-full rounded-xl border border-[#66836b] px-5 py-4 font-semibold text-[#304b38] transition hover:bg-[#f3f5f1] disabled:opacity-50"
                >
                  ← Back to Edit Registration
                </button>
              </section>
            )}
          </>
        )}

        <footer className="mt-16 border-t border-gray-200 pt-8 text-center text-xs text-gray-500">
          © 2027 Youth Camp. All Rights Reserved.
        </footer>
      </div>
    </main>
  );
}
