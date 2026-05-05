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
    const { path, collectionName = "documents" } = job.data; 
    console.log(`✅ Indexed into Qdrant (${collectionName})`);
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
          metadata: { source: path },
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
        model: "qwen3-embedding:8b",
        baseUrl: "http://localhost:11434",
      });

      // 5. Connect Qdrant
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings,
        {
          url: "http://localhost:6333",
          collectionName,
        }
      );

      // 6. Store embeddings
      await vectorStore.addDocuments(splitDocs);
      console.log(`✅ Indexed into Qdrant (${collectionName})`);

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