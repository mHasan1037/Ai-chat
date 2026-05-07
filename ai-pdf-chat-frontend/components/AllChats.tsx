import React from "react";
import { ChatMessage } from "./MainChatContainer";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  messages: ChatMessage[];
  isLoading: boolean;
};

const AllChats = ({ messages, isLoading }: Props) => {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <div
      className="h-full overflow-y-auto px-6 py-6 flex flex-col gap-4 scroll-smooth
      [scrollbar-width:thin] [scrollbar-color:rgba(128,128,128,0.2)_transparent]"
    >
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-24 select-none">
          {/* CHANGE: Empty state icon panel color switches */}
          <div
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-4
            ${dark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"}`}
          >
            <span className="text-2xl">✦</span>
          </div>
          <p
            className={`text-sm font-mono tracking-wide ${dark ? "text-white/30" : "text-gray-400"}`}
          >
            Ask me anything about your documents
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {/* CHANGE: AI bubble switches from dark glass to light glass */}
          <div
            className={`max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed
            ${
              msg.role === "user"
                ? "bg-amber-400 text-black font-medium rounded-br-sm"
                : dark
                  ? "bg-white/8 border border-white/10 text-white/80 rounded-bl-sm backdrop-blur-sm"
                  : "bg-white/80 border border-black/10 text-gray-700 rounded-bl-sm backdrop-blur-sm shadow-sm"
            }`}
          >
            <p>{msg.content}</p>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          {/* CHANGE: Loading bubble switches between dark/light glass */}
          <div
            className={`rounded-2xl rounded-bl-sm px-4 py-3 backdrop-blur-sm
            ${dark ? "bg-white/8 border border-white/10" : "bg-white/80 border border-black/10 shadow-sm"}`}
          >
            <div className="flex gap-1.5 items-center h-4">
              <span className="w-1.5 h-1.5 bg-amber-400/70 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-amber-400/70 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-amber-400/70 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllChats;
