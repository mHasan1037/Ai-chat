import { getMessagesCollection } from "../config/db.js";

export const getRecentHistory = async (chatId, userId, limit = 6) => {
    const messagesCol = await getMessagesCollection();
    const recentMessages = await messagesCol
      .find({ chatId, userId })
      .sort({ _id: -1 })
      .limit(limit)
      .toArray();

    return recentMessages.reverse().map((message) => ({
        role: message.role,
        content: message.content
    }));
}