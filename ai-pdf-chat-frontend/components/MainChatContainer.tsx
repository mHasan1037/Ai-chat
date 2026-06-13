import React, { useEffect, useLayoutEffect, useRef } from "react";
import ChatInput from "./ChatInput";
import AllChats from "./AllChats";
import { useAIChat } from "../hooks/useAIChat";
import type { ChatSession } from "./ChatHistory";
import { useUpdateMessages } from "@/hooks/useUpdateMessage";
import MainChatHeader from "./MainChatHeader";

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
  referenceChatIds: string[];
  isMessagesLoading: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

const MainChatContainer = ({
  activeChat,
  messages,
  referenceChatIds,
  isMessagesLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeight = useRef<number>(0);
  const isFetchingMoreRef = useRef(false);
  const isInitialLoad = useRef(true);
  const updateMessages = useUpdateMessages(activeChat);
  const chatWithAiMutation = useAIChat();

  useEffect(() => {
    isInitialLoad.current = true;
    isFetchingMoreRef.current = false;
  }, [activeChat?.id]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (isInitialLoad.current && messages.length > 0) {
      container.scrollTop = container.scrollHeight;
      isInitialLoad.current = false;
    }
  }, [activeChat?.id, messages.length]);

  useLayoutEffect(()=>{
    const container = scrollRef.current;
    if (!container || !isFetchingMoreRef.current) return;

    const newScrollHeight = container.scrollHeight;
    const scrollDiff = newScrollHeight - prevScrollHeight.current;
    if (scrollDiff > 0) {
      container.scrollTop += scrollDiff;
    }
    isFetchingMoreRef.current = false;
  }, [messages.length])

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isInitialLoad.current) return;
      if (!hasNextPage) return;
      if (isFetchingMoreRef.current) return;
      if(isFetchingNextPage) return;

      if (container.scrollTop < 100) {
        isFetchingMoreRef.current = true;
        prevScrollHeight.current = container.scrollHeight;
        fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    setTimeout(() => {
      const newHeight = container.scrollHeight;
      const diff = newHeight - prevScrollHeight.current;
      if (diff > 0 && isFetchingMoreRef.current) {
        container.scrollTop += diff;
        isFetchingMoreRef.current = false;
      }
    }, 0);
  }, [messages.length, isFetchingNextPage]);

  const handleUserChatInput = (chat: string) => {
    if (!activeChat) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: chat,
    };

    updateMessages((prev) => [...prev, userMsg]);

    chatWithAiMutation.mutate(
      {
        input: chat,
        chatId: activeChat.id,
        referenceChatIds,
      },
      {
        onSuccess: (data) => {
          const aiMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.answer,
            sources: data.sources,
          };
          updateMessages((prev) => [...prev, aiMsg]);
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
          updateMessages((prev) => [...prev, aiMsg]);
        },
      },
    );
  };

  if (isMessagesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <MainChatHeader activeChat={activeChat} />

      <div className="flex-1 overflow-hidden">
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-2">
            <p className="text-gray-500 text-sm">Loading more messages...</p>
          </div>
        )}
        <AllChats
          messages={messages}
          isLoading={chatWithAiMutation.isPending}
          scrollRef={scrollRef}
        />
      </div>

      <ChatInput chatInput={handleUserChatInput} disabled={!activeChat} />
    </div>
  );
};

export default MainChatContainer;
