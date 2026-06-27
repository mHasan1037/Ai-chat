import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { getEmbeddings, llm } from "./embeddings.js";
import { buildDocumentFilter, GLOBAL_COLLECTION_NAME } from "./helpers.js";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { QdrantVectorStore } from "@langchain/qdrant";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

//createHistoryAwareRetriever 

const condensePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Given a chat history and the latest user question, reformulate the question
     into a standalone question that can be understood without the chat history.
     Do NOT answer the question — only reformulate it if needed, otherwise return it as-is.`,
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);


export async function buildHistoryAwareRetriever(userId, chatId, topK = 4) {
    const embeddings = getEmbeddings();

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url : process.env.VECTOR_URL,
        collectionName: GLOBAL_COLLECTION_NAME
    });

    const baseRetriever = vectorStore.asRetriever({
        k: topK,
        filter: buildDocumentFilter({ userId, chatId })
    });

    return RunnableSequence.from([
        async (input) =>{
            if(!input.chat_history || input.chat_history.length === 0){
                return input.input;
            };
            const chain = condensePrompt.pipe(llm).pipe(new StringOutputParser());
            return chain.invoke({input: input.input, chat_history: input.chat_history})
        },
        baseRetriever
    ]);
};

export function toMessageObjects(history){
    return history.map((m) =>
       m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
    )
}