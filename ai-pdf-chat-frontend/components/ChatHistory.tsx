"use client";

import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { FaRegTrashAlt } from "react-icons/fa";

export type ChatSession = {
  id: string;
  title: string;
  fileName: string;
  filePath?: string;
  fileUrl?: string;
  cloudinaryPublicId?: string;
  collectionName: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type Props = {
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chat: ChatSession) => void;
  isDeletingChatId?: string | null;
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));

const ChatHistory = ({
  chats,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  isDeletingChatId,
}: Props) => {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return (
    <section className="px-6 pb-6 flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2
            className={`text-xl font-semibold tracking-tight ${dark ? "text-white/90" : "text-gray-800"}`}
          >
            All Chats
          </h2>
        </div>
        <span
          className={`text-[11px] font-mono ${dark ? "text-white/30" : "text-gray-400"}`}
        >
          {chats.length}
        </span>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2
        [scrollbar-width:thin] [scrollbar-color:rgba(128,128,128,0.2)_transparent]"
      >
        {chats.length === 0 && (
          <div
            className={`rounded-xl border px-4 py-5 text-center text-xs font-mono
            ${dark ? "border-white/10 bg-white/5 text-white/30" : "border-black/10 bg-black/5 text-gray-400"}`}
          >
            Upload a PDF to start a saved chat.
          </div>
        )}

        {chats.map((chat) => {
          const active = chat.id === activeChatId;
          const deleting = chat.id === isDeletingChatId;

          return (
            <div
              key={chat.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectChat(chat.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectChat(chat.id);
                }
              }}
              className={`group w-full cursor-pointer rounded-xl border p-3 text-left transition-all duration-200
              ${
                active
                  ? dark
                    ? "border-amber-400/40 bg-amber-400/10"
                    : "border-amber-500/50 bg-amber-50"
                  : dark
                    ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                    : "border-black/10 bg-white/55 hover:border-black/20 hover:bg-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full
                  ${active ? "bg-amber-400 shadow-[0_0_8px_theme(colors.amber.400)]" : dark ? "bg-white/20" : "bg-gray-300"}`}
                />

                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm font-medium ${dark ? "text-white/85" : "text-gray-800"}`}
                    title={chat.title}
                  >
                    {chat.title}
                  </p>
                  <p
                    className={`mt-1 truncate text-[11px] font-mono ${dark ? "text-white/35" : "text-gray-500"}`}
                    title={chat.fileName}
                  >
                    {chat.fileName}
                  </p>
                  <div
                    className={`mt-2 flex items-center gap-2 text-[10px] font-mono
                    ${dark ? "text-white/25" : "text-gray-400"}`}
                  >
                    <span>{formatDate(chat.updatedAt)}</span>
                    <span>{chat.messageCount} msgs</span>
                  </div>
                </div>

                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteChat(chat);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      onDeleteChat(chat);
                    }
                  }}
                  aria-label={`Delete ${chat.title}`}
                  title="Delete chat and vectors"
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border opacity-70 transition-all
                  ${
                    dark
                      ? "border-white/10 text-white/45 hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-300"
                      : "border-black/10 text-gray-500 hover:border-red-400/40 hover:bg-red-50 hover:text-red-600"
                  }
                  ${deleting ? "pointer-events-none opacity-40" : "group-hover:opacity-100"}`}
                >
                  <FaRegTrashAlt className="text-xs" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ChatHistory;
