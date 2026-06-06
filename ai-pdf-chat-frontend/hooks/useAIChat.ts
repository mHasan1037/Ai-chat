import { ChatApiResponse } from "@/components/MainChatContainer";
import { apiRequest } from "@/lib/authClient";
import { useMutation } from "@tanstack/react-query";

type ChatWithAiInput = {
  input: string;
  chatId: string;
  referenceChatIds?: string[];
};

const chatWithAi = async ({
  input,
  chatId,
  referenceChatIds = [],
}: ChatWithAiInput): Promise<ChatApiResponse> => {
  const params = new URLSearchParams({
    query: input,
    chatId,
  });

  if (referenceChatIds.length > 0) {
    params.set("references", referenceChatIds.join(","));
  }

  return apiRequest<ChatApiResponse>(`/chat?${params.toString()}`, {
    method: "GET",
  });
};

export const useAIChat = () => {
  return useMutation({
    mutationFn: chatWithAi,
    onSuccess: (data) => {
      console.log("Chat is sent:", data);
    },
    onError: (error) => {
      console.error("Chat sent error:", error);
    },
  });
};
