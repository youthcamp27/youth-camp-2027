
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8f5] px-6 py-12 text-[#20251f]">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-10 inline-block text-sm text-gray-500 hover:text-[#304b38]"
        >
          ← Back to Home
        </Link>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#e9f0e9] text-2xl text-[#304b38]">
              ✦
            </div>

            <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-[#66836b]">
              YOUTH CAMP 2027
            </p>

            <h1 className="text-3xl font-bold">
              Organizer Login
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Sign in to access the private management portal.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>

              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your organizer email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#66836b] focus:ring-2 focus:ring-[#66836b]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>

              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#66836b] focus:ring-2 focus:ring-[#66836b]/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#304b38] px-6 py-4 font-semibold text-white transition hover:bg-[#243b2c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In →"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-400">
            Authorized organizers only.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          © 2027 Youth Camp. All Rights Reserved.
        </p>
      </div>
    </main>
  );
}
