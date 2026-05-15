import "./utils/polyfills.js";
import { Worker } from "bullmq";
import fs from "fs";
import dotenv from "dotenv";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";

dotenv.config();


const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    const {
      path,
      chatId,
      filename,
      originalName,
      collectionName = "documents",
    } = job.data;
    try {
      // 1. Load PDF
      const pdfBuffer = fs.readFileSync(path);
      const uint8Array = new Uint8Array(pdfBuffer);
      const pdf = await getDocument({ data: uint8Array }).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      // 2. Create Document
      const docs = [
        new Document({
          pageContent: fullText,
          metadata: {
            source: path,
            chatId,
            filename,
            originalName,
            collectionName,
          },
        }),
      ];

      // 3. Smart Chunking
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 100,
      });
      const splitDocs = await splitter.splitDocuments(docs);

      // 4. Embeddings (Direct Gemini SDK)
      const embeddings = new OllamaEmbeddings({
        model: process.env.AI_EMBEDDING_MODEL_NAME,
        baseUrl: process.env.AI_API_URL,
      });

      // 5. Connect Qdrant
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: process.env.VECTOR_URL,
          collectionName,
        }
      );

      // 6. Store embeddings
      await vectorStore.addDocuments(splitDocs);

      return { success: true };
    } catch (error) {
      console.error("❌ Worker error:", error);
      throw error;
    }
  },
  {
    concurrency: 5,
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

console.log("🚀 Worker started...");
