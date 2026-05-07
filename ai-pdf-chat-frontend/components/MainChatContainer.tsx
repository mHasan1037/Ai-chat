import React, { useState } from "react";
import ChatInput from "./ChatInput";
import AllChats from "./AllChats";
import { useAIChat } from "../hooks/useAIChat";

export type Source = {
  content: string;
  metadata: {
    source: string;
    loc?: {
      lines?: {
        from: number;
        to: number;
      };
    };
  };
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export type ChatApiResponse = {
  query: string;
  answer: string;
  sources: Source[];
};

const MainChatContainer = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatWithAiMutation = useAIChat();

  const handleUserChatInput = (chat: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: chat,
    };
    setMessages((prev) => [...prev, userMsg]);
    chatWithAiMutation.mutate(chat, {
      onSuccess: (data) => {
        const aiMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        };
        setMessages((prev) => [...prev, aiMsg]);
      },
    });
  };
  return (
    <div className="flex flex-col h-screen">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_theme(colors.amber.400)]" />
        <span className="text-xs tracking-[0.25em] uppercase font-mono text-white/40">
          Active Session
        </span>
      </div>

      {/* Chat area fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <AllChats
          messages={messages}
          isLoading={chatWithAiMutation.isPending}
        />
      </div>

      {/* Input pinned to bottom */}
      <ChatInput chatInput={handleUserChatInput} />
    </div>
  );
};

export default MainChatContainer;
