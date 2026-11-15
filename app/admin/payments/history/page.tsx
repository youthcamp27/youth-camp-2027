
import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PaymentHistoryList from "./history-list";

export const instant = false;

export default async function PaymentHistoryPage() {
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
    { data: payments, error: paymentsError },
    { data: registrations, error: registrationsError },
    { data: churches, error: churchesError },
  ] = await Promise.all([
    supabaseAdmin
      .from("Payments")
      .select("*")
      .order("Timestamp", { ascending: false }),

    supabaseAdmin.from("Registrations").select("*"),

    supabaseAdmin.from("Churches").select("*"),
  ]);

  if (paymentsError || registrationsError || churchesError) {
    console.error("Payment history errors:", {
      paymentsError,
      registrationsError,
      churchesError,
    });

    throw new Error("Could not retrieve payment history.");
  }

  const records = await Promise.all(
    (payments ?? []).map(async (payment) => {
      const registration = registrations?.find(
        (item) => item.id === payment.registration_id
      );

      const church = churches?.find(
        (item) => item.id === registration?.church_id
      );

      let receiptUrl: string | null = null;

      if (payment.receipt_path) {
        const { data: receipt, error: receiptError } =
          await supabaseAdmin.storage
            .from("gcash-receipts")
            .createSignedUrl(payment.receipt_path, 300);

        if (receiptError) {
          console.error("Receipt link error:", receiptError.message);
        } else {
          receiptUrl = receipt.signedUrl;
        }
      }

      let verifiedByEmail: string | null = null;

      if (payment.verified_by) {
        const { data: verifiedUser } =
          await supabaseAdmin.auth.admin.getUserById(
            payment.verified_by
          );

        verifiedByEmail = verifiedUser.user?.email ?? null;
      }

      return {
        id: payment.id,
        registrationId: registration?.id ?? null,
        churchName: church?.["Church Name"] ?? "Unknown Church",
        amount: Number(payment.Amount),
        reference: payment["GCash Reference"] ?? "",
        status: payment.Status ?? "unknown",
        submittedAt: payment.Timestamp ?? null,
        verifiedAt: payment.verified_at ?? null,
        verifiedByEmail,
        financeNotes: payment.finance_notes ?? "",
        receiptUrl,
      };
    })
  );

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#20251f]">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#66836b]">
              YOUTH CAMP 2027
            </p>
            <h1 className="mt-1 text-xl font-bold">
              Payment History
            </h1>
          </div>

          <Link
            href="/admin/payments"
            className="text-sm font-medium text-gray-500 hover:text-[#304b38]"
          >
            ← Payment Verification
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#66836b]">
            FINANCE MANAGEMENT
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            All Payment Records
          </h2>

          <p className="mt-2 text-gray-500">
            Search and review pending, verified, and rejected payments.
          </p>
        </div>

        <PaymentHistoryList records={records} />
      </div>
    </main>
  );
}
