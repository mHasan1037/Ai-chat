"use client";

import { AuthFormShell } from "@/components/AuthFormShell";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Could not start reset");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthFormShell
      title="Reset password"
      subtitle="Enter your email and we will prepare a reset flow."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="mb-2 block text-white/60">Email</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-amber-400/60"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        {sent ? (
          <p className="text-sm text-emerald-300">
            If that email exists, a reset link would be sent.
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          className="w-full rounded-xl border border-amber-400/30 bg-amber-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Preparing reset..." : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-white/50">
        Remembered it?{" "}
        <Link className="text-amber-300 transition hover:text-amber-200" href="/login">
          Sign in
        </Link>
      </p>
    </AuthFormShell>
  );
}
