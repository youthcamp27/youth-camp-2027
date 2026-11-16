
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OCCUPATIONS = [
  "Elementary",
  "High School",
  "Junior High School",
  "Senior High School",
  "College",
  "Career/Working",
] as const;

const DEMOGRAPHICS = [
  { key: "maleElementary", sex: "male", occupation: "Elementary" },
  { key: "femaleElementary", sex: "female", occupation: "Elementary" },
  { key: "maleHighSchool", sex: "male", occupation: "High School" },
  { key: "femaleHighSchool", sex: "female", occupation: "High School" },
  {
    key: "maleSeniorHighSchool",
    sex: "male",
    occupation: "Senior High School",
  },
  {
    key: "femaleSeniorHighSchool",
    sex: "female",
    occupation: "Senior High School",
  },
  { key: "maleCollege", sex: "male", occupation: "College" },
  { key: "femaleCollege", sex: "female", occupation: "College" },
  { key: "maleCareerWorking", sex: "male", occupation: "Career/Working" },
  {
    key: "femaleCareerWorking",
    sex: "female",
    occupation: "Career/Working",
  },
] as const;

type DemographicKey = (typeof DEMOGRAPHICS)[number]["key"];

type DemographicCounts = Record<DemographicKey, number>;

type DelegateRecord = {
  id: string;
  "Full Name": string;
  Sex: string;
  Occupation: string;
};

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function createEmptyDemographicCounts(): DemographicCounts {
  return {
    maleElementary: 0,
    femaleElementary: 0,
    maleHighSchool: 0,
    femaleHighSchool: 0,
    maleSeniorHighSchool: 0,
    femaleSeniorHighSchool: 0,
    maleCollege: 0,
    femaleCollege: 0,
    maleCareerWorking: 0,
    femaleCareerWorking: 0,
  };
}

function sortAssignments(
  assignments: { delegate_id: string; group_id: string }[],
) {
  return [...assignments]
    .map((item) => ({
      delegate_id: item.delegate_id,
      group_id: item.group_id,
    }))
    .sort(
      (a, b) =>
        a.delegate_id.localeCompare(b.delegate_id) ||
        a.group_id.localeCompare(b.group_id),
    );
}

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json(
        { error: "Unauthorized access." },
        { status: 401 },
      );
    }

    // 2. Validate the request.
    const body = await request.json();
    const action = body.action;
    const delegateId = body.delegateId;
    const groupId = body.groupId;

    const validActions = [
      "assign",
      "remove",
      "finalize",
      "reopen",
      "auto_balance",
      "preview_balance",
    ];

    if (
      typeof action !== "string" ||
      !validActions.includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid group assignment action." },
        { status: 400 },
      );
    }

    if (
      action === "assign" &&
      (
        typeof delegateId !== "string" ||
        !UUID_PATTERN.test(delegateId) ||
        typeof groupId !== "string" ||
        !UUID_PATTERN.test(groupId)
      )
    ) {
      return NextResponse.json(
        { error: "A valid delegate and group are required." },
        { status: 400 },
      );
    }

    if (
      action === "remove" &&
      (
        typeof delegateId !== "string" ||
        !UUID_PATTERN.test(delegateId)
      )
    ) {
      return NextResponse.json(
        { error: "A valid delegate is required." },
        { status: 400 },
      );
    }

    // 3. Calculate or apply automatic demographic balancing.
    if (
      action === "auto_balance" ||
      action === "preview_balance"
    ) {
      const { data: groups, error: groupsError } =
        await supabaseAdmin
          .from("Camp Groups")
          .select('id, "Group Name"')
          .eq("Is Active", true)
          .order("Group Name");

      if (groupsError) throw groupsError;

      if (!groups || groups.length === 0) {
        return NextResponse.json(
          { error: "There are no active camp groups." },
          { status: 400 },
        );
      }

      // 4. Find approved online registrations.
      const { data: registrations, error: registrationsError } =
        await supabaseAdmin
          .from("Registrations")
          .select("id")
          .eq("Status", "approved");

      if (registrationsError) throw registrationsError;

      const registrationIds = (registrations ?? []).map(
        (registration) => registration.id,
      );

      // 5. Find verified on-site registrations.
      const { data: onsiteRegistrations, error: onsiteError } =
        await supabaseAdmin
          .from("On-Site Registrations")
          .select("id")
          .eq("Status", "verified");

      if (onsiteError) throw onsiteError;

      const onsiteRegistrationIds = (onsiteRegistrations ?? []).map(
        (registration) => registration.id,
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

        if (paymentsError) throw paymentsError;

        verifiedOnsiteRegistrationIds = [
          ...new Set(
            (verifiedPayments ?? []).map(
              (payment) => payment.registration_id,
            ),
          ),
        ];
      }

      // 7. Fetch eligible online delegates.
      let onlineDelegates: DelegateRecord[] = [];

      if (registrationIds.length > 0) {
        const { data, error: delegatesError } =
          await supabaseAdmin
            .from("Delegates")
            .select('id, "Full Name", "Sex", "Occupation"')
            .in("registration_id", registrationIds);

        if (delegatesError) throw delegatesError;

        onlineDelegates = (data ?? []) as DelegateRecord[];
      }

      // 8. Fetch eligible on-site delegates.
      let onsiteDelegates: DelegateRecord[] = [];

      if (verifiedOnsiteRegistrationIds.length > 0) {
        const { data, error: onsiteDelegatesError } =
          await supabaseAdmin
            .from("Delegates")
            .select('id, "Full Name", "Sex", "Occupation"')
            .in("onsite_registration_id", verifiedOnsiteRegistrationIds);

        if (onsiteDelegatesError) throw onsiteDelegatesError;

        onsiteDelegates = (data ?? []) as DelegateRecord[];
      }

      // 9. Combine both registration sources.
      const delegates = [
        ...onlineDelegates,
        ...onsiteDelegates,
      ];

      // Prevent duplicate delegate IDs.
      const uniqueDelegates = Array.from(
        new Map(
          delegates.map((delegate) => [delegate.id, delegate]),
        ).values(),
      );

      if (uniqueDelegates.length === 0) {
        return NextResponse.json(
          { error: "There are no eligible delegates to distribute." },
          { status: 400 },
        );
      }

      // 10. Check existing assignments.
      const { data: existingAssignments, error: assignmentsError } =
        await supabaseAdmin
          .from("Group Assignments")
          .select('delegate_id, "Assignment Status"');

      if (assignmentsError) throw assignmentsError;

      const eligibleIds = new Set(
        uniqueDelegates.map((delegate) => delegate.id),
      );

      const relevantAssignments = (existingAssignments ?? []).filter(
        (assignment) => eligibleIds.has(assignment.delegate_id),
      );

      if (
        relevantAssignments.some(
          (assignment) =>
            assignment["Assignment Status"] === "finalized",
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Some assignments are finalized. Reopen assignments before automatic balancing.",
          },
          { status: 400 },
        );
      }

      // 11. Prepare empty counts for every active group.
      const totalCounts = new Map<string, number>();
      const demographicCounts = new Map<string, DemographicCounts>();

      groups.forEach((group) => {
        totalCounts.set(group.id, 0);
        demographicCounts.set(
          group.id,
          createEmptyDemographicCounts(),
        );
      });

      // 12. Validate and categorize every eligible delegate.
      const categorizedDelegates: Array<
        DelegateRecord & { demographicKey: DemographicKey }
      > = [];

      for (const delegate of uniqueDelegates) {
        const sex = normalize(delegate.Sex);

        if (sex !== "male" && sex !== "female") {
          return NextResponse.json(
            {
              error:
                `Invalid sex category for ${delegate["Full Name"]}: ${delegate.Sex}`,
            },
            { status: 400 },
          );
        }

        const occupation = OCCUPATIONS.find(
          (item) =>
            normalize(item) === normalize(delegate.Occupation),
        );

        if (!occupation) {
          return NextResponse.json(
            {
              error:
                `Unknown occupation category for ${delegate["Full Name"]}: ${delegate.Occupation}`,
            },
            { status: 400 },
          );
        }

        // Both High School labels use the same balancing category.
        const normalizedOccupation =
          occupation === "Junior High School"
            ? "High School"
            : occupation;

        const demographic = DEMOGRAPHICS.find(
          (item) =>
            item.sex === sex &&
            item.occupation === normalizedOccupation,
        );

        if (!demographic) {
          return NextResponse.json(
            {
              error:
                `Could not categorize ${delegate["Full Name"]}.`,
            },
            { status: 400 },
          );
        }

        categorizedDelegates.push({
          ...delegate,
          demographicKey: demographic.key,
        });
      }

      // 13. Sort delegates by exact demographic category.
      const sortedDelegates = [...categorizedDelegates].sort(
        (a, b) =>
          a.demographicKey.localeCompare(b.demographicKey) ||
          a.id.localeCompare(b.id),
      );

      const plannedAssignments: {
        delegate_id: string;
        group_id: string;
      }[] = [];

      // 14. Distribute each demographic category evenly.
      for (const delegate of sortedDelegates) {
        const chosenGroup = [...groups].sort((a, b) => {
          const countsA = demographicCounts.get(a.id)!;
          const countsB = demographicCounts.get(b.id)!;

          const countA = countsA[delegate.demographicKey];
          const countB = countsB[delegate.demographicKey];

          // First priority: balance the exact demographic category.
          if (countA !== countB) {
            return countA - countB;
          }

          // Second priority: balance total group sizes.
          const totalA = totalCounts.get(a.id) ?? 0;
          const totalB = totalCounts.get(b.id) ?? 0;

          if (totalA !== totalB) {
            return totalA - totalB;
          }

          // Final tie-breaker: group name.
          return a["Group Name"].localeCompare(b["Group Name"]);
        })[0];

        plannedAssignments.push({
          delegate_id: delegate.id,
          group_id: chosenGroup.id,
        });

        const groupCounts = demographicCounts.get(chosenGroup.id)!;

        groupCounts[delegate.demographicKey] += 1;

        totalCounts.set(
          chosenGroup.id,
          (totalCounts.get(chosenGroup.id) ?? 0) + 1,
        );
      }

      // 15. Prepare demographic counts for every group.
      const distribution = groups.map((group) => ({
        groupId: group.id,
        groupName: group["Group Name"],
        total: totalCounts.get(group.id) ?? 0,
        demographics: demographicCounts.get(group.id)!,
      }));

      // 16. Preview only. Do not modify the database.
      if (action === "preview_balance") {
        return NextResponse.json({
          success: true,
          totalDelegates: uniqueDelegates.length,
          totalGroups: groups.length,
          distribution,
          assignments: plannedAssignments,
        });
      }

      // 17. Validate the submitted preview.
      if (!Array.isArray(body.assignments)) {
        return NextResponse.json(
          {
            error:
              "The preview assignments are missing. Generate a new preview before applying.",
          },
          { status: 400 },
        );
      }

      const submittedAssignments = body.assignments;

      const invalidSubmittedAssignment = submittedAssignments.some(
        (item: unknown) =>
          !item ||
          typeof item !== "object" ||
          typeof (item as Record<string, unknown>).delegate_id !== "string" ||
          !UUID_PATTERN.test(
            (item as Record<string, string>).delegate_id,
          ) ||
          typeof (item as Record<string, unknown>).group_id !== "string" ||
          !UUID_PATTERN.test(
            (item as Record<string, string>).group_id,
          ),
      );

      if (invalidSubmittedAssignment) {
        return NextResponse.json(
          { error: "The preview assignments are invalid." },
          { status: 400 },
        );
      }

      const submittedPlan = sortAssignments(submittedAssignments);
      const currentPlan = sortAssignments(plannedAssignments);

      if (
        JSON.stringify(submittedPlan) !==
        JSON.stringify(currentPlan)
      ) {
        return NextResponse.json(
          {
            error:
              "The eligible delegates or groups have changed since the preview. Generate a new preview before applying.",
          },
          { status: 409 },
        );
      }

      // 18. Apply the complete distribution in one database transaction.
      const { data: result, error: saveError } =
        await supabaseAdmin.rpc(
          "replace_provisional_group_assignments",
          {
            p_assignments: plannedAssignments,
          },
        );

      if (saveError) {
        console.error("Automatic balancing error:", saveError);

        return NextResponse.json(
          { error: saveError.message },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message:
          `Successfully balanced ${uniqueDelegates.length} delegates across ${groups.length} groups.`,
        distribution,
        result,
      });
    }

    // 19. Execute regular manual assignment operations.
    const { data: result, error: assignmentError } =
      await supabaseAdmin.rpc("manage_group_assignment", {
        p_action: action,
        p_delegate_id:
          action === "assign" || action === "remove"
            ? delegateId
            : null,
        p_group_id: action === "assign" ? groupId : null,
      });

    if (assignmentError) {
      console.error(
        "Group assignment error:",
        assignmentError.message,
      );

      return NextResponse.json(
        { error: assignmentError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Group assignment API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
