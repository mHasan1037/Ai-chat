import React, { useEffect, useRef, useState } from "react";
import ChatInput from "./ChatInput";
import AllChats from "./AllChats";
import { useAIChat } from "../hooks/useAIChat";
import { useTheme } from "@/context/ThemeContext";
import type { ChatSession } from "./ChatHistory";
import { useUpdateMessages } from "@/hooks/useUpdateMessage";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { FaSignOutAlt } from "react-icons/fa";

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
};

const AccountMenu = ({ dark }: { dark: boolean }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const menuRef = useRef<HTMLDivElement>(null);
  const [openTopLeftMenu, setOpenTopLeftMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const userFirstCharacter = user?.email?.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenTopLeftMenu(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
      queryClient.clear();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
      setOpenTopLeftMenu(false);
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpenTopLeftMenu((current) => !current)}
        className={`grid h-9 w-9 cursor-pointer place-items-center rounded-full border text-sm font-semibold uppercase shadow-sm transition-all duration-300 focus:outline-none ${
          dark
            ? "border-amber-400/30 bg-amber-400/15 text-amber-200 hover:border-amber-400/60"
            : "border-amber-500/30 bg-amber-100 text-amber-700 hover:border-amber-500/60"
        }`}
        aria-label="Open account menu"
        aria-expanded={openTopLeftMenu}
      >
        {userFirstCharacter}
      </button>

      {openTopLeftMenu ? (
        <div
          className={`absolute right-0 top-12 z-30 w-56 rounded-xl border p-2 shadow-2xl ${
            dark
              ? "border-white/10 bg-[#14141c] text-white"
              : "border-black/10 bg-white text-gray-900"
          }`}
        >
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`mt-2 flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
              dark
                ? "text-white/75 hover:bg-red-400/10 hover:text-red-300"
                : "text-gray-700 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <FaSignOutAlt className="text-xs" />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      ) : null}
    </div>
  );
};

const MainChatContainer = ({
  activeChat,
  messages,
  referenceCollectionNames,
}: Props) => {
  const updateMessages = useUpdateMessages(activeChat?.id ?? null);
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
    updateMessages([...messages, userMsg]);
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
          updateMessages([...messages, userMsg, aiMsg]);
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
          updateMessages([...messages, userMsg, aiMsg]);
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

        <div className="flex items-center gap-3">
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

          <AccountMenu dark={dark} />
        </div>
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
