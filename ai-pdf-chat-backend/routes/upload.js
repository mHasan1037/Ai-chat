import express from "express";
import upload from "../config/multer.js";
import fs from "fs";
import { Queue } from "bullmq";
import { QdrantVectorStore } from "@langchain/qdrant";
import { GeminiEmbeddings } from "../utils/GeminiEmbeddings.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    console.log("File uploaded:", req.file.filename);

    //inqueue file for processing
    await queue.add("file-ready", {
      filename: req.file.filename,
      destination: req.file.destination,
      path: req.file.path,
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
    const userQuery = "What is my experience.";
    const collectionName = req.query.collection || "documents";

    // Embed & retrieve relevant chunks from Qdrant
    const embeddings = new GeminiEmbeddings(process.env.GEMINI_API_KEY);
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: "http://localhost:6333",
        collectionName,
      },
    );
    const retriever = vectorStore.asRetriever({
      k: 2,
    });
    const result = await retriever.invoke(userQuery);

    const context = result
      .map((doc, i) => `[${i + 1}] ${doc.pageContent}`)
      .join("\n\n");

    const SYSTEM_PROMPT = `You are an assistant for answering questions about the content of a PDF document. Use only the following retrieved information to answer the question. If you don't know the answer, say you don't know. Always use all available information. Always be concise.
    context: ${JSON.stringify(result)}
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I will answer using only the provided context." }],
        },
      ],
    });

    const geminiResponse = await chat.sendMessage(userQuery);
    const answer = geminiResponse.response.text();

    return res.json({
      query: userQuery,
      answer,
      sources: result.map((doc) => ({
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
