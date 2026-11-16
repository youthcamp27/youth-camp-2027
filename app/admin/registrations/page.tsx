
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
    { data: onsiteRegistrations, error: onsiteError },
  ] = await Promise.all([
    supabaseAdmin.from("Churches").select("*").order("Timestamp", { ascending: false }),
    supabaseAdmin.from("Registrations").select("*"),
    supabaseAdmin.from("Delegates").select("*"),
    supabaseAdmin.from("On-Site Registrations").select("*").order("Timestamp", { ascending: false }),
  ]);

  const hasError =
    churchesError || registrationsError || delegatesError || onsiteError;

  if (hasError) {
    console.error("Registration page errors:", {
      churchesError,
      registrationsError,
      delegatesError,
      onsiteError,
    });
  }

  const onlineChurches = churches ?? [];
  const onlineRegistrations = registrations ?? [];
  const allDelegates = delegates ?? [];
  const walkInRegistrations = onsiteRegistrations ?? [];

  const normalizeChurchName = (name: string | null | undefined) =>
    (name ?? "").trim().toLowerCase();

  type ChurchRow = {
    key: string;
    name: string;
    address: string;
    representative: string;
    contact: string;
    email: string;
    timestamp: string | null;
    onlineRegistrationId: string | null;
    onsiteRegistrationId: string | null;
    delegateCount: number;
    onlineSubmissionCount: number;
    onsiteSubmissionCount: number;
  };

  const churchMap = new Map<string, ChurchRow>();

  for (const church of onlineChurches) {
    const name = church["Church Name"] || "Unnamed Church";
    const key = normalizeChurchName(name) || `online-${church.id}`;

    const churchRegistrationList = onlineRegistrations
      .filter((registration) => registration.church_id === church.id)
      .sort(
        (a, b) =>
          new Date(b.Timestamp ?? 0).getTime() -
          new Date(a.Timestamp ?? 0).getTime()
      );

    const registrationIds = churchRegistrationList.map(
      (registration) => registration.id
    );

    const onlineDelegateCount = allDelegates.filter((delegate) =>
      registrationIds.includes(delegate.registration_id)
    ).length;

    churchMap.set(key, {
      key,
      name,
      address: church["Church Address"] || "",
      representative: church["Delegation Head Name"] || "",
      contact: church["Contact No."] || "",
      email: church["Email Address"] || "",
      timestamp: church.Timestamp || null,
      onlineRegistrationId: churchRegistrationList[0]?.id ?? null,
      onsiteRegistrationId: null,
      delegateCount: onlineDelegateCount,
      onlineSubmissionCount: churchRegistrationList.length,
      onsiteSubmissionCount: 0,
    });
  }

  for (const registration of walkInRegistrations) {
    const name = registration["Church Name"]?.trim();
    if (!name) continue;

    const key = normalizeChurchName(name);

    const onsiteDelegateCount = allDelegates.filter(
      (delegate) => delegate.onsite_registration_id === registration.id
    ).length;

    const existingChurch = churchMap.get(key);

    if (existingChurch) {
      existingChurch.delegateCount += onsiteDelegateCount;
      existingChurch.onsiteSubmissionCount += 1;

      if (
        registration.Timestamp &&
        (!existingChurch.timestamp ||
          new Date(registration.Timestamp).getTime() >
            new Date(existingChurch.timestamp).getTime())
      ) {
        existingChurch.timestamp = registration.Timestamp;
      }

      if (!existingChurch.onsiteRegistrationId) {
        existingChurch.onsiteRegistrationId = registration.id;
      }
    } else {
      churchMap.set(key, {
        key,
        name,
        address: registration["Church Address"] || "",
        representative:
          registration["Delegation Head Name"] ||
          registration["Registered By"] ||
          "",
        contact: registration["Contact No."] || "",
        email: registration["Email Address"] || "",
        timestamp: registration.Timestamp || null,
        onlineRegistrationId: null,
        onsiteRegistrationId: registration.id,
        delegateCount: onsiteDelegateCount,
        onlineSubmissionCount: 0,
        onsiteSubmissionCount: 1,
      });
    }
  }

  const churchRows = Array.from(churchMap.values()).sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return dateB - dateA;
  });

  const totalChurches = churchRows.length;
  const totalRegistrations =
    onlineRegistrations.length + walkInRegistrations.length;
  const totalDelegates = allDelegates.length;

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#20251f]">
      <header className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#66836b]">
              YOUTH CAMP 2027
            </p>
            <h1 className="mt-1 text-xl font-bold">Registration Management</h1>
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
          <p className="text-sm font-medium text-[#66836b]">MANAGEMENT CENTER</p>
          <h2 className="mt-2 text-3xl font-bold">Church Registrations</h2>
          <p className="mt-2 text-gray-500">
            View churches and delegates from both online and on-site registrations.
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
              Open the online or walk-in submission details for each church.
            </p>
          </div>

          {churchRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f7f8f5] text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Church</th>
                    <th className="px-6 py-4">Representative</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Delegates</th>
                    <th className="px-6 py-4">Submissions</th>
                    <th className="px-6 py-4">Date Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {churchRows.map((church) => (
                    <tr key={church.key} className="hover:bg-gray-50">
                      <td className="px-6 py-5">
                        <p className="font-semibold">{church.name}</p>
                        {church.address && (
                          <p className="mt-1 text-xs text-gray-400">
                            {church.address}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                          {church.onlineRegistrationId && (
                            <Link
                              href={`/admin/registrations/${church.onlineRegistrationId}`}
                              className="text-[#304b38] hover:underline"
                            >
                              Online details →
                            </Link>
                          )}
                          {church.onsiteRegistrationId && (
                            <Link
                              href={`/admin/registrations/${church.onsiteRegistrationId}`}
                              className="text-blue-700 hover:underline"
                            >
                              Walk-in details →
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">{church.representative || "—"}</td>
                      <td className="px-6 py-5">
                        {church.contact || "—"}
                        {church.email && (
                          <p className="mt-1 text-xs text-gray-400">
                            {church.email}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5 font-semibold">
                        {church.delegateCount}
                      </td>
                      <td className="px-6 py-5">
                        <p>
                          {church.onlineSubmissionCount +
                            church.onsiteSubmissionCount}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {church.onlineSubmissionCount} online ·{" "}
                          {church.onsiteSubmissionCount} walk-in
                        </p>
                      </td>
                      <td className="px-6 py-5 text-gray-500">
                        {church.timestamp
                          ? new Date(church.timestamp).toLocaleDateString(
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
                  ))}
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
