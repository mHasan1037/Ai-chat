import express from "express";
import upload from "../config/multer.js";
import fs from "fs";
import { Queue } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";

const queue = new Queue("file-upload-queue", {
  connection: { host: "localhost", port: 6379 },
});
const router = express.Router();

// Upload PDF endpoint
router.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    //inqueue file for processing
    await queue.add("file-ready", {
      filename: req.file.filename,
      destination: req.file.destination,
      path: req.file.path,
      collectionName: "documents"
    });

    res.json({
      message: "PDF uploaded and processed successfully",
      file: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("PDF processing error:", error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: "Failed to process PDF" });
  }
});

// Get uploaded files list
router.get("/chat", async (req, res) => {
  try {
    const userQuery = "based on my skills can you tell me how can i study or what should i know or learn to be better software engineer";
    const collectionName = req.query.collection || "documents";

    console.log("Using collection:", collectionName);

    // Embed & retrieve relevant chunks from Qdrant
    const embeddings = new OllamaEmbeddings({
      model: "qwen3-embedding:8b",
      baseUrl: "http://localhost:11434",
    });
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: "http://localhost:6333",
        collectionName,
      },
    );
    const retriever = vectorStore.asRetriever({ k: 2 });
    const docs = await retriever.invoke(userQuery);

    console.log("Docs retrieved:", docs.length);   
    console.log("Docs:", JSON.stringify(docs, null, 2));

    if (docs.length === 0) {
      return res.json({ error: "No documents found. Check collection name and embedding model." });
    }

    const context = docs
      .map((doc, i) => `[${i + 1}] ${doc.pageContent}`)
      .join("\n\n");

    const SYSTEM_PROMPT = `
      You are an assistant for answering questions about a PDF.

      Rules:
      - Use ONLY the provided context
      - If answer is not in context → say "I don't know"
      - Be concise

      Context:
      ${context}
    `;

    const llm = new ChatOllama({
      model: "qwen3:14b",
      baseUrl: "http://localhost:11434",
      temperature: 0,
    });

    const response = await llm.invoke([
      { role: "system", content: SYSTEM_PROMPT },
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

export default router;
