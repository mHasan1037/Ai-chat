import { GoogleGenerativeAI } from "@google/generative-ai";
import { Embeddings } from "@langchain/core/embeddings";

// Custom Gemini Embeddings (bypasses broken LangChain wrapper)
export class GeminiEmbeddings extends Embeddings {
  constructor(apiKey) {
    super({});
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: "gemini-embedding-001",
    });
  }

  async embedDocuments(texts) {
    return Promise.all(texts.map((t) => this.embedQuery(t)));
  }

  async embedQuery(text) {
    const result = await this.model.embedContent(text);
    return result.embedding.values;
  }
}