import type { ChatSession } from "@/components/ChatHistory";
import type { ChatMessage } from "@/components/MainChatContainer";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChatMessagesInfiniteData,
  requestJson,
  StoredChatsResponse,
} from "./useHomeChat";

export const useUpdateMessages = (activeChat: ChatSession | null) => {
  const queryClient = useQueryClient();
  const activeChatId = activeChat?.id ?? null;

  return ( updater:
      | ChatMessage[]
      | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (!activeChatId) return;

    const now = new Date().toISOString();

    const previous = queryClient.getQueryData<ChatMessagesInfiniteData>(["messages", activeChatId]);
    const previousMessages = previous?.pages.flatMap((page) => page.messages) ?? [];

    const nextMessages =
      typeof updater === "function" 
        ? (updater as (prev: ChatMessage[]) => ChatMessage[])(previousMessages) 
        : updater;

    queryClient.setQueryData<StoredChatsResponse>(["chats"], (prev) => {
      if (!prev) return prev;
      return {
        chats: prev.chats.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, updatedAt: now, messageCount: nextMessages.length }
            : chat,
        ),
      };
    });

    queryClient.setQueryData<ChatMessagesInfiniteData>(["messages", activeChatId], (prev) =>{
      if (!prev) return {
        pages: [{ messages: nextMessages, hasMore: false, nextCursor: null }],
        pageParams: [null],
      };

      return {
        ...prev,
       pages: [
          ...prev.pages.slice(0, -1),
          { ...prev.pages[prev.pages.length - 1], messages: nextMessages },
        ],
      };  
    });

    void requestJson(`/chats/${activeChatId}/messages`, {
      method: "PUT",
      body: JSON.stringify({
        ...activeChat,
        messages: nextMessages,
        updatedAt: now,
      }),
    }).catch((error) => {
      console.error("Could not update messages for chat:", error);
    });
  };
};
