import React from "react";
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
};

const MainChatContainer = ({
  activeChat,
  messages,
  referenceChatIds,
  isMessagesLoading,
}: Props) => {
  const updateMessages = useUpdateMessages(activeChat);
  const chatWithAiMutation = useAIChat();

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

  if(isMessagesLoading) {
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
