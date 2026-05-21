"use client";

import { AuthFormShell } from "@/components/AuthFormShell";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signup(email, password);
      router.replace("/");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Could not sign up");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthFormShell
      title="Create account"
      subtitle="Start a private workspace for your PDF chats."
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
        <label className="block text-sm">
          <span className="mb-2 block text-white/60">Password</span>
          <input
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-amber-400/60"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          className="w-full rounded-xl border border-amber-400/30 bg-amber-400 px-4 py-3 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-white/50">
        Already have an account?{" "}
        <Link className="text-amber-300 transition hover:text-amber-200" href="/login">
          Sign in
        </Link>
      </p>
    </AuthFormShell>
  );
}
