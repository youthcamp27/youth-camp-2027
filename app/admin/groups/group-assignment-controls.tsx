
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Group = {
  id: string;
  "Group Name": string;
};

type Delegate = {
  id: string;
  "Full Name": string;
  Age: number;
  Sex: string;
  Occupation: string;
  churchName: string;
};

type Assignment = {
  delegate_id: string;
  group_id: string;
  "Assignment Status": "provisional" | "finalized";
};

const DEMOGRAPHICS = [
  { key: "maleElementary", label: "Elementary" },
  { key: "maleHighSchool", label: "High School" },
  { key: "maleSeniorHighSchool", label: "Senior High School" },
  { key: "maleCollege", label: "College" },
  { key: "maleCareerWorking", label: "Career/Working" },
  { key: "femaleElementary", label: "Elementary" },
  { key: "femaleHighSchool", label: "High School" },
  { key: "femaleSeniorHighSchool", label: "Senior High School" },
  { key: "femaleCollege", label: "College" },
  { key: "femaleCareerWorking", label: "Career/Working" },
] as const;

type DemographicKey = (typeof DEMOGRAPHICS)[number]["key"];

type Distribution = {
  groupId: string;
  groupName: string;
  total: number;
  demographics: Record<DemographicKey, number>;
};

type Preview = {
  totalDelegates: number;
  totalGroups: number;
  distribution: Distribution[];
  assignments: {
    delegate_id: string;
    group_id: string;
  }[];
};

type Props = {
  groups: Group[];
  delegates: Delegate[];
  assignments: Assignment[];
};

const FEMALE_KEYS = [
  "femaleElementary",
  "femaleHighSchool",
  "femaleSeniorHighSchool",
  "femaleCollege",
  "femaleCareerWorking",
] as const;

const MALE_KEYS = [
  "maleElementary",
  "maleHighSchool",
  "maleSeniorHighSchool",
  "maleCollege",
  "maleCareerWorking",
] as const;

const OCCUPATION_LABELS = [
  "Elementary",
  "High School",
  "Senior High School",
  "College",
  "Career/Working",
];

export default function GroupAssignmentControls({
  groups,
  delegates,
  assignments,
}: Props) {
  const router = useRouter();

  const [selectedGroups, setSelectedGroups] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [delegateSearch, setDelegateSearch] = useState("");

  const assignedIds = new Set(
    assignments.map((assignment) => assignment.delegate_id)
  );

  const unassigned = delegates.filter(
    (delegate) => !assignedIds.has(delegate.id)
  );

  const assigned = assignments
    .map((assignment) => ({
      assignment,
      delegate: delegates.find(
        (delegate) => delegate.id === assignment.delegate_id
      ),
    }))
    .filter(
      (item): item is {
        assignment: Assignment;
        delegate: Delegate;
      } => Boolean(item.delegate)
    );

  // Group existing assignments by church.
  const assignedByChurch = useMemo(() => {
    const grouped: Record<
      string,
      {
        assignment: Assignment;
        delegate: Delegate;
      }[]
    > = {};

    assigned.forEach((item) => {
      const churchName = item.delegate.churchName || "Unknown Church";

      if (!grouped[churchName]) {
        grouped[churchName] = [];
      }

      grouped[churchName].push(item);
    });

    return Object.entries(grouped)
      .sort(([churchA], [churchB]) =>
        churchA.localeCompare(churchB)
      )
      .map(([churchName, members]) => ({
        churchName,
        members: members.sort((a, b) =>
          a.delegate["Full Name"].localeCompare(
            b.delegate["Full Name"]
          )
        ),
      }));
  }, [assigned]);

  // Search delegates by name across all churches.
  const filteredAssignedByChurch = useMemo(() => {
    const search = delegateSearch.trim().toLowerCase();

    if (!search) return assignedByChurch;

    return assignedByChurch
      .map((church) => ({
        ...church,
        members: church.members.filter(({ delegate }) =>
          delegate["Full Name"].toLowerCase().includes(search)
        ),
      }))
      .filter((church) => church.members.length > 0);
  }, [assignedByChurch, delegateSearch]);

  const finalizedCount = assignments.filter(
    (assignment) =>
      assignment["Assignment Status"] === "finalized"
  ).length;

  const allAssigned =
    delegates.length > 0 && unassigned.length === 0;

  const allFinalized =
    assignments.length > 0 &&
    finalizedCount === assignments.length;

  async function performAction(
    action: string,
    delegateId?: string,
    groupId?: string
  ) {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          delegateId,
          groupId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong.");
      }

      setMessage(
        result.message || "Operation completed successfully."
      );

      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  async function previewDistribution() {
    setLoading(true);
    setMessage("");
    setError("");
    setPreview(null);

    try {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "preview_balance",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to generate preview."
        );
      }

      setPreview(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  async function applyDistribution() {
    if (!preview) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "auto_balance",
          assignments: preview.assignments,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to apply distribution."
        );
      }

      setMessage(result.message);
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 space-y-8">
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Automatic balancing */}
      <div className="rounded-2xl border border-[#dce4dc] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold">
          Automatic Group Balancing
        </h3>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Automatically distribute eligible delegates across active
          groups. The system balances all 10 demographic categories
          separately while keeping total group sizes as even as possible.
        </p>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            The 10 demographic categories
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {DEMOGRAPHICS.map((item) => (
              <span
                key={item.key}
                className="rounded-full bg-[#f0f3ef] px-3 py-2 text-xs font-medium text-[#304b38]"
              >
                {item.key.startsWith("female")
                  ? "Female"
                  : "Male"}{" "}
                · {item.label}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={
            loading ||
            delegates.length === 0 ||
            groups.length === 0 ||
            allFinalized
          }
          onClick={previewDistribution}
          className="mt-6 rounded-full bg-[#304b38] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#46634d] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Generating Preview..." : "Preview Distribution"}
        </button>

        {preview && (
          <div className="mt-8 space-y-6 border-t border-gray-100 pt-6">
            <div>
              <h4 className="text-lg font-bold">
                Proposed Group Distribution
              </h4>

              <p className="mt-1 text-sm text-gray-500">
                {preview.totalDelegates} delegates across{" "}
                {preview.totalGroups} groups.
              </p>
            </div>

            {/* Demographic distribution */}
            <div>
              <h5 className="mb-2 font-semibold">
                Demographic Breakdown per Group
              </h5>

              <p className="mb-4 text-xs leading-5 text-gray-500">
                Each group appears once. Female and Male delegates
                are separated into color-coded sections.
              </p>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-[1250px] border-collapse text-left text-sm">
                  <thead>
                    <tr>
                      <th
                        rowSpan={2}
                        className="sticky left-0 z-20 min-w-[130px] border-b border-r border-gray-200 bg-gray-100 px-4 py-4 text-left font-semibold text-gray-700"
                      >
                        Camp Group
                      </th>

                      <th
                        colSpan={5}
                        className="border-b border-r border-pink-200 bg-pink-100 px-4 py-3 text-center font-bold tracking-wider text-pink-800"
                      >
                        FEMALE
                      </th>

                      <th
                        colSpan={5}
                        className="border-b border-r border-blue-200 bg-blue-100 px-4 py-3 text-center font-bold tracking-wider text-blue-800"
                      >
                        MALE
                      </th>

                      <th
                        rowSpan={2}
                        className="border-b border-gray-200 bg-gray-100 px-4 py-4 text-center font-bold text-[#304b38]"
                      >
                        Total
                      </th>
                    </tr>

                    <tr>
                      {OCCUPATION_LABELS.map((label) => (
                        <th
                          key={`female-${label}`}
                          className="min-w-[115px] border-b border-r border-pink-100 bg-pink-50 px-3 py-3 text-center text-xs font-semibold text-pink-800"
                        >
                          {label}
                        </th>
                      ))}

                      {OCCUPATION_LABELS.map((label) => (
                        <th
                          key={`male-${label}`}
                          className="min-w-[115px] border-b border-r border-blue-100 bg-blue-50 px-3 py-3 text-center text-xs font-semibold text-blue-800"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {preview.distribution.map((group) => (
                      <tr
                        key={group.groupId}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="sticky left-0 z-10 border-r border-gray-100 bg-white px-4 py-4 font-semibold text-gray-800">
                          {group.groupName}
                        </td>

                        {FEMALE_KEYS.map((key) => (
                          <td
                            key={key}
                            className="border-r border-pink-50 bg-pink-50/40 px-3 py-4 text-center tabular-nums text-pink-950"
                          >
                            {group.demographics[key] ?? 0}
                          </td>
                        ))}

                        {MALE_KEYS.map((key) => (
                          <td
                            key={key}
                            className="border-r border-blue-50 bg-blue-50/40 px-3 py-4 text-center tabular-nums text-blue-950"
                          >
                            {group.demographics[key] ?? 0}
                          </td>
                        ))}

                        <td className="bg-gray-100 px-4 py-4 text-center font-bold text-[#304b38]">
                          {group.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium">
                <span className="flex items-center gap-2 text-pink-700">
                  <span className="h-3 w-3 rounded-sm bg-pink-300" />
                  Female delegates
                </span>

                <span className="flex items-center gap-2 text-blue-700">
                  <span className="h-3 w-3 rounded-sm bg-blue-300" />
                  Male delegates
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-[#f5f7f4] p-4">
              <p className="text-sm font-semibold text-[#304b38]">
                Review before applying
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                This preview does not change any assignments.
                Applying will replace all existing provisional
                assignments with the proposed distribution. The
                system will verify that the plan still matches this
                preview before saving.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  if (
                    window.confirm(
                      "Apply this distribution? All existing provisional assignments will be replaced."
                    )
                  ) {
                    applyDistribution();
                  }
                }}
                className="rounded-full bg-[#304b38] px-6 py-3 text-sm font-semibold text-white hover:bg-[#46634d] disabled:opacity-40"
              >
                {loading ? "Applying..." : "Apply Distribution"}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setPreview(null)}
                className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Cancel Preview
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Assign unassigned delegates */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h3 className="text-lg font-bold">
            Assign Delegates
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a camp group for each unassigned delegate.
          </p>
        </div>

        {unassigned.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {unassigned.map((delegate) => (
              <div
                key={delegate.id}
                className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold">
                    {delegate["Full Name"]}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {delegate.churchName || "Unknown Church"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {delegate.Age} years old · {delegate.Sex} ·{" "}
                    {delegate.Occupation}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={selectedGroups[delegate.id] || ""}
                    onChange={(event) =>
                      setSelectedGroups((previous) => ({
                        ...previous,
                        [delegate.id]: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                    disabled={loading}
                  >
                    <option value="">Choose a group</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group["Group Name"]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={
                      loading || !selectedGroups[delegate.id]
                    }
                    onClick={() =>
                      performAction(
                        "assign",
                        delegate.id,
                        selectedGroups[delegate.id]
                      )
                    }
                    className="rounded-full bg-[#304b38] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#46634d] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="font-semibold text-gray-600">
              All eligible delegates have been assigned.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              There are no unassigned delegates.
            </p>
          </div>
        )}
      </div>

      {/* Manage existing assignments */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-5">
          <h3 className="text-lg font-bold">
            Manage Existing Assignments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Delegates are organized by church. Search by name to find
            a specific delegate, transfer them between groups, or
            remove provisional assignments.
          </p>

          {/* Delegate search */}
          <div className="relative mt-5 max-w-xl">
            <input
              type="search"
              value={delegateSearch}
              onChange={(event) =>
                setDelegateSearch(event.target.value)
              }
              placeholder="Search delegate by full name..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-11 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#66836b] focus:ring-2 focus:ring-[#66836b]/10"
            />

            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Showing{" "}
            {filteredAssignedByChurch.reduce(
              (total, church) => total + church.members.length,
              0
            )}{" "}
            of {assigned.length} assigned delegates
          </p>
        </div>

        {assigned.length > 0 ? (
          filteredAssignedByChurch.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredAssignedByChurch.map(
                ({ churchName, members }) => (
                  <div key={churchName}>
                    {/* Church heading */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f5f7f4] px-6 py-4">
                      <div>
                        <h4 className="font-bold text-[#304b38]">
                          {churchName}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          {members.length}{" "}
                          {members.length === 1
                            ? "delegate"
                            : "delegates"}
                        </p>
                      </div>
                    </div>

                    {/* Church delegates */}
                    <div className="divide-y divide-gray-100">
                      {members.map(({ assignment, delegate }) => {
                        const isFinalized =
                          assignment["Assignment Status"] ===
                          "finalized";

                        return (
                          <div
                            key={assignment.delegate_id}
                            className="flex flex-col gap-4 px-6 py-5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold">
                                  {delegate["Full Name"]}
                                </p>

                                <p className="mt-1 text-xs text-gray-400">
                                  {delegate.Age} years old ·{" "}
                                  {delegate.Sex} ·{" "}
                                  {delegate.Occupation}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  Currently assigned to{" "}
                                  {groups.find(
                                    (group) =>
                                      group.id === assignment.group_id
                                  )?.["Group Name"] ||
                                    "Unknown group"}
                                </p>
                              </div>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  isFinalized
                                    ? "bg-green-50 text-green-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {isFinalized
                                  ? "Finalized"
                                  : "Provisional"}
                              </span>
                            </div>

                            {!isFinalized && (
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <select
                                  value={
                                    selectedGroups[delegate.id] ??
                                    assignment.group_id
                                  }
                                  onChange={(event) =>
                                    setSelectedGroups((previous) => ({
                                      ...previous,
                                      [delegate.id]:
                                        event.target.value,
                                    }))
                                  }
                                  className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                                  disabled={loading}
                                >
                                  {groups.map((group) => (
                                    <option
                                      key={group.id}
                                      value={group.id}
                                    >
                                      {group["Group Name"]}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  disabled={
                                    loading ||
                                    !selectedGroups[delegate.id] ||
                                    selectedGroups[delegate.id] ===
                                      assignment.group_id
                                  }
                                  onClick={() =>
                                    performAction(
                                      "assign",
                                      delegate.id,
                                      selectedGroups[delegate.id]
                                    )
                                  }
                                  className="rounded-full border border-[#304b38] px-5 py-3 text-xs font-semibold text-[#304b38] hover:bg-[#f0f3ef] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Transfer
                                </button>

                                <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Remove ${delegate["Full Name"]} from their assigned group?`
                                      )
                                    ) {
                                      performAction(
                                        "remove",
                                        delegate.id
                                      );
                                    }
                                  }}
                                  className="rounded-full border border-red-200 px-5 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="font-semibold text-gray-600">
                No matching delegates found.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Try another name or clear your search.
              </p>

              <button
                type="button"
                onClick={() => setDelegateSearch("")}
                className="mt-4 text-sm font-semibold text-[#304b38] hover:underline"
              >
                Clear Search
              </button>
            </div>
          )
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No group assignments yet.
          </div>
        )}
      </div>

      {/* Finalize or reopen */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold">
          Assignment Finalization
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          {unassigned.length > 0
            ? `${unassigned.length} eligible delegate(s) still need a group assignment.`
            : allAssigned
              ? "Every eligible delegate has been assigned."
              : "There are currently no eligible delegates to assign."}
        </p>

        {allFinalized ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (
                window.confirm(
                  "Reopen all finalized assignments? Organizers will be able to make changes again."
                )
              ) {
                performAction("reopen");
              }
            }}
            className="mt-5 rounded-full border border-[#304b38] px-6 py-3 text-sm font-semibold text-[#304b38] hover:bg-[#f0f3ef] disabled:opacity-40"
          >
            Reopen Assignments
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || !allAssigned || allFinalized}
            onClick={() => {
              if (
                window.confirm(
                  "Finalize all group assignments? You will need to reopen them before making changes."
                )
              ) {
                performAction("finalize");
              }
            }}
            className="mt-5 rounded-full bg-[#304b38] px-6 py-3 text-sm font-semibold text-white hover:bg-[#46634d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Finalize Assignments
          </button>
        )}

        <p className="mt-3 text-xs text-gray-400">
          Finalization is available only after every eligible delegate has been assigned.
        </p>
      </div>
    </section>
  );
}
