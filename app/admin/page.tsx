
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
    onlineRegistrations,
    onsiteRegistrations,
    delegates,
    onlinePendingPayments,
    onsitePendingPayments,
    onlineVerifiedPayments,
    onsiteVerifiedPayments,
  ] = await Promise.all([
    supabaseAdmin
      .from("Registrations")
      .select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("On-Site Registrations")
      .select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("Delegates")
      .select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("Payments")
      .select("*", { count: "exact", head: true })
      .eq("Status", "pending_verification"),

    supabaseAdmin
      .from("On-Site Payments")
      .select("*", { count: "exact", head: true })
      .eq("Status", "pending_verification"),

    supabaseAdmin
      .from("Payments")
      .select("*", { count: "exact", head: true })
      .eq("Status", "verified"),

    supabaseAdmin
      .from("On-Site Payments")
      .select("*", { count: "exact", head: true })
      .eq("Status", "verified"),
  ]);

  const results = [
    onlineRegistrations,
    onsiteRegistrations,
    delegates,
    onlinePendingPayments,
    onsitePendingPayments,
    onlineVerifiedPayments,
    onsiteVerifiedPayments,
  ];

  const failedResults = results.filter((result) => result.error);

  if (failedResults.length > 0) {
    console.error(
      "Dashboard database errors:",
      failedResults.map((result) => result.error?.message)
    );
  }

  const paymentStatsAvailable =
    !onlinePendingPayments.error &&
    !onsitePendingPayments.error &&
    !onlineVerifiedPayments.error &&
    !onsiteVerifiedPayments.error;

  const stats = [
    {
      label: "Online Registrations",
      value: onlineRegistrations.error
        ? "—"
        : onlineRegistrations.count ?? 0,
      description: "Church pre-registration submissions",
    },
    {
      label: "Walk-in Registrations",
      value: onsiteRegistrations.error
        ? "—"
        : onsiteRegistrations.count ?? 0,
      description: "On-site registration submissions",
    },
    {
      label: "Total Delegates",
      value: delegates.error ? "—" : delegates.count ?? 0,
      description: "Online and on-site participants",
    },
    {
      label: "Pending Payments",
      value: paymentStatsAvailable
        ? (onlinePendingPayments.count ?? 0) +
          (onsitePendingPayments.count ?? 0)
        : "—",
      description: "Online and on-site payments awaiting verification",
    },
    {
      label: "Verified Payments",
      value: paymentStatsAvailable
        ? (onlineVerifiedPayments.count ?? 0) +
          (onsiteVerifiedPayments.count ?? 0)
        : "—",
      description: "Online and on-site payments confirmed",
    },
  ];

  const managementItems = [
    {
      title: "Registrations",
      description:
        "View online and walk-in churches, representatives, and registration details.",
      href: "/admin/registrations",
      action: "Open Registrations",
    },
    {
      title: "Delegates",
      description:
        "View and manage all online and on-site camp participants.",
      href: "/admin/delegates",
      action: "View Delegate Records",
    },
    {
      title: "Payment Verification",
      description:
        "Review online GCash payments and on-site Cash or GCash payments.",
      href: "/admin/payments",
      action: "Open Payment Verification",
    },
    {
      title: "Discount Verification",
      description:
        "Review discount claims and manage additional payments for rejected claims.",
      href: "/admin/discounts",
      action: "Open Discount Verification",
    },
    {
      title: "Group Assignment",
      description:
        "Organize eligible online and on-site delegates into camp groups.",
      href: "/admin/groups",
      action: "Open Group Assignment",
    },
    {
      title: "On-Site Registration",
      description:
        "Register walk-in churches and delegates using the organizer's iPad.",
      href: "/admin/onsite",
      action: "Open Registration Form",
    },
    {
      title: "On-Site Records",
      description:
        "View and manage walk-in registrations, church details, delegates, payments, and discount verification.",
      href: "/admin/onsite/records",
      action: "Manage On-Site Records",
    },
    {
      title: "Reports",
      description:
        "View registration, delegate, financial, discount, and group assignment reports.",
      href: "/admin/reports",
      action: "Open Reports",
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
            Here's an overview of your Youth Camp 2027 registrations and
            operations.
          </p>
        </div>

        <section>
          <h3 className="mb-5 text-lg font-bold">
            Registration Overview
          </h3>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

                <Link
                  href={item.href}
                  className="mt-6 inline-flex w-fit items-center rounded-full bg-[#304b38] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#46634d]"
                >
                  {item.action} →
                </Link>
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
