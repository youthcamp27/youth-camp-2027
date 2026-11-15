
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const instant = false;

export default async function AdminDashboard() {
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
    registrationsResult,
    delegatesResult,
    pendingPaymentsResult,
    verifiedPaymentsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("Registrations")
      .select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("Delegates")
      .select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("Payments")
      .select("*", { count: "exact", head: true })
      .eq("Status", "pending_verification"),

    supabaseAdmin
      .from("Payments")
      .select("*", { count: "exact", head: true })
      .eq("Status", "verified"),
  ]);

  const results = [
    registrationsResult,
    delegatesResult,
    pendingPaymentsResult,
    verifiedPaymentsResult,
  ];

  if (results.some((result) => result.error)) {
    console.error(
      "Dashboard database error:",
      results
        .filter((result) => result.error)
        .map((result) => result.error?.message)
    );
  }

  const stats = [
    {
      label: "Total Registrations",
      value: registrationsResult.error ? "—" : registrationsResult.count ?? 0,
      description: "Church registration submissions",
    },
    {
      label: "Total Delegates",
      value: delegatesResult.error ? "—" : delegatesResult.count ?? 0,
      description: "Registered camp participants",
    },
    {
      label: "Pending Payments",
      value: pendingPaymentsResult.error ? "—" : pendingPaymentsResult.count ?? 0,
      description: "Awaiting finance verification",
    },
    {
      label: "Verified Payments",
      value: verifiedPaymentsResult.error ? "—" : verifiedPaymentsResult.count ?? 0,
      description: "Payments confirmed by finance",
    },
  ];

  const managementItems = [
    {
      title: "Registrations",
      description: "View churches and their submitted registrations.",
      href: "/admin/registrations",
      available: true,
      action: "Open Registrations",
    },
    {
      title: "Delegates",
      description: "View registered participants through their church registration records.",
      href: "/admin/registrations",
      available: true,
      action: "View Delegate Records",
    },
    {
      title: "Payment Verification",
      description: "Review GCash receipts and verify or reject payments.",
      href: "/admin/payments",
      available: true,
      action: "Open Payment Verification",
    },
    {
      title: "Discount Verification",
      description: "Review claimed delegate discounts and verify eligibility.",
      href: "/admin/discounts",
      available: true,
      action: "Open Discount Verification",
    },
    {
      title: "Group Assignment",
      description: "Organize delegates into camp groups.",
      available: false,
    },
    {
      title: "Reports",
      description: "Prepare registration and payment reports.",
      available: false,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#20251f]">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#66836b]">
              YOUTH CAMP 2027
            </p>
            <h1 className="mt-1 text-xl font-bold">
              Organizer Dashboard
            </h1>
          </div>

          <Link
            href="/"
            className="text-sm font-medium text-gray-500 hover:text-[#304b38]"
          >
            View Website →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10">
          <p className="text-sm font-medium text-[#66836b]">
            MANAGEMENT PORTAL
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Welcome, Organizer!
          </h2>
          <p className="mt-2 text-gray-500">
            Here's an overview of your Youth Camp 2027 pre-registration.
          </p>
        </div>

        <section>
          <h3 className="mb-5 text-lg font-bold">
            Registration Overview
          </h3>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="mt-4 text-4xl font-bold text-[#304b38]">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-5">
            <h3 className="text-lg font-bold">
              Management Center
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage registrations, delegates, payments, and camp operations.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {managementItems.map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h4 className="font-bold">{item.title}</h4>

                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
                  {item.description}
                </p>

                {item.available && item.href ? (
                  <Link
                    href={item.href}
                    className="mt-6 inline-flex w-fit items-center rounded-full bg-[#304b38] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#46634d]"
                  >
                    {item.action} →
                  </Link>
                ) : (
                  <div className="mt-6">
                    <span className="inline-block rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-500">
                      COMING SOON
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          Youth Camp 2027 Organizer Portal
        </footer>
      </div>
    </main>
  );
}
