export const GLOBAL_COLLECTION_NAME = "user_documents";

export const collectionNameFromChatId = (chatId) =>
  `chat_${chatId.replace(/[^a-zA-Z0-9_]/g, "_")}`;

export const serializeChat = (chat) => ({
  id: chat.id,
  title: chat.title,
  fileName: chat.fileName,
  filePath: chat.filePath,
  fileUrl: chat.fileUrl,
  cloudinaryPublicId: chat.cloudinaryPublicId,
  uploadStatus: chat.uploadStatus,
  cloudinaryStatus: chat.cloudinaryStatus,
  processingError: chat.processingError,
  cloudinaryError: chat.cloudinaryError,
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

export const systemPromptFunc = (primaryContext, referenceContext) => {
  return `
    You are a helpful assistant that answers questions based on a PDF document and conversation history.

    Answer priority (follow this order):
    1. If the answer is in the Primary PDF context — answer from there.
    2. If the Reference chat context helps fill gaps — use it to supplement.
    3. If the question is related to the PDF topic but the answer isn't in the context —
       answer from your general knowledge and clearly say:
       "This isn't covered in the PDF, but generally speaking..."
    4. If the question is completely unrelated to the PDF or conversation — politely redirect:
       "That seems outside the scope of this document. But briefly: ..."

    Rules:
    - Never contradict the PDF context with outside knowledge. PDF is the source of truth.
    - Never fabricate information — if genuinely uncertain, say so.
    - Keep answers concise unless the user asks for detail.

    --- Primary PDF Context ---
    ${primaryContext || "No primary context provided."}

    --- Reference Chat Context ---
    ${referenceContext || "No reference context provided."}
  `.trim();
};

export const normalizeEmail = (email = "") => email.trim().toLowerCase();

export const PASSWORD_MIN_LENGTH = 8;

export const publicUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  createdAt: user.createdAt,
});
