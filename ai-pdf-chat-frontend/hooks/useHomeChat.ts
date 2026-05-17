import { useEffect, useMemo, useState } from "react";
import { ChatMessage } from "@/components/MainChatContainer";
import { ChatSession } from "@/components/ChatHistory";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type MessagesByChat = Record<string, ChatMessage[]>;
export type StoredChatsResponse = {
  chats: ChatSession[];
  messagesByChat: MessagesByChat;
};

type FileUploadProps = {
  chatId: string;
  collectionName: string;
  file: File;
  uploadedFile?: {
    filename: string;
    path: string;
    url?: string;
    cloudinaryPublicId?: string;
    size: number;
    mimetype: string;
  };
};

const createCollectionName = (chatId: string) =>
  `chat_${chatId.replace(/[^a-zA-Z0-9_]/g, "_")}`;

const createChatTitle = (fileName: string) =>
  fileName
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .trim() || "PDF Chat";

export const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
};

export function useHomeChat() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["chats"],
    queryFn: () => requestJson<StoredChatsResponse>("/chats"),
    staleTime: 1000 * 60 * 5,
  });
  const chats = data?.chats ?? [];
  const messagesByChat = data?.messagesByChat ?? {};
  const [activeChatId, setActiveChatId] = useState<string | null>(()=> null);
  

  // Fetching chat data 
  useEffect(() => {
    if(chats.length > 0 && activeChatId === null) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [activeChatId, chats],
  );

  const activeMessages = activeChatId
    ? (messagesByChat[activeChatId] ?? [])
    : [];

  const referenceCollectionNames = useMemo(
    () =>
      chats
        .filter((chat) => chat.id !== activeChatId)
        .slice(0, 3)
        .map((chat) => chat.collectionName),
    [activeChatId, chats],
  );

  const handleUploadStart = (file: File) => {
    const now = new Date().toISOString();
    const chatId = crypto.randomUUID();
    const collectionName = createCollectionName(chatId);
    const chat: ChatSession = {
      id: chatId,
      title: createChatTitle(file.name),
      fileName: file.name,
      collectionName,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };
    
    queryClient.setQueryData<StoredChatsResponse>(["chats"], (prev) => ({
      chats: [chat, ...( prev?.chats ?? [])],
      messagesByChat: { ...(prev?.messagesByChat ?? {}), [chatId]: [] },
    }));

    setActiveChatId(chatId);

    void requestJson("/chats", {
      method: "POST",
      body: JSON.stringify({ ...chat, messages: [] }),
    }).catch((error) => {
      console.error("Could not create cloud chat:", error);
    });

    return { chatId, collectionName };
  };

  const handleUploadSuccess = ({ chatId, uploadedFile }: FileUploadProps) => {
    if (!uploadedFile) return;
    const now = new Date().toISOString();
    
    queryClient.setQueryData<StoredChatsResponse>(["chats"], (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        chats: prev.chats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                filePath: uploadedFile.path,
                fileUrl: uploadedFile.url,
                cloudinaryPublicId: uploadedFile.cloudinaryPublicId,
                updatedAt: now,
              }
            : chat,
        ),
      };
    });
    
    void requestJson(`/chats/${chatId}`, {
      method: "PATCH",
      body: JSON.stringify({
        filePath: uploadedFile.path,
        fileUrl: uploadedFile.url,
        cloudinaryPublicId: uploadedFile.cloudinaryPublicId,
        updatedAt: now,
      }),
    }).catch((error) => {
      console.error("Could not save uploaded PDF metadata:", error);
    });
  };

  const handleUploadError = (chatId: string) => {
    queryClient.setQueryData<StoredChatsResponse>(["chats"], (prev) => {
      if (!prev) return prev;
      const nextMessages = {...prev.messagesByChat};
      delete nextMessages[chatId];

      return {
        chats: prev.chats.filter((chat) => chat.id !== chatId),
        messagesByChat: nextMessages,
      };
    });
    setActiveChatId((current) =>
      current === chatId ? (chats[0]?.id ?? null) : current,
    );
  };

  const deleteChatMutation = useMutation({
    mutationFn: (chat: ChatSession) => {
      return requestJson(`/chats/${chat.id}`, { 
        method: "DELETE",
        body: JSON.stringify({ 
          collectionName: chat.collectionName ,
          filePath: chat.filePath,
          cloudinaryPublicId: chat.cloudinaryPublicId,
        }), 
      });
    },
    onSuccess: (_, chat) => {
      queryClient.setQueryData<StoredChatsResponse>(["chats"], (prev) => {
        if (!prev) return prev;
        const nextChats = prev.chats.filter((item)=> item.id !== chat.id);
        const nextMessages = {...prev.messagesByChat};
        delete nextMessages[chat.id];
        return {
          chats: nextChats,
          messagesByChat: nextMessages,
        };
      });
      setActiveChatId((current) =>
        current === chat.id ? (chats.find((item) => item.id !== chat.id)?.id ?? null) : current,
      );
    },
    onError: (error) => {
      console.error("Could not delete chat:", error);
    },
  });

  const handleDeleteChat = (chat: ChatSession) => {
    const confirmed = window.confirm(
      `Delete "${chat.title}" and its chat history?`,
    );
    if (!confirmed) return;
    deleteChatMutation.mutate(chat);
  };

  return {
    chats,
    activeChat,
    activeMessages,
    activeChatId,
    deletingChatId: deleteChatMutation.isPending ? deleteChatMutation.variables?.id : null,
    referenceCollectionNames,
    setActiveChatId,
    handleUploadStart,
    handleUploadSuccess,
    handleUploadError,
    handleDeleteChat,
  };
}
