import type { ChatSession } from "@/components/ChatHistory";
import type { ChatMessage } from "@/components/MainChatContainer";
import { useQueryClient } from "@tanstack/react-query";
import { requestJson, StoredChatsResponse } from "./useHomeChat";

export const useUpdateMessages = (activeChat: ChatSession | null) => {
  const queryClient = useQueryClient();
  const activeChatId = activeChat?.id ?? null;

  return (messages: ChatMessage[]) => {
    if (!activeChatId) return;

    const now = new Date().toISOString();

    queryClient.setQueryData<StoredChatsResponse>(["chats"], (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        chats: prev.chats.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, updatedAt: now, messageCount: messages.length }
            : chat,
        ),
        messagesByChat: { ...prev.messagesByChat, [activeChatId]: messages },
      };
    });

    void requestJson(`/chats/${activeChatId}/messages`, {
      method: "PUT",
      body: JSON.stringify({
        ...activeChat,
        messages,
        updatedAt: now,
      }),
    }).catch((error) => {
      console.error("Could not update messages for chat:", error);
    });
  };
};
