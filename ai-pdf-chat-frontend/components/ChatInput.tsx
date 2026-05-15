import { useTheme } from "@/context/ThemeContext";
import React, { useState } from "react";

interface ChatInputProps {
  chatInput: (chat: string) => void;
  disabled?: boolean;
}

const ChatInput = ({ chatInput, disabled = false }: ChatInputProps) => {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (disabled || !value.trim()) return;
    chatInput(value);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div
      className={`px-6 py-4 border-t transition-colors duration-500
      ${dark ? "border-white/10 bg-white/[0.02]" : "border-black/10 bg-black/[0.02]"}`}
    >
      <div
        className={`flex items-center gap-3 border rounded-2xl px-4 py-3 transition-all duration-300
        ${
          dark
            ? "bg-white/5 border-white/10 focus-within:border-amber-400/40 focus-within:bg-amber-400/[0.03]"
            : "bg-white/70 border-black/10 focus-within:border-amber-500/40 focus-within:bg-amber-50/50"
        }`}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={
            disabled ? "Upload or select a PDF chat" : "Ask about your document..."
          }
          className={`flex-1 bg-transparent text-sm font-mono outline-none caret-amber-400
            ${dark ? "text-white/80 placeholder:text-white/20" : "text-gray-700 placeholder:text-gray-400"}`}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className="group flex items-center justify-center w-8 h-8 rounded-xl cursor-pointer bg-amber-400
            hover:bg-amber-300 active:scale-95 transition-all duration-200 hover:bg-amber-500
            disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            className="w-3.5 h-3.5 text-black -rotate-90"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19V5m-7 7 7-7 7 7"
            />
          </svg>
        </button>
      </div>

      <p
        className={`text-[10px] font-mono mt-2 text-center tracking-widest
        ${dark ? "text-white/15" : "text-gray-300"}`}
      >
        ENTER to send
      </p>
    </div>
  );
};

export default ChatInput;
