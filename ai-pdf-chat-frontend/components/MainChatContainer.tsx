import React from "react";
import ChatInput from "./ChatInput";
import AllChats from "./AllChats";
import { useAIChat } from "../hooks/useAIChat";
import { useTheme } from "@/context/ThemeContext";
import type { ChatSession } from "./ChatHistory";

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

type Props = {
  activeChat: ChatSession | null;
  messages: ChatMessage[];
  referenceCollectionNames: string[];
  onMessagesChange: (messages: ChatMessage[]) => void;
};

const MainChatContainer = ({
  activeChat,
  messages,
  referenceCollectionNames,
  onMessagesChange,
}: Props) => {
  const chatWithAiMutation = useAIChat();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";

  const handleUserChatInput = (chat: string) => {
    if (!activeChat) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: chat,
    };
    onMessagesChange([...messages, userMsg]);
    chatWithAiMutation.mutate(
      {
        input: chat,
        collectionName: activeChat.collectionName,
        referenceCollectionNames,
      },
      {
        onSuccess: (data) => {
          const aiMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.answer,
            sources: data.sources,
          };
          onMessagesChange([...messages, userMsg, aiMsg]);
        },
        onError: (error) => {
          const aiMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              error instanceof Error
                ? `I could not answer from this PDF yet: ${error.message}`
                : "I could not answer from this PDF yet.",
          };
          onMessagesChange([...messages, userMsg, aiMsg]);
        },
      },
    );
  };
  return (
    <div className="flex flex-col h-screen">
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

        <button
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
      </div>

      <div className="flex-1 overflow-hidden">
        <AllChats
          messages={messages}
          isLoading={chatWithAiMutation.isPending}
        />
      </div>

      <ChatInput chatInput={handleUserChatInput} disabled={!activeChat} />
    </div>
  );
};

export default MainChatContainer;
