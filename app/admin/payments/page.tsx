
import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PaymentActions from "./payment-actions";

export const instant = false;

export default async function PaymentsPage() {
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
      .eq("Status", "pending_verification")
      .order("Timestamp", { ascending: false }),

    supabaseAdmin.from("Registrations").select("*"),

    supabaseAdmin.from("Churches").select("*"),
  ]);

  if (paymentsError || registrationsError || churchesError) {
    console.error("Payment page database errors:", {
      paymentsError,
      registrationsError,
      churchesError,
    });

    throw new Error("Could not retrieve payment records.");
  }

  const paymentRecords = await Promise.all(
    (payments ?? []).map(async (payment) => {
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

      const registration = registrations?.find(
        (item) => item.id === payment.registration_id
      );

      const church = churches?.find(
        (item) => item.id === registration?.church_id
      );

      return {
        ...payment,
        churchName: church?.["Church Name"] ?? "Unknown Church",
        registrationId: registration?.id,
        receiptUrl,
      };
    })
  );

  const formatDate = (value: string | null) =>
    value
      ? new Date(value).toLocaleString("en-PH", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#20251f]">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#66836b]">
              YOUTH CAMP 2027
            </p>
            <h1 className="mt-1 text-xl font-bold">
              Payment Verification
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/admin/payments/history"
              className="text-sm font-semibold text-[#66836b] hover:underline"
            >
              Payment History →
            </Link>

            <Link
              href="/admin"
              className="text-sm font-medium text-gray-500 hover:text-[#304b38]"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#66836b]">
            FINANCE MANAGEMENT
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Pending Payments
          </h2>

          <p className="mt-2 text-gray-500">
            Review submitted GCash payments and their supporting receipts.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Awaiting Verification
          </p>

          <p className="mt-3 text-4xl font-bold text-[#304b38]">
            {paymentRecords.length}
          </p>

          <p className="mt-2 text-xs text-gray-400">
            Payments requiring finance review
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h3 className="font-bold">Payment Submissions</h3>

            <p className="mt-1 text-sm text-gray-500">
              Review each payment submission and its receipt.
            </p>
          </div>

          {paymentRecords.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {paymentRecords.map((payment) => (
                <div key={payment.id} className="p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                      <h4 className="text-lg font-bold">
                        {payment.churchName}
                      </h4>

                      <p className="mt-1 text-sm text-gray-500">
                        Submitted {formatDate(payment.Timestamp)}
                      </p>
                    </div>

                    <span className="inline-flex h-fit w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      Pending
                    </span>
                  </div>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-400">
                        Amount Submitted
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        ₱{Number(payment.Amount).toLocaleString("en-PH")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        GCash Reference
                      </p>

                      <p className="mt-1 font-medium">
                        {payment["GCash Reference"] || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-gray-100 pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Uploaded Receipt
                    </p>

                    {payment.receiptUrl ? (
                      <a
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg bg-[#304b38] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#243b2c]"
                      >
                        View GCash Receipt ↗
                      </a>
                    ) : (
                      <p className="text-sm text-red-600">
                        Receipt unavailable. Check the storage record.
                      </p>
                    )}
                  </div>

                  {payment.registrationId && (
                    <div className="mt-5">
                      <Link
                        href={`/admin/registrations/${payment.registrationId}`}
                        className="text-sm font-semibold text-[#66836b] hover:underline"
                      >
                        View Full Registration →
                      </Link>
                    </div>
                  )}

                  <PaymentActions paymentId={payment.id} />
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-gray-600">
                No pending payments.
              </p>

              <p className="mt-2 text-sm text-gray-400">
                New payment submissions awaiting verification will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
