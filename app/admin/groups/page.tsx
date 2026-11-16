
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import GroupAssignmentControls from "./group-assignment-controls";

export default function GroupAssignmentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#faf9f6] p-10">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm text-gray-500">
              Loading Camp Group Management...
            </p>
          </div>
        </main>
      }
    >
      <GroupAssignmentContent />
    </Suspense>
  );
}

async function GroupAssignmentContent() {
  await connection();

  // 1. Verify administrator access.
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

  // 2. Retrieve active camp groups.
  const { data: groupsData, error: groupsError } =
    await supabaseAdmin
      .from("Camp Groups")
      .select('id, "Group Name"')
      .eq("Is Active", true)
      .order("Group Name");

  if (groupsError) {
    console.error("Groups query error:", groupsError);
    throw new Error("Unable to load camp groups.");
  }

  const allGroups = groupsData ?? [];

  // 3. Retrieve approved online registrations.
  const { data: registrationsData, error: registrationsError } =
    await supabaseAdmin
      .from("Registrations")
      .select("id")
      .eq("Status", "approved");

  if (registrationsError) {
    console.error("Registrations query error:", registrationsError);
    throw new Error("Unable to load approved registrations.");
  }

  const registrationIds = (registrationsData ?? []).map(
    (registration) => registration.id
  );

  // 4. Retrieve delegates from approved online registrations.
  type DelegateRecord = {
    id: string;
    "Full Name": string;
    Age: number;
    Sex: string;
    Occupation: string;
  };

  let onlineDelegates: DelegateRecord[] = [];

  if (registrationIds.length > 0) {
    const { data: delegatesData, error: delegatesError } =
      await supabaseAdmin
        .from("Delegates")
        .select('id, "Full Name", "Age", "Sex", "Occupation"')
        .in("registration_id", registrationIds)
        .order("Full Name");

    if (delegatesError) {
      console.error("Online delegates query error:", delegatesError);
      throw new Error("Unable to load online delegates.");
    }

    onlineDelegates = delegatesData ?? [];
  }

  // 5. Retrieve verified on-site registrations.
  const { data: onsiteRegistrations, error: onsiteError } =
    await supabaseAdmin
      .from("On-Site Registrations")
      .select("id")
      .eq("Status", "verified");

  if (onsiteError) {
    console.error("On-site registrations query error:", onsiteError);
    throw new Error("Unable to load on-site registrations.");
  }

  const onsiteRegistrationIds = (onsiteRegistrations ?? []).map(
    (registration) => registration.id
  );

  // 6. Only include on-site registrations with verified payments.
  let verifiedOnsiteRegistrationIds: string[] = [];

  if (onsiteRegistrationIds.length > 0) {
    const { data: verifiedPayments, error: paymentsError } =
      await supabaseAdmin
        .from("On-Site Payments")
        .select("registration_id")
        .in("registration_id", onsiteRegistrationIds)
        .eq("Status", "verified");

    if (paymentsError) {
      console.error("On-site payments query error:", paymentsError);
      throw new Error("Unable to load verified on-site payments.");
    }

    verifiedOnsiteRegistrationIds = [
      ...new Set(
        (verifiedPayments ?? []).map(
          (payment) => payment.registration_id
        )
      ),
    ];
  }

  // 7. Retrieve eligible walk-in delegates.
  let onsiteDelegates: DelegateRecord[] = [];

  if (verifiedOnsiteRegistrationIds.length > 0) {
    const { data: onsiteDelegatesData, error: onsiteDelegatesError } =
      await supabaseAdmin
        .from("Delegates")
        .select('id, "Full Name", "Age", "Sex", "Occupation"')
        .in("onsite_registration_id", verifiedOnsiteRegistrationIds)
        .order("Full Name");

    if (onsiteDelegatesError) {
      console.error("On-site delegates query error:", onsiteDelegatesError);
      throw new Error("Unable to load walk-in delegates.");
    }

    onsiteDelegates = onsiteDelegatesData ?? [];
  }

  // 8. Combine online and walk-in delegates.
  // Prevent duplicate delegate IDs.
  const allDelegates = Array.from(
    new Map(
      [...onlineDelegates, ...onsiteDelegates].map(
        (delegate) => [delegate.id, delegate]
      )
    ).values()
  );

  // 9. Retrieve existing assignments.
  const { data: assignmentsData, error: assignmentsError } =
    await supabaseAdmin
      .from("Group Assignments")
      .select('delegate_id, group_id, "Assignment Status"');

  if (assignmentsError) {
    console.error("Assignments query error:", assignmentsError);
    throw new Error("Unable to load group assignments.");
  }

  const allAssignments = assignmentsData ?? [];

  // 10. Keep assignments belonging to eligible delegates.
  const delegateById = new Map(
    allDelegates.map((delegate) => [delegate.id, delegate])
  );

  const eligibleDelegateIds = new Set(
    allDelegates.map((delegate) => delegate.id)
  );

  const eligibleAssignments = allAssignments.filter(
    (assignment) => eligibleDelegateIds.has(assignment.delegate_id)
  );

  const assignedDelegateIds = new Set(
    eligibleAssignments.map((assignment) => assignment.delegate_id)
  );

  const unassignedDelegates = allDelegates.filter(
    (delegate) => !assignedDelegateIds.has(delegate.id)
  );

  const provisionalCount = eligibleAssignments.filter(
    (assignment) => assignment["Assignment Status"] === "provisional"
  ).length;

  const finalizedCount = eligibleAssignments.filter(
    (assignment) => assignment["Assignment Status"] === "finalized"
  ).length;

  // 11. Display the management page.
  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#20251f]">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#718071]">
              Youth Camp 2027
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Camp Group Management
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Organize online and walk-in delegates into their respective camp groups.
            </p>
          </div>

          <a
            href="/admin"
            className="w-fit rounded-full border border-gray-300 px-5 py-3 text-sm font-semibold transition hover:bg-white"
          >
            Back to Management Center
          </a>
        </div>

        {/* Overview */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">Active Groups</p>
            <p className="mt-2 text-3xl font-bold">
              {allGroups.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">Eligible Delegates</p>
            <p className="mt-2 text-3xl font-bold">
              {allDelegates.length}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Online and walk-in combined
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">
              Provisional Assignments
            </p>
            <p className="mt-2 text-3xl font-bold">
              {provisionalCount}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-500">
              Finalized Assignments
            </p>
            <p className="mt-2 text-3xl font-bold">
              {finalizedCount}
            </p>
          </div>
        </div>

        {/* Group Overview */}
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold">Your Camp Groups</h2>
            <p className="mt-1 text-sm text-gray-500">
              Delegate distribution across all active groups.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {allGroups.map((group) => {
              const members = eligibleAssignments
                .filter(
                  (assignment) => assignment.group_id === group.id
                )
                .map(
                  (assignment) =>
                    delegateById.get(assignment.delegate_id)
                )
                .filter(Boolean);

              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">
                      {group["Group Name"]}
                    </h3>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      Active
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-bold">
                    {members.length}
                  </p>

                  <p className="text-sm text-gray-500">
                    Assigned delegates
                  </p>

                  <div className="mt-5 border-t border-gray-100 pt-4">
                    {members.length > 0 ? (
                      <div className="space-y-3">
                        {members.map((delegate) => (
                          <div key={delegate!.id}>
                            <p className="text-sm font-semibold">
                              {delegate!["Full Name"]}
                            </p>

                            <p className="text-xs text-gray-400">
                              {delegate!.Occupation} · Age{" "}
                              {delegate!.Age}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">
                        No delegates assigned yet.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Interactive Assignment Controls */}
        <GroupAssignmentControls
          groups={allGroups}
          delegates={allDelegates}
          assignments={eligibleAssignments}
        />

      </div>
    </main>
  );
}
