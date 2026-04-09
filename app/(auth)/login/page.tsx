"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
    });

    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-6">
      <section className="card w-full">
        <h1 className="text-2xl font-semibold">Sign in to LeadPilot</h1>
        <p className="mt-2 text-sm text-slate-600">Use passwordless magic link authentication powered by Supabase.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          <button type="submit" className="button-primary w-full">
            Send magic link
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}
      </section>
    </main>
  );
}
