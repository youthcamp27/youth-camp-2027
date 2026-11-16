
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import OnsiteRegistrationForm from "./onsite-registration-form";

export const instant = false;

export default async function OnsiteRegistrationPage() {
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
    { count: registrationCount, error: registrationError },
    { count: delegateCount, error: delegateError },
    { count: pendingPaymentCount, error: pendingPaymentError },
    { count: verifiedPaymentCount, error: verifiedPaymentError },
  ] = await Promise.all([
    supabaseAdmin
      .from("On-Site Registrations")
      .select("*", { count: "exact", head: true }),

    supabaseAdmin
      .from("Delegates")
      .select("*", { count: "exact", head: true })
      .not("onsite_registration_id", "is", null),

    supabaseAdmin
      .from("On-Site Payments")
      .select("*", { count: "exact", head: true })
      .eq("Status", "pending_verification"),

    supabaseAdmin
      .from("On-Site Payments")
      .select("*", { count: "exact", head: true })
      .eq("Status", "verified"),
  ]);

  const hasError =
    registrationError ||
    delegateError ||
    pendingPaymentError ||
    verifiedPaymentError;

  if (hasError) {
    console.error("On-site registration statistics error:", {
      registrationError,
      delegateError,
      pendingPaymentError,
      verifiedPaymentError,
    });
  }

  const stats = [
    {
      label: "Walk-in Registrations",
      value: hasError ? "—" : registrationCount ?? 0,
      description: "Total on-site registration submissions",
    },
    {
      label: "Walk-in Delegates",
      value: hasError ? "—" : delegateCount ?? 0,
      description: "Participants registered on-site",
    },
    {
      label: "Pending Payments",
      value: hasError ? "—" : pendingPaymentCount ?? 0,
      description: "Awaiting payment verification",
    },
    {
      label: "Verified Payments",
      value: hasError ? "—" : verifiedPaymentCount ?? 0,
      description: "Payments confirmed by the organizer",
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
              On-Site Registration
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
            WALK-IN MANAGEMENT
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Walk-in Delegates
          </h2>

          <p className="mt-2 max-w-2xl text-gray-500">
            Register delegates who arrive at the camp without completing
            online pre-registration. Record their combined payment and
            verify their registration separately from online submissions.
          </p>
        </div>

        {hasError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            We couldn't retrieve some on-site registration statistics.
            Check the VS Code terminal for detailed error information.
          </div>
        )}

        <section className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold text-[#304b38]">
                {stat.value}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                {stat.description}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold">
              New Walk-in Registration
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add multiple delegates under one registration and record
              one combined payment.
            </p>
          </div>

          <OnsiteRegistrationForm />
        </section>

        <div className="mt-6 text-center">
          <Link
            href="/admin/onsite/records"
            className="text-sm font-semibold text-[#304b38] hover:underline"
          >
            View On-Site Records →
          </Link>
        </div>

        <footer className="mt-16 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
          Youth Camp 2027 Organizer Portal
        </footer>
      </div>
    </main>
  );
}
