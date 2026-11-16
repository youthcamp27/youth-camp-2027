
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const instant = false;

function formatStatus(value: string | null | undefined) {
  if (!value) return "—";

  const labels: Record<string, string> = {
    pending_verification: "Pending",
    verified: "Verified",
    rejected: "Rejected",
    unpaid: "Unpaid",
  };

  return (
    labels[value.toLowerCase()] ??
    value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

function statusStyle(value: string | null | undefined) {
  const status = value?.toLowerCase();

  if (status === "verified") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";

  if (status === "pending" || status === "pending_verification") {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-gray-100 text-gray-700";
}

function formatDate(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
}

function discountLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    none: "No Discount",
    pastor_child: "Pastor's Child",
    missionary_child: "Missionary's Child",
    bible_school_student: "Bible School Student",
  };

  return value ? labels[value] ?? value : "—";
}

function discountStatusLabel(value: string | null | undefined) {
  if (!value || value === "not_applicable") return "Not Applicable";
  return formatStatus(value);
}

export default async function RegistrationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id } = await params;

  // First, check whether this is an online registration.
  const { data: onlineRegistration, error: onlineError } =
    await supabaseAdmin
      .from("Registrations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (onlineError) {
    console.error("Online registration retrieval error:", onlineError.message);
    throw new Error("Could not retrieve registration.");
  }

  // ONLINE REGISTRATION DETAILS
  if (onlineRegistration) {
    const [
      { data: church, error: churchError },
      { data: delegates, error: delegatesError },
      { data: payments, error: paymentsError },
    ] = await Promise.all([
      supabaseAdmin
        .from("Churches")
        .select("*")
        .eq("id", onlineRegistration.church_id)
        .maybeSingle(),
      supabaseAdmin
        .from("Delegates")
        .select("*")
        .eq("registration_id", id)
        .order("Full Name", { ascending: true }),
      supabaseAdmin
        .from("Payments")
        .select("*")
        .eq("registration_id", id)
        .order("Timestamp", { ascending: false }),
    ]);

    if (churchError || delegatesError || paymentsError) {
      console.error("Online details errors:", {
        churchError,
        delegatesError,
        paymentsError,
      });
      throw new Error("Could not retrieve all registration details.");
    }

    const latestPayment = payments?.[0];

    return (
      <main className="min-h-screen bg-[#f7f8f5] text-[#20251f]">
        <header className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#66836b]">
                YOUTH CAMP 2027
              </p>
              <h1 className="mt-1 text-xl font-bold">Registration Details</h1>
            </div>
            <Link
              href="/admin/registrations"
              className="text-sm font-medium text-gray-500 hover:text-[#304b38]"
            >
              ← Church List
            </Link>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="mb-8">
            <p className="text-sm font-medium text-[#66836b]">
              ONLINE REGISTRATION
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              {church?.["Church Name"] ?? "Church Information"}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Submitted {formatDate(onlineRegistration.Timestamp)}
            </p>
          </div>

          <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold">Church Information</h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-400">Church Name</p>
                <p className="mt-1 font-medium">{church?.["Church Name"] ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Church Address</p>
                <p className="mt-1 font-medium">{church?.["Church Address"] ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Delegation Head</p>
                <p className="mt-1 font-medium">{church?.["Delegation Head Name"] ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Contact Number</p>
                <p className="mt-1 font-medium">{church?.["Contact No."] ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Email Address</p>
                <p className="mt-1 font-medium">{church?.["Email Address"] || "Not provided"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Submission Type</p>
                <p className="mt-1 font-medium">
                  {onlineRegistration["Submission Type"]
                    ?.replace(/_/g, " ")
                    .replace(/\b\w/g, (letter: string) => letter.toUpperCase()) ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Registration Status</p>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(onlineRegistration.Status)}`}>
                  {formatStatus(onlineRegistration.Status)}
                </span>
              </div>
            </div>
          </section>

          <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5">
              <h3 className="text-lg font-bold">Delegate List</h3>
              <p className="mt-1 text-sm text-gray-500">
                {delegates?.length ?? 0} registered delegates
              </p>
            </div>

            {delegates && delegates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f7f8f5] text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-4">Name</th>
                      <th className="px-5 py-4">Age</th>
                      <th className="px-5 py-4">Sex</th>
                      <th className="px-5 py-4">Category</th>
                      <th className="px-5 py-4">Discount</th>
                      <th className="px-5 py-4">Discount Status</th>
                      <th className="px-5 py-4">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {delegates.map((delegate) => {
                      const discountStatus =
                        !delegate["Discount Type"] ||
                        delegate["Discount Type"] === "none"
                          ? "not_applicable"
                          : delegate["Discount Status"] ??
                            (delegate["Discount Verification"] ? "verified" : "pending");

                      return (
                        <tr key={delegate.id}>
                          <td className="px-5 py-4 font-medium">{delegate["Full Name"]}</td>
                          <td className="px-5 py-4">{delegate.Age}</td>
                          <td className="px-5 py-4">{delegate.Sex}</td>
                          <td className="px-5 py-4">{delegate.Occupation ?? "—"}</td>
                          <td className="px-5 py-4">{discountLabel(delegate["Discount Type"])}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(discountStatus)}`}>
                              {discountStatusLabel(discountStatus)}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-semibold">
                            ₱{Number(delegate["Registration Fee"]).toLocaleString("en-PH")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="p-8 text-center text-sm text-gray-500">No delegates found.</p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-lg font-bold">Payment Information</h3>
            {latestPayment ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-400">Amount Submitted</p>
                  <p className="mt-1 text-xl font-bold">
                    ₱{Number(latestPayment.Amount).toLocaleString("en-PH")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Payment Status</p>
                  <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(latestPayment.Status)}`}>
                    {formatStatus(latestPayment.Status)}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">GCash Reference</p>
                  <p className="mt-1 font-medium">{latestPayment["GCash Reference"] || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Payment Submitted</p>
                  <p className="mt-1 font-medium">{formatDate(latestPayment.Timestamp)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No payment record found.</p>
            )}
            {payments && payments.length > 1 && (
              <p className="mt-5 text-xs text-gray-400">
                {payments.length} payment records found. The latest is shown above.
              </p>
            )}
          </section>
        </div>
      </main>
    );
  }

  // If it is not an online registration, check the on-site registrations.
  const { data: onsiteRegistration, error: onsiteError } =
    await supabaseAdmin
      .from("On-Site Registrations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (onsiteError) {
    console.error("On-site registration retrieval error:", onsiteError.message);
    throw new Error("Could not retrieve on-site registration.");
  }

  if (!onsiteRegistration) notFound();

  const [
    { data: onsiteDelegates, error: onsiteDelegatesError },
    { data: onsitePayments, error: onsitePaymentsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("Delegates")
      .select("*")
      .eq("onsite_registration_id", id)
      .order("Full Name", { ascending: true }),
    supabaseAdmin
      .from("On-Site Payments")
      .select("*")
      .eq("registration_id", id)
      .order("Timestamp", { ascending: false }),
  ]);

  if (onsiteDelegatesError || onsitePaymentsError) {
    console.error("On-site details errors:", {
      onsiteDelegatesError,
      onsitePaymentsError,
    });
    throw new Error("Could not retrieve on-site registration details.");
  }

  const delegateIds = (onsiteDelegates ?? []).map((delegate) => delegate.id);

  const { data: additionalPayments, error: additionalPaymentsError } =
    delegateIds.length > 0
      ? await supabaseAdmin
          .from("On-Site Additional Payments")
          .select("*")
          .in("delegate_id", delegateIds)
      : { data: [], error: null };

  if (additionalPaymentsError) {
    console.error("Additional payment retrieval error:", additionalPaymentsError.message);
    throw new Error("Could not retrieve additional payment information.");
  }

  const latestOnsitePayment = onsitePayments?.[0];

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#20251f]">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#66836b]">
              YOUTH CAMP 2027
            </p>
            <h1 className="mt-1 text-xl font-bold">Registration Details</h1>
          </div>
          <Link
            href="/admin/registrations"
            className="text-sm font-medium text-gray-500 hover:text-[#304b38]"
          >
            ← Church List
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-700">WALK-IN REGISTRATION</p>
          <h2 className="mt-2 text-3xl font-bold">
            {onsiteRegistration["Church Name"] ?? "Church Information"}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Submitted {formatDate(onsiteRegistration.Timestamp)}
          </p>
        </div>

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-bold">Church Information</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-400">Church Name</p>
              <p className="mt-1 font-medium">{onsiteRegistration["Church Name"] || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Church Address</p>
              <p className="mt-1 font-medium">{onsiteRegistration["Church Address"] || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Representative</p>
              <p className="mt-1 font-medium">
                {onsiteRegistration["Delegation Head Name"] ||
                  onsiteRegistration["Registered By"] ||
                  "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Contact Number</p>
              <p className="mt-1 font-medium">{onsiteRegistration["Contact No."] || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Email Address</p>
              <p className="mt-1 font-medium">{onsiteRegistration["Email Address"] || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Registration Status</p>
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(onsiteRegistration.Status)}`}>
                {formatStatus(onsiteRegistration.Status)}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400">Registered By</p>
              <p className="mt-1 font-medium">{onsiteRegistration["Registered By"] || "—"}</p>
            </div>
          </div>
          {onsiteRegistration.Notes && (
            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-400">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{onsiteRegistration.Notes}</p>
            </div>
          )}
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h3 className="text-lg font-bold">Delegate List</h3>
            <p className="mt-1 text-sm text-gray-500">
              {onsiteDelegates?.length ?? 0} registered delegates
            </p>
          </div>

          {onsiteDelegates && onsiteDelegates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f7f8f5] text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Age</th>
                    <th className="px-5 py-4">Sex</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Discount</th>
                    <th className="px-5 py-4">Discount Status</th>
                    <th className="px-5 py-4">Fee</th>
                    <th className="px-5 py-4">Additional Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {onsiteDelegates.map((delegate) => {
                    const discountStatus =
                      !delegate["Discount Type"] ||
                      delegate["Discount Type"] === "none"
                        ? "not_applicable"
                        : delegate["Discount Status"] ??
                          (delegate["Discount Verification"] ? "verified" : "pending");

                    const additionalPayment = (additionalPayments ?? []).find(
                      (payment) => payment.delegate_id === delegate.id
                    );

                    return (
                      <tr key={delegate.id}>
                        <td className="px-5 py-4 font-medium">{delegate["Full Name"]}</td>
                        <td className="px-5 py-4">{delegate.Age}</td>
                        <td className="px-5 py-4">{delegate.Sex}</td>
                        <td className="px-5 py-4">{delegate.Occupation ?? "—"}</td>
                        <td className="px-5 py-4">{discountLabel(delegate["Discount Type"])}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(discountStatus)}`}>
                            {discountStatusLabel(discountStatus)}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          ₱{Number(delegate["Registration Fee"]).toLocaleString("en-PH")}
                        </td>
                        <td className="px-5 py-4">
                          {additionalPayment ? (
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(additionalPayment.Status)}`}>
                              {formatStatus(additionalPayment.Status)}
                            </span>
                          ) : discountStatus === "rejected" ? (
                            "Required — not recorded"
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-gray-500">No delegates found.</p>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-bold">On-Site Payment Information</h3>
          {latestOnsitePayment ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-400">Amount Submitted</p>
                <p className="mt-1 text-xl font-bold">
                  ₱{Number(latestOnsitePayment.Amount).toLocaleString("en-PH")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Payment Method</p>
                <p className="mt-1 font-medium">{latestOnsitePayment["Payment Method"] || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Payment Status</p>
                <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(latestOnsitePayment.Status)}`}>
                  {formatStatus(latestOnsitePayment.Status)}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400">GCash Reference</p>
                <p className="mt-1 font-medium">{latestOnsitePayment["GCash Reference"] || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Payment Submitted</p>
                <p className="mt-1 font-medium">{formatDate(latestOnsitePayment.Timestamp)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No on-site payment record found.</p>
          )}
          {onsitePayments && onsitePayments.length > 1 && (
            <p className="mt-5 text-xs text-gray-400">
              {onsitePayments.length} payment records found. The latest is shown above.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
