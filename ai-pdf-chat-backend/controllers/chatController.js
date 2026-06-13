import path from "path";
import fs from "fs";
import { ObjectId } from "mongodb";
import { getChatsCollection, getMessagesCollection } from "../config/db.js";
import {
  GLOBAL_COLLECTION_NAME,
  normalizeMessages,
  serializeChat,
  systemPromptFunc,
} from "../utils/helpers.js";
import { deletePdfFromCloudinary } from "../config/cloudinary.js";
import { QdrantClient } from "@qdrant/js-client-rest";
import { QdrantVectorStore } from "@langchain/qdrant";
import crypto from "crypto";
import { getEmbeddings, llm, pdfEmbeddingQueue } from "../utils/embeddings.js";

const buildDocumentFilter = ({ chatId, userId } = {}) => {
  const must = [];

  if (chatId) {
    must.push({
      key: "metadata.chatId",
      match: { value: chatId },
    });
  }

  if (userId) {
    must.push({
      key: "metadata.userId",
      match: { value: userId },
    });
  }

  return must.length > 0 ? { must } : undefined;
};

const queryValueToString = (value) => {
  if (Array.isArray(value)) return value[0] || "";
  return typeof value === "string" ? value : "";
};

const getRelevantDocs = async (
  embeddings,
  collectionName,
  query,
  k,
  filterOptions = {},
) => {
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.VECTOR_URL,
      collectionName,
    },
  );
  const filter = buildDocumentFilter(filterOptions);
  const retriever = vectorStore.asRetriever({ k, filter });
  // Use the retriever's document retrieval API to get matching documents
  // `getRelevantDocuments` returns an array of `Document` objects.
  if (typeof retriever.getRelevantDocuments === "function") {
    return retriever.getRelevantDocuments(query);
  }

  // Fallback for retrievers that implement `retrieve`.
  if (typeof retriever.retrieve === "function") {
    return retriever.retrieve(query);
  }

  // As a last resort, attempt invoke and ensure we return an array
  try {
    const invoked = await retriever.invoke?.(query);
    return Array.isArray(invoked) ? invoked : [];
  } catch (e) {
    console.error("Retriever invocation failed:", e);
    return [];
  }
};

export const getChats = async (_req, res) => {
  try {
    const collection = await getChatsCollection();
    const storedChats = await collection
      .find({ userId: _req.user.id })
      .sort({ updatedAt: -1 })
      .toArray();

    return res.json({
      chats: storedChats.map(serializeChat)
    });
  } catch (error) {
    console.error("Load chats error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const chatsCollection = await getChatsCollection();
    const chat = await chatsCollection.findOne(
      { id: req.params.chatId, userId: req.user.id },
    );
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    };

    const limit = Math.min(parseInt(req.query.limit ?? "20", 10), 100);
    // changing skip to cursor
    //const skip = parseInt(req.query.skip ?? "0", 10);
    const cursor = req.query.cursor;

    const messagesCollection = await getMessagesCollection();

    const query = { chatId: req.params.chatId };
    if (cursor) {
      query._id = { $lt: new ObjectId(cursor) };
    };

    const messages = await messagesCollection
      .find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = messages.length > limit;
    const pageMessages = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor =
      hasMore 
        ? pageMessages[pageMessages.length - 1]._id.toString()
        : null;

    const shaped = pageMessages.reverse().map((message) => ({
       ...message,
       id: message.id,
    }));
    console.log('nextCursor:', nextCursor);
    return res.json({
      messages: normalizeMessages(shaped),
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("Get chat messages error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const createChat = async (req, res) => {
  try {
    const now = new Date().toISOString();
    const chatId = req.body.id || crypto.randomUUID();

    const chatsCollection = await getChatsCollection();
    const result = await chatsCollection.findOneAndUpdate(
      { id: chatId, userId: req.user.id },
      {
        $setOnInsert: {
          userId: req.user.id,
          id: chatId,
          createdAt: req.body.createdAt || now,
        },
        $set: {
          title: req.body.title || "PDF Chat",
          fileName: req.body.fileName || "Document.pdf",
          filePath: req.body.filePath,
          collectionName: GLOBAL_COLLECTION_NAME,
          updatedAt: req.body.updatedAt || now,
          ...(req.body.fileUrl != null ? { fileUrl: req.body.fileUrl } : {}),
          ...(req.body.cloudinaryPublicId != null
            ? { cloudinaryPublicId: req.body.cloudinaryPublicId }
            : {}),
        },
      },
      { upsert: true, returnDocument: "after" },
    );


    const incomingMessages = normalizeMessages(req.body.messages ?? []);
    if (incomingMessages.length > 0) {
      await _upsertMessages(chatId, req.user.id, incomingMessages);
    }

    const messageCount = await _syncMessageCount(
      chatsCollection, chatId, req.user.id,
    );

    return res.status(201).json({ chat: serializeChat({ ...result, messageCount }) });
  } catch (error) {
    console.error("Create chat error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateChat = async (req, res) => {
  try {
    const allowedUpdates = [
      "title",
      "fileName",
      "filePath",
      "fileUrl",
      "cloudinaryPublicId",
      "uploadStatus",
      "cloudinaryStatus",
      "updatedAt",
      "messageCount",
    ];
    const updates = allowedUpdates.reduce((acc, key) => {
      if (req.body[key] !== undefined) acc[key] = req.body[key];
      return acc;
    }, {});

    const collection = await getChatsCollection();
    const result = await collection.findOneAndUpdate(
      { id: req.params.chatId, userId: req.user.id },
      { $set: updates },
      { returnDocument: "after" },
    );

    if (!result) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.json({ chat: serializeChat(result) });
  } catch (error) {
    console.error("Update chat error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const saveMessages = async (req, res) => {
  try {
    const messages = normalizeMessages(req.body.messages);
    const now = new Date().toISOString();
    const chatId   = req.params.chatId;
    const userId = req.user.id;

    const chatsCollection  = await getChatsCollection();
    await chatsCollection.findOneAndUpdate(
      { id: chatId, userId: userId },
      {
        $setOnInsert: {
          id: chatId,
          userId: userId,
          title: req.body.title || "PDF Chat",
          fileName: req.body.fileName || "Document.pdf",
          filePath: req.body.filePath,
          fileUrl: req.body.fileUrl,
          cloudinaryPublicId: req.body.cloudinaryPublicId,
          collectionName: GLOBAL_COLLECTION_NAME,
          createdAt: req.body.createdAt || now,
        },
        $set: {
          updatedAt: req.body.updatedAt || now,
        },
      },
      { upsert: true },
    );

    await _upsertMessages(chatId, userId, messages);
    const messageCount = await _syncMessageCount(chatsCollection, chatId, userId);

    const chat = await chatsCollection.findOne({ id: chatId, userId: userId });

    return res.json({
      chat: serializeChat({ ...chat, messageCount }),
      messages,
    });
  } catch (error) {
    console.error("Save chat messages error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const chatId = req.body.chatId || crypto.randomUUID();
    const collectionName = GLOBAL_COLLECTION_NAME;
    const job = await pdfEmbeddingQueue.add("file-ready", {
      chatId,
      userId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
      collectionName,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    res.json({
      message: "PDF uploaded and queued for processing",
      chatId,
      collectionName,
      jobId: job.id,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        url: null,
        cloudinaryPublicId: null,
        uploadStatus: "queued",
        cloudinaryStatus: "queued",
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("PDF processing error:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to process PDF" });
  }
};

export const chatWithPdf = async (req, res) => {
  try {
    const userQuery = queryValueToString(req.query.query).trim();
    const currentChatId = queryValueToString(req.query.chatId).trim();
    const referenceChatIds = queryValueToString(req.query.references)
      .split(",")
      .map((chatId) => chatId.trim())
      .filter(Boolean)
      .slice(0, 3);

      console.log('referenceChatIds:', referenceChatIds);

    if (!userQuery) {
      return res.status(400).json({ error: "Missing query" });
    }

    if (!currentChatId) {
      return res.status(400).json({ error: "Missing chatId" });
    }

    const embeddings = getEmbeddings();
    const primaryDocs = await getRelevantDocs(
      embeddings,
      GLOBAL_COLLECTION_NAME,
      userQuery,
      4,
      { chatId: currentChatId, userId: req.user.id },
    );

    const referenceDocGroups = await Promise.all(
      referenceChatIds.map(async (referenceChatId) => {
        const docs = await getRelevantDocs(
          embeddings,
          GLOBAL_COLLECTION_NAME,
          userQuery,
          1,
          { chatId: referenceChatId, userId: req.user.id },
        );

        return docs.map((doc) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            referencedChatId: referenceChatId,
          },
        }));
      }),
    );

    const referenceDocs = referenceDocGroups.flat();
    const docs = [...primaryDocs, ...referenceDocs];

    if (docs.length === 0) {
      return res.status(404).json({
        error:
          "No documents found. Check chatId, user access, and embedding model.",
      });
    }

    const primaryContext = primaryDocs
      .map((doc, i) => `[Primary ${i + 1}] ${doc.pageContent}`)
      .join("\n\n");

    const referenceContext = referenceDocs
      .map((doc, i) => `[Reference ${i + 1}] ${doc.pageContent}`)
      .join("\n\n");

    const systemPrompt = systemPromptFunc(primaryContext, referenceContext);

    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userQuery },
    ]);

    return res.json({
      query: userQuery,
      answer: response.content,
      sources: docs.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      })),
    });
  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const collectionName = GLOBAL_COLLECTION_NAME;
    const chatsCollection = await getChatsCollection();
    const storedChat = await chatsCollection.findOne({ id: req.params.chatId });
    if (!storedChat || storedChat.userId !== req.user.id) {
      return res.status(404).json({ error: "Chat not found" });
    }
    const qdrantClient = new QdrantClient({ url: process.env.VECTOR_URL });

    const collectionExists =
      await qdrantClient.collectionExists(collectionName);
    if (collectionExists.exists) {
      await qdrantClient.delete(collectionName, {
        filter: buildDocumentFilter({
          chatId: req.params.chatId,
          userId: req.user.id,
        }),
      });
    }

    if (req.body.filePath) {
      const uploadsDir = path.resolve("uploads");
      const resolvedFilePath = path.resolve(req.body.filePath);

      if (
        resolvedFilePath.startsWith(uploadsDir) &&
        fs.existsSync(resolvedFilePath)
      ) {
        fs.unlinkSync(resolvedFilePath);
      }
    }

    await deletePdfFromCloudinary(
      req.body.cloudinaryPublicId || storedChat?.cloudinaryPublicId,
    );

    const messagesCollection = await getMessagesCollection();
    await messagesCollection.deleteMany({
      chatId: req.params.chatId,
      userId: req.user.id,
    });
    await chatsCollection.deleteOne({
      id: req.params.chatId,
      userId: req.user.id,
    });

    return res.json({
      message: "Chat, uploaded PDF, cloud file, and document vectors deleted",
      collectionName,
    });
  } catch (error) {
    console.error("Delete chat error:", error);
    return res.status(500).json({ error: error.message });
  }
};

async function _upsertMessages(chatId, userId, messages) {
  if (messages.length === 0) return;
  const messagesCollection = await getMessagesCollection();

  const bulkOps = messages.map((message) => {
    const messageId = message.id || crypto.randomUUID();
    return {
      updateOne: {
        filter: { id: messageId, chatId, userId },
        update: {
          $setOnInsert: {
            id: messageId,
            chatId,
            userId,
            createdAt: message.createdAt || new Date().toISOString(),
          },
          $set: {
            role: message.role,
            content: message.content,
            updatedAt: new Date().toISOString()
          },
        },
        upsert: true,
      },
    };
  });

  await messagesCollection.bulkWrite(bulkOps, { ordered: false });
}

async function _syncMessageCount(chatsCollection, chatId, userId) {
  const messagesCollection = await getMessagesCollection();
  const messageCount = await messagesCollection.countDocuments({ chatId, userId });
  await chatsCollection.updateOne(
    { id: chatId, userId },
    { $set: { messageCount } },
  );
  return messageCount;
}
