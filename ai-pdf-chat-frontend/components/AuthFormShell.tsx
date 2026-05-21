"use client";

import { useTheme } from "@/context/ThemeContext";

type AuthFormShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthFormShell({ title, subtitle, children }: AuthFormShellProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div
      className={`relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 transition-colors duration-500 ${
        dark ? "bg-[#0a0a0f] text-white" : "bg-[#f0f4f8] text-gray-900"
      }`}
    >
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className={`absolute left-[-8%] top-[-12%] h-[42vw] w-[42vw] rounded-full blur-[120px] transition-colors duration-500 ${
            dark ? "bg-amber-500/10" : "bg-blue-400/15"
          }`}
        />
        <div
          className={`absolute bottom-[-12%] right-[-8%] h-[36vw] w-[36vw] rounded-full blur-[120px] transition-colors duration-500 ${
            dark ? "bg-violet-600/10" : "bg-indigo-400/15"
          }`}
        />
      </div>

      <main
        className={`relative z-10 w-full max-w-md rounded-2xl border p-8 shadow-2xl transition-colors duration-500 ${
          dark
            ? "border-white/10 bg-white/5"
            : "border-black/10 bg-white/70"
        }`}
      >
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-400/80">
          Document Vault
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className={`mt-2 text-sm ${dark ? "text-white/50" : "text-gray-500"}`}>
          {subtitle}
        </p>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
