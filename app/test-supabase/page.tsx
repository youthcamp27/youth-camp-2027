
"use client";

import { useEffect, useState } from "react";

export default function SupabaseTest() {
  const [status, setStatus] = useState("Testing connection...");
  const [details, setDetails] = useState("");

  useEffect(() => {
    async function testConnection() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

        if (!url || !key) {
          setStatus("Missing environment variables");
          return;
        }

        const response = await fetch(`${url}/auth/v1/settings`, {
          headers: {
            apikey: key,
          },
        });

        const result = await response.text();

        if (response.ok) {
          setStatus("Supabase connection successful!");
          setDetails("Your Publishable key is working.");
        } else {
          setStatus(`Connection error: ${response.status}`);
          setDetails(result);
        }
      } catch (error) {
        setStatus("Connection failed.");
        setDetails(String(error));
      }
    }

    testConnection();
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Supabase Connection Test</h1>
      <h2>{status}</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{details}</pre>
    </main>
  );
}
