import { ChatApiResponse } from "@/components/MainChatContainer";
import { useMutation } from "@tanstack/react-query";

const chatWithAi = async (input: string): Promise<ChatApiResponse> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?query=${encodeURIComponent(input)}&collection=documents`,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();;
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
