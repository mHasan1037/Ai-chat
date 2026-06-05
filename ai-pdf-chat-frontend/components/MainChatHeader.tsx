import React from "react";
import ToggleTheme from "./ToggleTheme";
import AccountMenu from "./AccountMenu";
import { useTheme } from "@/context/ThemeContext";
import { ChatSession } from "./ChatHistory";

const MainChatHeader = ({activeChat} : {activeChat: ChatSession | null;}) => {
  const { theme } = useTheme();
  const dark = theme === "dark";
  return (
    <div
      className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-500
        ${dark ? "border-white/10 bg-white/[0.02]" : "border-black/10 bg-black/[0.02]"}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_theme(colors.amber.400)]" />
        <span
          className={`text-xs tracking-[0.25em] uppercase font-mono ${dark ? "text-white/40" : "text-gray-400"}`}
        >
          {activeChat ? activeChat.title : "No Active Session"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <ToggleTheme />
        <AccountMenu dark={dark} />
      </div>
    </div>
  );
};

export default MainChatHeader;
