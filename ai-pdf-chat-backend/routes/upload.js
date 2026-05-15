import express from "express";
import upload from "../config/multer.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Queue } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
import { QdrantClient } from "@qdrant/js-client-rest";
import { getChatsCollection } from "../config/db.js";
import {
  deletePdfFromCloudinary,
  uploadPdfToCloudinary,
} from "../config/cloudinary.js";

const queue = new Queue("file-upload-queue", {
  connection: { host: "localhost", port: 6379 },
});
const router = express.Router();

const collectionNameFromChatId = (chatId) =>
  `chat_${chatId.replace(/[^a-zA-Z0-9_]/g, "_")}`;

const serializeChat = (chat) => ({
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

const normalizeMessages = (messages) =>
  Array.isArray(messages)
    ? messages.filter(
        (message) =>
          message &&
          typeof message.id === "string" &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string",
      )
    : [];

const getEmbeddings = () =>
  new OllamaEmbeddings({
    model: process.env.AI_EMBEDDING_MODEL_NAME,
    baseUrl: process.env.AI_API_URL,
  });

const getRelevantDocs = async (embeddings, collectionName, query, k) => {
  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.VECTOR_URL,
    collectionName,
  });
  const retriever = vectorStore.asRetriever({ k });
  return retriever.invoke(query);
};

router.get("/chats", async (_req, res) => {
  try {
    const collection = await getChatsCollection();
    const storedChats = await collection
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    const messagesByChat = storedChats.reduce((acc, chat) => {
      acc[chat.id] = normalizeMessages(chat.messages);
      return acc;
    }, {});

    return res.json({
      chats: storedChats.map(serializeChat),
      messagesByChat,
    });
  } catch (error) {
    console.error("Load chats error:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/chats", async (req, res) => {
  try {
    const now = new Date().toISOString();
    const chatId = req.body.id || crypto.randomUUID();
    const chat = {
      id: chatId,
      title: req.body.title || "PDF Chat",
      fileName: req.body.fileName || "Document.pdf",
      filePath: req.body.filePath,
      fileUrl: req.body.fileUrl,
      cloudinaryPublicId: req.body.cloudinaryPublicId,
      collectionName:
        req.body.collectionName || collectionNameFromChatId(chatId),
      createdAt: req.body.createdAt || now,
      updatedAt: req.body.updatedAt || now,
      messageCount: req.body.messageCount ?? 0,
      messages: normalizeMessages(req.body.messages),
    };

    const collection = await getChatsCollection();
    await collection.updateOne(
      { id: chat.id },
      { $setOnInsert: chat },
      { upsert: true },
    );

    return res.status(201).json({ chat: serializeChat(chat) });
  } catch (error) {
    console.error("Create chat error:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.patch("/chats/:chatId", async (req, res) => {
  try {
    const allowedUpdates = [
      "title",
      "fileName",
      "filePath",
      "fileUrl",
      "cloudinaryPublicId",
      "collectionName",
      "updatedAt",
      "messageCount",
    ];
    const updates = allowedUpdates.reduce((acc, key) => {
      if (req.body[key] !== undefined) acc[key] = req.body[key];
      return acc;
    }, {});

    const collection = await getChatsCollection();
    const result = await collection.findOneAndUpdate(
      { id: req.params.chatId },
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
});

router.put("/chats/:chatId/messages", async (req, res) => {
  try {
    const messages = normalizeMessages(req.body.messages);
    const now = new Date().toISOString();
    const collection = await getChatsCollection();
    const result = await collection.findOneAndUpdate(
      { id: req.params.chatId },
      {
        $set: {
          messages,
          messageCount: messages.length,
          updatedAt: req.body.updatedAt || now,
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      return res.status(404).json({ error: "Chat not found" });
    }

    return res.json({
      chat: serializeChat(result),
      messages,
    });
  } catch (error) {
    console.error("Save chat messages error:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const chatId = req.body.chatId || crypto.randomUUID();
    const collectionName =
      req.body.collectionName || collectionNameFromChatId(chatId);
    const cloudinaryFile = await uploadPdfToCloudinary(req.file.path, chatId);

    await queue.add("file-ready", {
      chatId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
      collectionName,
    });

    res.json({
      message: "PDF uploaded and queued for processing",
      chatId,
      collectionName,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        url: cloudinaryFile?.secure_url,
        cloudinaryPublicId: cloudinaryFile?.public_id,
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
});

router.get("/chat", async (req, res) => {
  try {
    const userQuery = (req.query.query || "").trim();
    const collectionName = req.query.collection || "documents";
    const referenceCollections = (req.query.references || "")
      .split(",")
      .map((collection) => collection.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (!userQuery) {
      return res.status(400).json({ error: "Missing query" });
    }

    const embeddings = getEmbeddings();
    const primaryDocs = await getRelevantDocs(
      embeddings,
      collectionName,
      userQuery,
      4,
    );

    const referenceDocGroups = await Promise.all(
      referenceCollections.map(async (referenceCollection) => {
        const docs = await getRelevantDocs(
          embeddings,
          referenceCollection,
          userQuery,
          1,
        );

        return docs.map((doc) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            referencedCollection: referenceCollection,
          },
        }));
      }),
    );

    const referenceDocs = referenceDocGroups.flat();
    const docs = [...primaryDocs, ...referenceDocs];

    if (docs.length === 0) {
      return res.status(404).json({
        error: "No documents found. Check collection name and embedding model.",
      });
    }

    const primaryContext = primaryDocs
      .map((doc, i) => `[Primary ${i + 1}] ${doc.pageContent}`)
      .join("\n\n");

    const referenceContext = referenceDocs
      .map((doc, i) => `[Reference ${i + 1}] ${doc.pageContent}`)
      .join("\n\n");

    const systemPrompt = `
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

    const llm = new ChatOllama({
      model: process.env.AI_RESPONSE_MODEL_NAME,
      baseUrl: process.env.AI_API_URL,
      temperature: 0,
    });

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
});

router.delete("/chats/:chatId", async (req, res) => {
  try {
    const collectionName =
      req.body.collectionName || collectionNameFromChatId(req.params.chatId);
    const chatsCollection = await getChatsCollection();
    const storedChat = await chatsCollection.findOne({ id: req.params.chatId });
    const qdrantClient = new QdrantClient({ url: process.env.VECTOR_URL });

    const collectionExists = await qdrantClient.collectionExists(collectionName);
    if (collectionExists.exists) {
      await qdrantClient.deleteCollection(collectionName);
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
    await chatsCollection.deleteOne({ id: req.params.chatId });

    return res.json({
      message: "Chat, uploaded PDF, cloud file, and vector collection deleted",
      collectionName,
    });
  } catch (error) {
    console.error("Delete chat error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
