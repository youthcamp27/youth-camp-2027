
import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const instant = false;

function formatStatus(value: string | null | undefined) {
  if (!value) return "Not recorded";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusColor(value: string | null | undefined) {
  const status = (value ?? "").toLowerCase();

  if (
    status === "verified" ||
    status === "approved" ||
    status === "finalized"
  ) {
    return "bg-green-100 text-green-800";
  }

  if (
    status === "pending" ||
    status === "pending_verification" ||
    status === "provisional"
  ) {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-800";
  }

  return "bg-gray-100 text-gray-600";
}

export default async function DelegatesPage() {
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
    { data: delegates, error: delegatesError },
    { data: registrations, error: registrationsError },
    { data: churches, error: churchesError },
    { data: onsiteRegistrations, error: onsiteRegistrationsError },
    { data: onlinePayments, error: onlinePaymentsError },
    { data: onsitePayments, error: onsitePaymentsError },
    { data: additionalPayments, error: additionalPaymentsError },
    { data: assignments, error: assignmentsError },
    { data: groups, error: groupsError },
  ] = await Promise.all([
    supabaseAdmin
      .from("Delegates")
      .select("*")
      .order("Full Name"),

    supabaseAdmin.from("Registrations").select("*"),

    supabaseAdmin.from("Churches").select("*"),

    supabaseAdmin.from("On-Site Registrations").select("*"),

    supabaseAdmin.from("Payments").select("*"),

    supabaseAdmin.from("On-Site Payments").select("*"),

    supabaseAdmin.from("On-Site Additional Payments").select("*"),

    supabaseAdmin.from("Group Assignments").select("*"),

    supabaseAdmin
      .from("Camp Groups")
      .select('id, "Group Name"'),
  ]);

  const errors = [
    delegatesError,
    registrationsError,
    churchesError,
    onsiteRegistrationsError,
    onlinePaymentsError,
    onsitePaymentsError,
    additionalPaymentsError,
    assignmentsError,
    groupsError,
  ].filter(Boolean);

  if (errors.length > 0) {
    console.error("Delegates page database errors:", errors);
    throw new Error("Could not retrieve all delegate records.");
  }

  const allDelegates = delegates ?? [];
  const allRegistrations = registrations ?? [];
  const allChurches = churches ?? [];
  const allOnsiteRegistrations = onsiteRegistrations ?? [];
  const allOnlinePayments = onlinePayments ?? [];
  const allOnsitePayments = onsitePayments ?? [];
  const allAdditionalPayments = additionalPayments ?? [];
  const allAssignments = assignments ?? [];
  const allGroups = groups ?? [];

  const delegateRows = allDelegates.map((delegate) => {
    const isOnsite = Boolean(delegate.onsite_registration_id);

    const registration = isOnsite
      ? null
      : allRegistrations.find(
          (item) => item.id === delegate.registration_id
        );

    const onsiteRegistration = isOnsite
      ? allOnsiteRegistrations.find(
          (item) => item.id === delegate.onsite_registration_id
        )
      : null;

    const church = registration
      ? allChurches.find(
          (item) => item.id === registration.church_id
        )
      : null;

    const churchName =
      church?.["Church Name"] ||
      onsiteRegistration?.["Church Name"] ||
      "Unknown Church";

    const registrationStatus =
      registration?.Status || onsiteRegistration?.Status || null;

    const payment = isOnsite
      ? allOnsitePayments.find(
          (item) =>
            item.registration_id === delegate.onsite_registration_id
        )
      : allOnlinePayments.find(
          (item) => item.registration_id === delegate.registration_id
        );

    const additionalPayment = isOnsite
      ? allAdditionalPayments.find(
          (item) => item.delegate_id === delegate.id
        )
      : null;

    const assignment = allAssignments.find(
      (item) => item.delegate_id === delegate.id
    );

    const group = assignment
      ? allGroups.find((item) => item.id === assignment.group_id)
      : null;

    let discountStatus =
      delegate["Discount Status"] || "not_applicable";

    if (
      isOnsite &&
      discountStatus === "rejected"
    ) {
      discountStatus = additionalPayment
        ? `rejected · top-up ${formatStatus(additionalPayment.Status)}`
        : "rejected · top-up required";
    }

    return {
      id: delegate.id,
      name: delegate["Full Name"] || "Unnamed Delegate",
      age: delegate.Age,
      sex: delegate.Sex || "—",
      occupation: delegate.Occupation || "—",
      churchName,
      registrationType: isOnsite ? "Walk-in" : "Online",
      registrationStatus,
      paymentStatus: payment?.Status || null,
      discountStatus,
      groupName: group?.["Group Name"] || null,
      assignmentStatus: assignment?.["Assignment Status"] || null,
    };
  });

  const onlineCount = delegateRows.filter(
    (delegate) => delegate.registrationType === "Online"
  ).length;

  const onsiteCount = delegateRows.filter(
    (delegate) => delegate.registrationType === "Walk-in"
  ).length;

  const assignedCount = delegateRows.filter(
    (delegate) => delegate.groupName
  ).length;

  const formatDate = (value: string | null | undefined) =>
    value
      ? new Date(value).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#20251f]">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#66836b]">
              YOUTH CAMP 2027
            </p>
            <h1 className="mt-1 text-xl font-bold">
              Delegate Management
            </h1>
          </div>

          <Link
            href="/admin"
            className="text-sm font-medium text-gray-500 hover:text-[#304b38]"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#66836b]">
            MANAGEMENT CENTER
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            All Delegates
          </h2>

          <p className="mt-2 text-gray-500">
            Monitor online and walk-in participants, their registration
            records, payments, discounts, and camp group assignments.
          </p>
        </div>

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Delegates",
              value: delegateRows.length,
            },
            {
              label: "Online Delegates",
              value: onlineCount,
            },
            {
              label: "Walk-in Delegates",
              value: onsiteCount,
            },
            {
              label: "Assigned to Groups",
              value: assignedCount,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-[#304b38]">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h3 className="font-bold">Delegate Records</h3>
            <p className="mt-1 text-sm text-gray-500">
              All participants from online pre-registration and on-site
              walk-in registration.
            </p>
          </div>

          {delegateRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f7f8f5] text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-4">Delegate</th>
                    <th className="px-5 py-4">Church</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Registration</th>
                    <th className="px-5 py-4">Payment</th>
                    <th className="px-5 py-4">Discount</th>
                    <th className="px-5 py-4">Camp Group</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {delegateRows.map((delegate) => (
                    <tr
                      key={delegate.id}
                      className="align-top hover:bg-gray-50"
                    >
                      <td className="px-5 py-5">
                        <p className="font-semibold">
                          {delegate.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Age {delegate.age ?? "—"} · {delegate.sex}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {delegate.occupation}
                        </p>
                      </td>

                      <td className="px-5 py-5 font-medium">
                        {delegate.churchName}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            delegate.registrationType === "Walk-in"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {delegate.registrationType}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(
                            delegate.registrationStatus
                          )}`}
                        >
                          {formatStatus(delegate.registrationStatus)}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(
                            delegate.paymentStatus
                          )}`}
                        >
                          {formatStatus(delegate.paymentStatus)}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColor(
                            delegate.discountStatus.startsWith("rejected")
                              ? "rejected"
                              : delegate.discountStatus
                          )}`}
                        >
                          {formatStatus(delegate.discountStatus)}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        {delegate.groupName ? (
                          <>
                            <p className="font-semibold">
                              {delegate.groupName}
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                              {formatStatus(delegate.assignmentStatus)}
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-400">
                            Not assigned
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-gray-600">
                No delegates registered yet.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Online and walk-in delegates will appear here once registered.
              </p>
            </div>
          )}
        </section>

        <p className="mt-4 text-xs text-gray-400">
          Payment and discount statuses are displayed for monitoring.
          Use their respective management pages to verify submissions.
        </p>
      </div>
    </main>
  );
}
