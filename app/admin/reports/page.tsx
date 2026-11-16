
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const instant = false;

type Row = Record<string, any>;

function money(value: number) {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function countBy(items: Row[], key: string) {
  return items.reduce<Record<string, number>>((result, item) => {
    const value = String(item[key] || "Not specified");
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function sumAmount(items: Row[], key: string) {
  return items.reduce(
    (total, item) => total + (Number(item[key]) || 0),
    0,
  );
}

function formatLabel(value: string) {
  const labels: Record<string, string> = {
    pastor_child: "Pastor's Child",
    missionary_child: "Missionary's Child",
    bible_school_student: "Bible School Student",
    none: "No Discount",
    pending: "Pending",
    verified: "Verified",
    rejected: "Rejected",
    pending_verification: "Pending Verification",
    provisional: "Provisional",
    finalized: "Finalized",
  };

  return (
    labels[value] ||
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    )
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-[#304b38]">{value}</p>
      <p className="mt-2 text-xs text-gray-400">{description}</p>
    </div>
  );
}

function ReportSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-bold">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Breakdown({
  title,
  items,
}: {
  title: string;
  items: Record<string, number>;
}) {
  const entries = Object.entries(items);

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-gray-700">{title}</h4>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-400">No records available.</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([label, value]) => (
            <div key={label}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="text-gray-600">{formatLabel(label)}</span>
                <span className="font-semibold text-[#304b38]">{value}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#66836b]"
                  style={{
                    width: `${
                      entries.length
                        ? (value / Math.max(...entries.map((entry) => entry[1]), 1)) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function ReportsPage() {
  await connection();

  const supabase = await createClient();
  const { data: authData, error: authError } =
    await supabase.auth.getClaims();

  const email = authData?.claims?.email;

  if (
    authError ||
    typeof email !== "string" ||
    !process.env.ADMIN_EMAIL ||
    email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase()
  ) {
    redirect("/admin/login");
  }

  const [
    churchesResult,
    registrationsResult,
    onsiteRegistrationsResult,
    delegatesResult,
    paymentsResult,
    onsitePaymentsResult,
    additionalPaymentsResult,
    assignmentsResult,
    groupsResult,
  ] = await Promise.all([
    supabaseAdmin.from("Churches").select("*"),
    supabaseAdmin.from("Registrations").select("*"),
    supabaseAdmin.from("On-Site Registrations").select("*"),
    supabaseAdmin.from("Delegates").select("*"),
    supabaseAdmin.from("Payments").select("*"),
    supabaseAdmin.from("On-Site Payments").select("*"),
    supabaseAdmin.from("On-Site Additional Payments").select("*"),
    supabaseAdmin.from("Group Assignments").select("*"),
    supabaseAdmin.from("Camp Groups").select("*"),
  ]);

  const errors = [
    churchesResult.error,
    registrationsResult.error,
    onsiteRegistrationsResult.error,
    delegatesResult.error,
    paymentsResult.error,
    onsitePaymentsResult.error,
    additionalPaymentsResult.error,
    assignmentsResult.error,
    groupsResult.error,
  ].filter(Boolean);

  if (errors.length) {
    console.error("Reports page database errors:", errors);
  }

  const churches: Row[] = churchesResult.data ?? [];
  const registrations: Row[] = registrationsResult.data ?? [];
  const onsiteRegistrations: Row[] = onsiteRegistrationsResult.data ?? [];
  const delegates: Row[] = delegatesResult.data ?? [];
  const payments: Row[] = paymentsResult.data ?? [];
  const onsitePayments: Row[] = onsitePaymentsResult.data ?? [];
  const additionalPayments: Row[] = additionalPaymentsResult.data ?? [];
  const assignments: Row[] = assignmentsResult.data ?? [];
  const groups: Row[] = groupsResult.data ?? [];

  // Match each delegate to their church and registration type.
  const delegateRecords: Row[] = delegates.map((delegate): Row => {
    const isOnsite = Boolean(delegate.onsite_registration_id);

    const onlineRegistration = registrations.find(
      (registration) => registration.id === delegate.registration_id,
    );

    const onsiteRegistration = onsiteRegistrations.find(
      (registration) =>
        registration.id === delegate.onsite_registration_id,
    );

    const onlineChurch = churches.find(
      (church) => church.id === onlineRegistration?.church_id,
    );

    const churchName = isOnsite
      ? onsiteRegistration?.["Church Name"]
      : onlineChurch?.["Church Name"];

    const assignment = assignments.find(
      (item) => item.delegate_id === delegate.id,
    );

    const assignedGroup = groups.find(
      (group) => group.id === assignment?.group_id,
    );

    return {
      ...delegate,
      churchName: churchName || "Unknown Church",
      registrationType: isOnsite ? "Walk-in" : "Online",
      assignment,
      groupName: assignedGroup?.["Group Name"] || "Unassigned",
    };
  });

  // Registration and church summary.
  const uniqueChurchNames = new Set(
    [
      ...churches.map((church) => church["Church Name"]),
      ...onsiteRegistrations.map(
        (registration) => registration["Church Name"],
      ),
    ]
      .filter(Boolean)
      .map((name) => String(name).trim().toLowerCase()),
  );

  const churchDelegateCounts = Object.values(
    delegateRecords.reduce<Record<string, number>>((result, delegate) => {
      result[delegate.churchName] =
        (result[delegate.churchName] || 0) + 1;
      return result;
    }, {}),
  );

  const churchReports = Object.entries(
    delegateRecords.reduce<Record<string, number>>((result, delegate) => {
      result[delegate.churchName] =
        (result[delegate.churchName] || 0) + 1;
      return result;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  // Delegate demographics.
  const sexBreakdown = countBy(delegateRecords, "Sex");
  const occupationBreakdown = countBy(delegateRecords, "Occupation");

  const ages = delegateRecords
    .map((delegate) => Number(delegate.Age))
    .filter((age) => Number.isFinite(age) && age > 0);

  const averageAge = ages.length
    ? (ages.reduce((total, age) => total + age, 0) / ages.length).toFixed(1)
    : "N/A";

  // Financial summary.
  const allBasePayments = [...payments, ...onsitePayments];

  const verifiedPayments = allBasePayments.filter(
    (payment) => payment.Status === "verified",
  );

  const pendingPayments = allBasePayments.filter(
    (payment) => payment.Status === "pending_verification",
  );

  const rejectedPayments = allBasePayments.filter(
    (payment) => payment.Status === "rejected",
  );

  const verifiedAdditionalPayments = additionalPayments.filter(
    (payment) => payment.Status === "verified",
  );

  const pendingAdditionalPayments = additionalPayments.filter(
    (payment) => payment.Status === "pending_verification",
  );

  const rejectedAdditionalPayments = additionalPayments.filter(
    (payment) => payment.Status === "rejected",
  );

  const recordedDelegateFees = sumAmount(
    delegates,
    "Registration Fee",
  );

  const verifiedBaseAmount = sumAmount(verifiedPayments, "Amount");
  const pendingBaseAmount = sumAmount(pendingPayments, "Amount");
  const rejectedBaseAmount = sumAmount(rejectedPayments, "Amount");

  const verifiedAdditionalAmount = sumAmount(
    verifiedAdditionalPayments,
    "amount",
  );

  const pendingAdditionalAmount = sumAmount(
    pendingAdditionalPayments,
    "amount",
  );

  const rejectedAdditionalAmount = sumAmount(
    rejectedAdditionalPayments,
    "amount",
  );

  const totalVerifiedReceived =
    verifiedBaseAmount + verifiedAdditionalAmount;

  // Discount summary.
  const discountBreakdown = countBy(delegates, "Discount Type");
  const discountStatusBreakdown = countBy(delegates, "Discount Status");

  const rejectedDiscounts = delegates.filter(
    (delegate) => delegate["Discount Status"] === "rejected",
  );

  // Group assignment summary.
  const provisionalAssignments = assignments.filter(
    (assignment) => assignment["Assignment Status"] === "provisional",
  );

  const finalizedAssignments = assignments.filter(
    (assignment) => assignment["Assignment Status"] === "finalized",
  );

  const assignedDelegateIds = new Set(
    assignments.map((assignment) => assignment.delegate_id),
  );

  const unassignedCount = delegates.filter(
    (delegate) => !assignedDelegateIds.has(delegate.id),
  ).length;

  const activeGroups = groups.filter((group) => group["Is Active"]);

  const groupReports = activeGroups.map((group) => {
    const groupAssignments = assignments.filter(
      (assignment) => assignment.group_id === group.id,
    );

    return {
      name: group["Group Name"],
      provisional: groupAssignments.filter(
        (assignment) => assignment["Assignment Status"] === "provisional",
      ).length,
      finalized: groupAssignments.filter(
        (assignment) => assignment["Assignment Status"] === "finalized",
      ).length,
      total: groupAssignments.length,
    };
  });

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#20251f]">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#66836b]">
              YOUTH CAMP 2027
            </p>
            <h1 className="mt-1 text-xl font-bold">Reports & Analytics</h1>
          </div>

          <Link
            href="/admin"
            className="text-sm font-medium text-gray-500 hover:text-[#304b38]"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10">
        <div>
          <p className="text-sm font-medium text-[#66836b]">
            CAMP OVERVIEW
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Reports Dashboard
          </h2>
          <p className="mt-2 max-w-3xl text-gray-500">
            View consolidated statistics for online pre-registrations and
            on-site walk-in registrations.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Some report data could not be retrieved. Check the VS Code
            terminal for database error details. Some totals may be incomplete.
          </div>
        )}

        <section>
          <h3 className="mb-5 text-lg font-bold">Registration Summary</h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Churches"
              value={uniqueChurchNames.size}
              description="Unique churches across both registration types"
            />
            <StatCard
              label="Online Registrations"
              value={registrations.length}
              description="Church pre-registration submissions"
            />
            <StatCard
              label="Walk-in Registrations"
              value={onsiteRegistrations.length}
              description="On-site registration submissions"
            />
            <StatCard
              label="Total Delegates"
              value={delegates.length}
              description="All online and walk-in participants"
            />
          </div>
        </section>

        <ReportSection
          title="Delegate Summary"
          description="Participant demographics and registration types."
        >
          <div className="mb-6 grid gap-5 sm:grid-cols-3">
            <div className="rounded-xl bg-[#f7f8f5] p-4">
              <p className="text-sm text-gray-500">Online Delegates</p>
              <p className="mt-2 text-2xl font-bold text-[#304b38]">
                {delegateRecords.filter(
                  (delegate) => delegate.registrationType === "Online",
                ).length}
              </p>
            </div>
            <div className="rounded-xl bg-[#f7f8f5] p-4">
              <p className="text-sm text-gray-500">Walk-in Delegates</p>
              <p className="mt-2 text-2xl font-bold text-[#304b38]">
                {delegateRecords.filter(
                  (delegate) => delegate.registrationType === "Walk-in",
                ).length}
              </p>
            </div>
            <div className="rounded-xl bg-[#f7f8f5] p-4">
              <p className="text-sm text-gray-500">Average Age</p>
              <p className="mt-2 text-2xl font-bold text-[#304b38]">
                {averageAge}
              </p>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Breakdown title="Sex Distribution" items={sexBreakdown} />
            <Breakdown
              title="Occupation Distribution"
              items={occupationBreakdown}
            />
          </div>
        </ReportSection>

        <ReportSection
          title="Financial Report"
          description="Payment amounts are separated by verification status. Additional on-site payments are included."
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-[#f7f8f5] p-4">
              <p className="text-sm text-gray-500">Recorded Delegate Fees</p>
              <p className="mt-2 text-2xl font-bold text-[#304b38]">
                {money(recordedDelegateFees)}
              </p>
            </div>
            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm text-green-700">Verified Payments Received</p>
              <p className="mt-2 text-2xl font-bold text-green-800">
                {money(totalVerifiedReceived)}
              </p>
              <p className="mt-1 text-xs text-green-700">
                Includes verified additional payments
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Pending Payments</p>
              <p className="mt-2 text-2xl font-bold text-amber-800">
                {money(pendingBaseAmount + pendingAdditionalAmount)}
              </p>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-sm text-red-700">Rejected Payments</p>
              <p className="mt-2 text-2xl font-bold text-red-800">
                {money(rejectedBaseAmount + rejectedAdditionalAmount)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Verified Payment Records</p>
              <p className="mt-2 text-2xl font-bold">
                {verifiedPayments.length + verifiedAdditionalPayments.length}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Pending Payment Records</p>
              <p className="mt-2 text-2xl font-bold">
                {pendingPayments.length + pendingAdditionalPayments.length}
              </p>
            </div>
          </div>
        </ReportSection>

        <ReportSection
          title="Discount Report"
          description="Overview of discount categories and their verification status."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <Breakdown
              title="Discount Categories"
              items={discountBreakdown}
            />
            <Breakdown
              title="Discount Verification Status"
              items={discountStatusBreakdown}
            />
          </div>

          <div className="mt-6 rounded-xl bg-[#f7f8f5] p-4">
            <p className="text-sm text-gray-500">
              Rejected Discount Claims
            </p>
            <p className="mt-2 text-2xl font-bold text-[#304b38]">
              {rejectedDiscounts.length}
            </p>
          </div>
        </ReportSection>

        <ReportSection
          title="Group Assignment Report"
          description="Track delegate assignments across active camp groups."
        >
          <div className="mb-6 grid gap-5 sm:grid-cols-3">
            <div className="rounded-xl bg-[#f7f8f5] p-4">
              <p className="text-sm text-gray-500">Provisional</p>
              <p className="mt-2 text-2xl font-bold text-[#304b38]">
                {provisionalAssignments.length}
              </p>
            </div>
            <div className="rounded-xl bg-[#f7f8f5] p-4">
              <p className="text-sm text-gray-500">Finalized</p>
              <p className="mt-2 text-2xl font-bold text-[#304b38]">
                {finalizedAssignments.length}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm text-amber-700">Unassigned Delegates</p>
              <p className="mt-2 text-2xl font-bold text-amber-800">
                {unassignedCount}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-3 pr-4 font-semibold">Camp Group</th>
                  <th className="py-3 pr-4 font-semibold">Provisional</th>
                  <th className="py-3 pr-4 font-semibold">Finalized</th>
                  <th className="py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {groupReports.map((group) => (
                  <tr key={group.name} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-semibold">{group.name}</td>
                    <td className="py-3 pr-4">{group.provisional}</td>
                    <td className="py-3 pr-4">{group.finalized}</td>
                    <td className="py-3 font-semibold">{group.total}</td>
                  </tr>
                ))}
                {groupReports.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      No active camp groups found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ReportSection>

        <ReportSection
          title="Church Report"
          description="Churches ranked by their number of registered delegates."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-3 pr-4 font-semibold">Church</th>
                  <th className="py-3 text-right font-semibold">
                    Delegates
                  </th>
                </tr>
              </thead>
              <tbody>
                {churchReports.map(([churchName, total]) => (
                  <tr key={churchName} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium">{churchName}</td>
                    <td className="py-3 text-right font-semibold text-[#304b38]">
                      {total}
                    </td>
                  </tr>
                ))}
                {churchDelegateCounts.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-gray-400">
                      No church delegate records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ReportSection>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-full bg-[#304b38] px-6 py-3 text-sm font-semibold text-white hover:bg-[#46634d]"
          >
            ← Back to Management Center
          </Link>
        </div>

        <footer className="border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          Youth Camp 2027 Organizer Portal
        </footer>
      </div>
    </main>
  );
}
