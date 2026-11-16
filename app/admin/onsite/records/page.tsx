
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import OnsitePaymentActions from "../onsite-payment-actions";
import OnsiteDelegateActions from "../onsite-delegate-actions";

export const instant = false;

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not Available";

  const labels: Record<string, string> = {
    pending_verification: "Pending Verification",
    verified: "Verified",
    rejected: "Rejected",
    not_applicable: "Not Applicable",
    pastor_child: "Pastor's Child",
    missionary_child: "Missionary's Child",
    bible_school_student: "Bible School Student",
    none: "No Discount",
  };

  if (labels[value]) return labels[value];

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusStyle(status: string | null | undefined) {
  switch (status) {
    case "verified":
      return "bg-green-50 text-green-700";
    case "rejected":
      return "bg-red-50 text-red-700";
    case "pending_verification":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default async function OnsiteRecordsPage() {
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const email = data?.claims?.email;

  if (
    error ||
    typeof email !== "string" ||
    !process.env.ADMIN_EMAIL ||
    email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()
  ) {
    redirect("/admin/login");
  }

  const [
    { data: registrations, error: registrationsError },
    { data: delegates, error: delegatesError },
    { data: payments, error: paymentsError },
    { data: additionalPayments, error: additionalPaymentsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("On-Site Registrations")
      .select(
        'id, "Church Name", "Church Address", "Delegation Head Name", "Contact No.", "Email Address", "Registered By", "Notes", "Status", "Timestamp"'
      )
      .order("Timestamp", { ascending: false }),

    supabaseAdmin
      .from("Delegates")
      .select(
        'id, onsite_registration_id, "Full Name", "Age", "Sex", "Occupation", "Discount Type", "Discount Verification", "Registration Fee", "Discount Status", "Timestamp"'
      )
      .not("onsite_registration_id", "is", null)
      .order("Timestamp", { ascending: true }),

    supabaseAdmin
      .from("On-Site Payments")
      .select(
        'id, registration_id, "Amount", "Payment Method", "GCash Reference", "Status", "Timestamp"'
      ),

    supabaseAdmin
      .from("On-Site Additional Payments")
      .select(
        'id, delegate_id, registration_id, amount, "Payment Method", "GCash Reference", "Status"'
      ),
  ]);

  const hasError =
    registrationsError ||
    delegatesError ||
    paymentsError ||
    additionalPaymentsError;

  if (hasError) {
    console.error("On-site records errors:", {
      registrationsError: registrationsError?.message,
      delegatesError: delegatesError?.message,
      paymentsError: paymentsError?.message,
      additionalPaymentsError: additionalPaymentsError?.message,
    });
  }

  const registrationRecords = (registrations ?? []).map((registration) => ({
    ...registration,
    delegates: (delegates ?? [])
      .filter(
        (delegate) =>
          delegate.onsite_registration_id === registration.id
      )
      .map((delegate) => ({
        ...delegate,
        additionalPayment:
          (additionalPayments ?? []).find(
            (payment) => payment.delegate_id === delegate.id
          ) ?? null,
      })),
    payment:
      (payments ?? []).find(
        (payment) => payment.registration_id === registration.id
      ) ?? null,
  }));

  const totalDelegates = delegates?.length ?? 0;
  const pendingPayments = (payments ?? []).filter(
    (payment) => payment.Status === "pending_verification"
  ).length;
  const verifiedPayments = (payments ?? []).filter(
    (payment) => payment.Status === "verified"
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#20251f]">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#66836b]">
              YOUTH CAMP 2027
            </p>
            <h1 className="mt-1 text-xl font-bold">
              On-Site Records
            </h1>
          </div>

          <Link
            href="/admin/onsite"
            className="text-sm font-medium text-gray-500 hover:text-[#304b38]"
          >
            ← On-Site Registration
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#66836b]">
            WALK-IN MANAGEMENT
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Registration Records
          </h2>
          <p className="mt-2 max-w-2xl text-gray-500">
            Review walk-in churches, representatives, delegates,
            registration payments, and discount verification.
          </p>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Walk-in Registrations",
              value: registrations?.length ?? 0,
            },
            {
              label: "Walk-in Delegates",
              value: totalDelegates,
            },
            {
              label: "Pending Payments",
              value: pendingPayments,
            },
            {
              label: "Verified Payments",
              value: verifiedPayments,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold text-[#304b38]">
                {hasError ? "—" : stat.value}
              </p>
            </div>
          ))}
        </div>

        {hasError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Some records could not be loaded. Check the VS Code terminal
            for the database error details.
          </div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-bold">
              All Walk-in Registrations
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a record to review its church information,
              delegates, and payment details.
            </p>
          </div>

          {registrationRecords.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
              <p className="font-semibold text-gray-600">
                No walk-in registrations yet.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                New submissions from the on-site registration form
                will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {registrationRecords.map((registration) => (
                <article
                  key={registration.id}
                  className="rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-gray-400">
                        CHURCH
                      </p>
                      <h4 className="mt-1 text-xl font-bold text-[#304b38]">
                        {registration["Church Name"] || "Not Provided"}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {registration["Church Address"] || "Address not provided"}
                      </p>
                    </div>

                    <div className="flex flex-wrap content-start gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                          registration.Status
                        )}`}
                      >
                        Registration: {formatLabel(registration.Status)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(
                          registration.payment?.Status
                        )}`}
                      >
                        Payment: {formatLabel(registration.payment?.Status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 rounded-lg bg-[#f7f8f5] p-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        DELEGATION HEAD / REPRESENTATIVE
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {registration["Delegation Head Name"] || "Not Provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        CONTACT NUMBER
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {registration["Contact No."] || "Not Provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        EMAIL ADDRESS
                      </p>
                      <p className="mt-1 break-all text-sm font-semibold">
                        {registration["Email Address"] || "Not Provided"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-400">
                        REGISTERED BY
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {registration["Registered By"] || "Not Provided"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-400">
                      REGISTRATION ID
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-gray-600">
                      {registration.id}
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {registration.Timestamp
                        ? new Date(registration.Timestamp).toLocaleString("en-PH")
                        : "Date unavailable"}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <h5 className="mb-3 text-sm font-bold">
                      Delegates ({registration.delegates.length})
                    </h5>

                    {registration.delegates.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        No delegates found for this registration.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {registration.delegates.map((delegate) => (
                          <div
                            key={delegate.id}
                            className="rounded-lg bg-[#f7f8f5] p-4"
                          >
                            <div className="flex flex-col justify-between gap-2 sm:flex-row">
                              <div>
                                <p className="font-semibold">
                                  {delegate["Full Name"]}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Age {delegate.Age} · {delegate.Sex} ·{" "}
                                  {delegate.Occupation}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Discount:{" "}
                                  {formatLabel(delegate["Discount Type"])} ·{" "}
                                  {formatLabel(delegate["Discount Status"])}
                                </p>
                              </div>

                              <div className="sm:text-right">
                                <p className="font-bold text-[#304b38]">
                                  ₱
                                  {Number(
                                    delegate["Registration Fee"]
                                  ).toLocaleString("en-PH")}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Registration Fee
                                </p>
                              </div>
                            </div>

                            {delegate["Discount Type"] !== "none" && (
                              <OnsiteDelegateActions
                                delegateId={delegate.id}
                                discountStatus={delegate["Discount Status"]}
                                additionalPayment={delegate.additionalPayment}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-lg border border-gray-200 p-4">
                    <h5 className="text-sm font-bold">
                      Combined Registration Payment
                    </h5>

                    {registration.payment ? (
                      <>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-gray-400">Amount</p>
                            <p className="mt-1 text-lg font-bold text-[#304b38]">
                              ₱
                              {Number(
                                registration.payment.Amount
                              ).toLocaleString("en-PH")}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-400">
                              Payment Method
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {registration.payment["Payment Method"]}
                            </p>
                          </div>

                          {registration.payment["Payment Method"] === "GCash" && (
                            <div className="sm:col-span-2">
                              <p className="text-xs text-gray-400">
                                GCash Reference
                              </p>
                              <p className="mt-1 break-all text-sm font-medium">
                                {registration.payment["GCash Reference"] ||
                                  "Not Provided"}
                              </p>
                            </div>
                          )}
                        </div>

                        <OnsitePaymentActions
                          registrationId={registration.id}
                          paymentStatus={registration.payment.Status}
                        />
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-red-600">
                        No payment record found.
                      </p>
                    )}
                  </div>

                  {registration.Notes && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-gray-400">
                        NOTES
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        {registration.Notes}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          Youth Camp 2027 Organizer Portal
        </footer>
      </div>
    </main>
  );
}
