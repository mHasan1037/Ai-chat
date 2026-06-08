import path from "path";
import fs from "fs";
import { getChatsCollection } from "../config/db.js";
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
      .project({ messages: 0 })
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
    const collection = await getChatsCollection();
    const chat = await collection.findOne(
      { id: req.params.chatId, userId: req.user.id },
      { projection: { messages: 1 } },
    );
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }
    return res.json({ messages: normalizeMessages(chat.messages) });
  } catch (error) {
    console.error("Get chat messages error:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const createChat = async (req, res) => {
  try {
    const now = new Date().toISOString();
    const chatId = req.body.id || crypto.randomUUID();
    const messages = normalizeMessages(req.body.messages);
    const chat = {
      userId: req.user.id,
      id: chatId,
      title: req.body.title || "PDF Chat",
      fileName: req.body.fileName || "Document.pdf",
      filePath: req.body.filePath,
      fileUrl: req.body.fileUrl,
      cloudinaryPublicId: req.body.cloudinaryPublicId,
      collectionName: GLOBAL_COLLECTION_NAME,
      createdAt: req.body.createdAt || now,
      updatedAt: req.body.updatedAt || now,
      messageCount: req.body.messageCount ?? messages.length,
      messages,
    };

    const collection = await getChatsCollection();
    const result = await collection.findOneAndUpdate(
      { id: chat.id, userId: req.user.id },
      {
        $setOnInsert: {
          userId: req.user.id,
          id: chatId,
          createdAt: chat.createdAt,
          messages: chat.messages,
          messageCount: chat.messageCount,
        },
        $set: {
          title: chat.title,
          fileName: chat.fileName,
          filePath: chat.filePath,
          collectionName: chat.collectionName,
          updatedAt: chat.updatedAt,
          ...(chat.fileUrl != null ? { fileUrl: chat.fileUrl } : {}),
          ...(chat.cloudinaryPublicId != null
            ? { cloudinaryPublicId: chat.cloudinaryPublicId }
            : {}),
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    return res.status(201).json({ chat: serializeChat(result) });
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
    const collection = await getChatsCollection();
    const result = await collection.findOneAndUpdate(
      { id: req.params.chatId, userId: req.user.id },
      {
        $setOnInsert: {
          id: req.params.chatId,
          userId: req.user.id,
          title: req.body.title || "PDF Chat",
          fileName: req.body.fileName || "Document.pdf",
          filePath: req.body.filePath,
          fileUrl: req.body.fileUrl,
          cloudinaryPublicId: req.body.cloudinaryPublicId,
          collectionName: GLOBAL_COLLECTION_NAME,
          createdAt: req.body.createdAt || now,
        },
        $set: {
          messages,
          messageCount: messages.length,
          updatedAt: req.body.updatedAt || now,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    return res.json({
      chat: serializeChat(result),
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
