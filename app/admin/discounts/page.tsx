
import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import DiscountActions from "./discount-actions";

export const instant = false;

export default async function DiscountsPage() {
  await connection();

  // Verify administrator access.
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

  // Retrieve pending discount claims.
  const [
    { data: delegates, error: delegatesError },
    { data: registrations, error: registrationsError },
    { data: churches, error: churchesError },
  ] = await Promise.all([
    supabaseAdmin
      .from("Delegates")
      .select("*")
      .eq("Discount Status", "pending")
      .order("Full Name", { ascending: true }),

    supabaseAdmin.from("Registrations").select("*"),

    supabaseAdmin.from("Churches").select("*"),
  ]);

  if (delegatesError || registrationsError || churchesError) {
    console.error("Discount page errors:", {
      delegatesError,
      registrationsError,
      churchesError,
    });

    throw new Error("Could not retrieve discount claims.");
  }

  const discountLabels: Record<string, string> = {
    pastor_child: "Pastor's Child",
    missionary_child: "Missionary's Child",
    bible_school_student: "Bible School Student",
  };

  const discountRecords = (delegates ?? []).map((delegate) => {
    const registration = registrations?.find(
      (item) => item.id === delegate.registration_id
    );

    const church = churches?.find(
      (item) => item.id === registration?.church_id
    );

    return {
      ...delegate,
      churchName: church?.["Church Name"] ?? "Unknown Church",
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

            <h1 className="mt-1 text-xl font-bold">
              Discount Verification
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
            REGISTRATION MANAGEMENT
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Pending Discount Claims
          </h2>

          <p className="mt-2 text-gray-500">
            Review delegates claiming the 50% registration discount.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Awaiting Review
          </p>

          <p className="mt-3 text-4xl font-bold text-[#304b38]">
            {discountRecords.length}
          </p>

          <p className="mt-2 text-xs text-gray-400">
            Discount claims requiring organizer verification
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h3 className="font-bold">Discount Submissions</h3>

            <p className="mt-1 text-sm text-gray-500">
              Verify each delegate's eligibility before approving payment.
            </p>
          </div>

          {discountRecords.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {discountRecords.map((delegate) => (
                <div key={delegate.id} className="p-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div>
                      <h4 className="text-lg font-bold">
                        {delegate["Full Name"]}
                      </h4>

                      <p className="mt-1 text-sm text-gray-500">
                        {delegate.churchName}
                      </p>
                    </div>

                    <span className="inline-flex h-fit w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      Pending Review
                    </span>
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-400">
                        Discount Category
                      </p>

                      <p className="mt-1 font-medium">
                        {discountLabels[delegate["Discount Type"]] ??
                          "Unknown Discount"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Current Registration Fee
                      </p>

                      <p className="mt-1 font-semibold">
                        ₱{Number(delegate["Registration Fee"]).toLocaleString("en-PH")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Fee if Rejected
                      </p>

                      <p className="mt-1 font-semibold">
                        ₱600
                      </p>
                    </div>
                  </div>

                  <DiscountActions delegateId={delegate.id} />
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-gray-600">
                No pending discount claims.
              </p>

              <p className="mt-2 text-sm text-gray-400">
                New discount claims will appear here for review.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
