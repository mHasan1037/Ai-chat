import { ChatApiResponse } from "@/components/MainChatContainer";
import { useMutation } from "@tanstack/react-query";

type ChatWithAiInput = {
  input: string;
  collectionName: string;
  referenceCollectionNames?: string[];
};

const chatWithAi = async ({
  input,
  collectionName,
  referenceCollectionNames = [],
}: ChatWithAiInput): Promise<ChatApiResponse> => {
  const params = new URLSearchParams({
    query: input,
    collection: collectionName,
  });

  if (referenceCollectionNames.length > 0) {
    params.set("references", referenceCollectionNames.join(","));
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?${params.toString()}`,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
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
