import React from "react";
import { ChatMessage } from "./MainChatContainer";

type Props = {
  messages: ChatMessage[];
  isLoading: boolean;
};

const AllChats = ({ messages, isLoading }: Props) => {
  return (
    <div
      className="h-full overflow-y-auto px-6 py-6 flex flex-col gap-4 scroll-smooth
      [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]"
    >
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-24 select-none">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <span className="text-2xl">✦</span>
          </div>
          <p className="text-white/30 text-sm font-mono tracking-wide">
            Ask me anything about your documents
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed
            ${
              msg.role === "user"
                ? "bg-amber-400 text-black font-medium rounded-br-sm shadow-[0_0_20px_theme(colors.amber.400/20)]"
                : "bg-white/8 border border-white/10 text-white/80 rounded-bl-sm backdrop-blur-sm"
            }`}
          >
            <p>{msg.content}</p>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white/8 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 backdrop-blur-sm">
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
