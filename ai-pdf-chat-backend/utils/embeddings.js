import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";
import { Queue } from "bullmq";

export const getEmbeddings = () =>
  new OllamaEmbeddings({
    model: process.env.AI_EMBEDDING_MODEL_NAME,
    baseUrl: process.env.AI_API_URL,
  });

export const llm = new ChatOllama({
  model: process.env.AI_RESPONSE_MODEL_NAME,
  baseUrl: process.env.AI_API_URL,
  temperature: 0,
});

export const queue = new Queue("file-upload-queue", {
  connection: { host: "localhost", port: 6379 },
});
