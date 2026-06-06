import "./utils/polyfills.js";
import { Worker } from "bullmq";
import fs from "fs";
import dotenv from "dotenv";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { uploadPdfToCloudinary } from "./config/cloudinary.js";
import { getChatsCollection } from "./config/db.js";
import { getEmbeddings } from "./utils/embeddings.js";
import { GLOBAL_COLLECTION_NAME } from "./utils/helpers.js";

dotenv.config();

const nowIso = () => new Date().toISOString();

const worker = new Worker(
  "file-upload-queue",
  async (job) => {
    const {
      path,
      chatId,
      userId,
      filename,
      originalName,
      size,
      mimetype,
    } = job.data;
    const targetCollectionName = GLOBAL_COLLECTION_NAME;

    try {
      const chatsCollection = await getChatsCollection();
      const fileName = originalName || filename || "Document.pdf";

      await chatsCollection.updateOne(
        { id: chatId, userId },
        {
          $setOnInsert: {
            id: chatId,
            userId,
            title: "PDF Chat",
            createdAt: nowIso(),
            messages: [],
            messageCount: 0,
          },
          $set: {
            fileName,
            filePath: path,
            collectionName: targetCollectionName,
            fileSize: size,
            mimeType: mimetype,
            uploadStatus: "processing",
            cloudinaryStatus: "uploading",
            updatedAt: nowIso(),
          },
        },
        { upsert: true },
      );

      try {
        const cloudinaryFile = await uploadPdfToCloudinary(path, chatId);
        await chatsCollection.updateOne(
          { id: chatId, userId },
          {
            $set: {
              ...(cloudinaryFile
                ? {
                    fileUrl: cloudinaryFile.secure_url,
                    cloudinaryPublicId: cloudinaryFile.public_id,
                    cloudinaryStatus: "uploaded",
                  }
                : { cloudinaryStatus: "skipped" }),
              updatedAt: nowIso(),
            },
          },
        );
      } catch (cloudinaryError) {
        console.error("Cloudinary upload failed:", cloudinaryError);
        await chatsCollection.updateOne(
          { id: chatId, userId },
          {
            $set: {
              cloudinaryStatus: "failed",
              cloudinaryError: cloudinaryError.message,
              updatedAt: nowIso(),
            },
          },
        );
      }

      const pdfBuffer = fs.readFileSync(path);
      const uint8Array = new Uint8Array(pdfBuffer);
      const pdf = await getDocument({ data: uint8Array }).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ");
        fullText += `${pageText}\n`;
      }

      const docs = [
        new Document({
          pageContent: fullText,
          metadata: {
            source: path,
            userId,
            chatId,
            filename,
            originalName,
            collectionName: targetCollectionName,
          },
        }),
      ];

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 100,
      });
      const splitDocs = await splitter.splitDocuments(docs);
      splitDocs.forEach((doc) => {
        doc.metadata = {
          ...doc.metadata,
          chatId,
          userId,
        };
      });

      const embeddings = getEmbeddings();

      // Create collection with documents (will create if doesn't exist)
      await QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
        url: process.env.VECTOR_URL,
        collectionName: targetCollectionName,
      });

      await chatsCollection.updateOne(
        { id: chatId, userId },
        {
          $set: {
            uploadStatus: "ready",
            updatedAt: nowIso(),
          },
        },
      );

      return { success: true };
    } catch (error) {
      console.error("Worker error:", error);

      if (userId) {
        try {
          const chatsCollection = await getChatsCollection();
          await chatsCollection.updateOne(
            { id: chatId, userId },
            {
              $set: {
                uploadStatus: "failed",
                processingError: error.message,
                updatedAt: nowIso(),
              },
            },
          );
        } catch (statusError) {
          console.error("Failed to mark upload job as failed:", statusError);
        }
      }

      throw error;
    }
  },
  {
    concurrency: 5,
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
    },
  },
);

console.log("Worker started...");
