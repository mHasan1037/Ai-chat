import { useEffect, useMemo, useState } from "react";
import { ChatMessage } from "@/components/MainChatContainer";
import { ChatSession } from "@/components/ChatHistory";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type MessagesByChat = Record<string, ChatMessage[]>;
type StoredChatsResponse = {
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

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
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
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<MessagesByChat>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

  // Fetching chat data on mount
  useEffect(() => {
    let cancelled = false;

    const loadChats = async () => {
      try {
        const data = await requestJson<StoredChatsResponse>("/chats");
        if (cancelled) return;

        setChats(data.chats);
        setMessagesByChat(data.messagesByChat ?? {});
        setActiveChatId(data.chats[0]?.id ?? null);
      } catch (error) {
        console.error("Could not load cloud chat history:", error);
      }
    };

    loadChats();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const updateActiveMessages = (messages: ChatMessage[]) => {
    if (!activeChatId) return;
    const now = new Date().toISOString();
    setMessagesByChat((prev) => ({ ...prev, [activeChatId]: messages }));
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, updatedAt: now, messageCount: messages.length }
          : chat,
      ),
    );

    void requestJson(`/chats/${activeChatId}/messages`, {
      method: "PUT",
      body: JSON.stringify({ messages, updatedAt: now }),
    }).catch((error) => {
      console.error("Could not save cloud chat messages:", error);
    });
  };

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
    setChats((prev) => [chat, ...prev]);
    setMessagesByChat((prev) => ({ ...prev, [chatId]: [] }));
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
    setChats((prev) =>
      prev.map((chat) =>
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
    );

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
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    setMessagesByChat((prev) => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
    setActiveChatId((current) =>
      current === chatId ? (chats[0]?.id ?? null) : current,
    );
  };

  const handleDeleteChat = async (chat: ChatSession) => {
    const confirmed = window.confirm(
      `Delete "${chat.title}" and its chat history?`,
    );
    if (!confirmed) return;

    setDeletingChatId(chat.id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/chats/${chat.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            collectionName: chat.collectionName,
            filePath: chat.filePath,
            cloudinaryPublicId: chat.cloudinaryPublicId,
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`);
      }
      setChats((prev) => prev.filter((item) => item.id !== chat.id));
      setMessagesByChat((prev) => {
        const next = { ...prev };
        delete next[chat.id];
        return next;
      });
      setActiveChatId((current) =>
        current === chat.id
          ? (chats.find((item) => item.id !== chat.id)?.id ?? null)
          : current,
      );
    } catch (error) {
      console.error("Chat delete error:", error);
      window.alert("Could not delete this chat from the backend yet.");
    } finally {
      setDeletingChatId(null);
    }
  };

  return {
    chats,
    activeChat,
    activeMessages,
    activeChatId,
    deletingChatId,
    referenceCollectionNames,
    setActiveChatId,
    updateActiveMessages,
    handleUploadStart,
    handleUploadSuccess,
    handleUploadError,
    handleDeleteChat,
  };
}
