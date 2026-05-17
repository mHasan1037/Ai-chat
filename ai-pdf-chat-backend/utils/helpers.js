export const collectionNameFromChatId = (chatId) =>
  `chat_${chatId.replace(/[^a-zA-Z0-9_]/g, "_")}`;

export const serializeChat = (chat) => ({
  id: chat.id,
  title: chat.title,
  fileName: chat.fileName,
  filePath: chat.filePath,
  fileUrl: chat.fileUrl,
  cloudinaryPublicId: chat.cloudinaryPublicId,
  collectionName: chat.collectionName,
  createdAt: chat.createdAt,
  updatedAt: chat.updatedAt,
  messageCount: chat.messageCount ?? chat.messages?.length ?? 0,
});

export const normalizeMessages = (messages) =>
  Array.isArray(messages)
    ? messages.filter(
        (message) =>
          message &&
          typeof message.id === "string" &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string",
      )
    : [];

export const systemPropmptFunc = (primaryContext, referenceContext) => {
  return `
          You are an assistant for answering questions about PDF chats.
    
          Rules:
          - Use the Primary PDF context first.
          - Use Reference chat context only when it helps answer the user's question.
          - If the answer is not in any provided context, say "I don't know".
          - Be concise.
    
          Primary PDF context:
          ${primaryContext || "No primary context found."}
    
          Reference chat context:
          ${referenceContext || "No reference context provided."}
        `;
};
