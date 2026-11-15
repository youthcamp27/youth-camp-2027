import { redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const instant = false;

export default async function RegistrationsPage() {
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
    { data: churches, error: churchesError },
    { data: registrations, error: registrationsError },
    { data: delegates, error: delegatesError },
  ] = await Promise.all([
    supabaseAdmin
      .from("Churches")
      .select("*")
      .order("Timestamp", { ascending: false }),

    supabaseAdmin.from("Registrations").select("*"),

    supabaseAdmin.from("Delegates").select("*"),
  ]);

  const hasError =
    churchesError || registrationsError || delegatesError;

  if (hasError) {
    console.error("Registration page errors:", {
      churchesError,
      registrationsError,
      delegatesError,
    });
  }

  const totalChurches = churches?.length ?? 0;
  const totalRegistrations = registrations?.length ?? 0;
  const totalDelegates = delegates?.length ?? 0;

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#20251f]">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#66836b]">
              YOUTH CAMP 2027
            </p>
            <h1 className="mt-1 text-xl font-bold">
              Registration Management
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
            MANAGEMENT CENTER
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Church Registrations
          </h2>
          <p className="mt-2 text-gray-500">
            View churches that have submitted their camp pre-registration.
          </p>
        </div>

        {hasError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            We couldn't retrieve some registration records. Check the VS Code terminal for details.
          </div>
        )}

        <section className="mb-8 grid gap-5 sm:grid-cols-3">
          {[
            { label: "Registered Churches", value: totalChurches },
            { label: "Registration Submissions", value: totalRegistrations },
            { label: "Total Delegates", value: totalDelegates },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-[#304b38]">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h3 className="font-bold">Church List</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a church name to view its complete registration.
            </p>
          </div>

          {churches && churches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f7f8f5] text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Church</th>
                    <th className="px-6 py-4">Representative</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Delegates</th>
                    <th className="px-6 py-4">Date Submitted</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {churches.map((church) => {
                    const churchRegistration = registrations?.find(
                      (registration) =>
                        registration.church_id === church.id
                    );

                    const churchDelegates = delegates?.filter(
                      (delegate) =>
                        delegate.registration_id === churchRegistration?.id
                    ).length ?? 0;

                    return (
                      <tr key={church.id} className="hover:bg-gray-50">
                        <td className="px-6 py-5">
                          {churchRegistration ? (
                            <Link
                              href={`/admin/registrations/${churchRegistration.id}`}
                              className="font-semibold text-[#304b38] hover:underline"
                            >
                              {church["Church Name"]} →
                            </Link>
                          ) : (
                            <p className="font-semibold">
                              {church["Church Name"]}
                            </p>
                          )}

                          <p className="mt-1 text-xs text-gray-400">
                            {church["Church Address"]}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          {church["Delegation Head Name"]}
                        </td>

                        <td className="px-6 py-5">
                          <p>{church["Contact No."]}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {church["Email Address"] || "No email provided"}
                          </p>
                        </td>

                        <td className="px-6 py-5 font-semibold">
                          {churchDelegates}
                        </td>

                        <td className="px-6 py-5 text-gray-500">
                          {church.Timestamp
                            ? new Date(church.Timestamp).toLocaleDateString(
                                "en-PH",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-gray-600">
                No church registrations yet.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Submitted registrations will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}