
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type PaymentRecord = {
  id: string;
  registrationId: string | null;
  churchName: string;
  amount: number;
  reference: string;
  status: string;
  submittedAt: string | null;
  verifiedAt: string | null;
  verifiedByEmail: string | null;
  financeNotes: string;
  receiptUrl: string | null;
};

export default function PaymentHistoryList({
  records,
}: {
  records: PaymentRecord[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        record.churchName.toLowerCase().includes(query) ||
        record.reference.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        record.status.toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const counts = {
    all: records.length,
    pending: records.filter(
      (record) => record.status === "pending_verification"
    ).length,
    verified: records.filter(
      (record) => record.status === "verified"
    ).length,
    rejected: records.filter(
      (record) => record.status === "rejected"
    ).length,
  };

  function formatStatus(status: string) {
    const labels: Record<string, string> = {
      pending_verification: "Pending Verification",
      verified: "Verified",
      rejected: "Rejected",
    };

    return labels[status] ?? status.replace(/_/g, " ");
  }

  function statusStyle(status: string) {
    if (status === "verified") {
      return "bg-green-100 text-green-800";
    }

    if (status === "rejected") {
      return "bg-red-100 text-red-800";
    }

    return "bg-amber-100 text-amber-800";
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    return new Date(value).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <>
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "All Payments", value: counts.all },
          { label: "Pending", value: counts.pending },
          { label: "Verified", value: counts.verified },
          { label: "Rejected", value: counts.rejected },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="mt-2 text-3xl font-bold text-[#304b38]">
              {item.value}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h3 className="font-bold">Payment Records</h3>

          <p className="mt-1 text-sm text-gray-500">
            Search by church name or GCash reference.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search church or GCash reference..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#66836b] focus:ring-2 focus:ring-[#66836b]/20"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#66836b] focus:ring-2 focus:ring-[#66836b]/20"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending_verification">
                Pending Verification
              </option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {filteredRecords.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredRecords.map((record) => (
              <article key={record.id} className="p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <h4 className="text-lg font-bold">
                      {record.churchName}
                    </h4>

                    <p className="mt-1 text-sm text-gray-500">
                      Submitted {formatDate(record.submittedAt)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex h-fit w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(record.status)}`}
                  >
                    {formatStatus(record.status)}
                  </span>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs text-gray-400">
                      Amount
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      ₱{record.amount.toLocaleString("en-PH")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      GCash Reference
                    </p>
                    <p className="mt-1 font-medium">
                      {record.reference || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400">
                      Payment Submitted
                    </p>
                    <p className="mt-1 font-medium">
                      {formatDate(record.submittedAt)}
                    </p>
                  </div>

                  {record.status === "verified" && (
                    <>
                      <div>
                        <p className="text-xs text-gray-400">
                          Verified Date
                        </p>
                        <p className="mt-1 font-medium">
                          {formatDate(record.verifiedAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-400">
                          Verified By
                        </p>
                        <p className="mt-1 break-all font-medium">
                          {record.verifiedByEmail ?? "User account"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {record.financeNotes && (
                  <div className="mt-5 rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Finance Notes
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                      {record.financeNotes}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-4 border-t border-gray-100 pt-5">
                  {record.receiptUrl && (
                    <a
                      href={record.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#66836b] hover:underline"
                    >
                      View GCash Receipt ↗
                    </a>
                  )}

                  {record.registrationId && (
                    <Link
                      href={`/admin/registrations/${record.registrationId}`}
                      className="text-sm font-semibold text-[#66836b] hover:underline"
                    >
                      View Full Registration →
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="font-semibold text-gray-600">
              No payment records found.
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Try changing your search or payment status filter.
            </p>
          </div>
        )}
      </section>

      <p className="mt-4 text-sm text-gray-400">
        Showing {filteredRecords.length} of {records.length} payment records.
      </p>
    </>
  );
}
