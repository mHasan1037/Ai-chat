import { useTheme } from "@/context/ThemeContext";
import React from "react";

const ToggleTheme = () => {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative cursor-pointer flex items-center w-14 h-7 rounded-full border transition-all duration-500 focus:outline-none
            ${
              dark
                ? "bg-white/10 border-white/20 hover:border-amber-400/50"
                : "bg-black/10 border-black/20 hover:border-amber-500/50"
            }`}
      aria-label="Toggle theme"
    >
      <span className="absolute left-1.5 text-[11px]">🌙</span>
      <span className="absolute right-1.5 text-[11px]">☀️</span>
      <span
        className={`absolute w-5 h-5 rounded-full bg-amber-400 shadow-md transition-all duration-500
            ${dark ? "left-1" : "left-[calc(100%-1.5rem)]"}`}
      />
    </button>
  );
};

export default ToggleTheme;
