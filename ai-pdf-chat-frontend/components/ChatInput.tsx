import React, { useState } from "react";

interface ChatInputProps {
  chatInput: (chat: string) => void;
}

const ChatInput = ({ chatInput }: ChatInputProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (!value.trim()) return;
    chatInput(value);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
  };
  return (
    <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] backdrop-blur-sm">
      <div
        className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3
        focus-within:border-amber-400/40 focus-within:bg-amber-400/[0.03] transition-all duration-300"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your document…"
          className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20
            font-mono outline-none caret-amber-400"
        />

        <button
          onClick={handleSubmit}
          className="group flex items-center justify-center w-8 h-8 rounded-xl bg-amber-400
            hover:bg-amber-300 active:scale-95 transition-all duration-200
            shadow-[0_0_16px_theme(colors.amber.400/30)] hover:shadow-[0_0_24px_theme(colors.amber.400/50)]"
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
      <p className="text-[10px] text-white/15 font-mono mt-2 text-center tracking-widest">
        ENTER ↵ to send
      </p>
    </div>
  );
};

export default ChatInput;
