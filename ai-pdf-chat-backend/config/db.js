import { MongoClient } from "mongodb";

let client;
let db;

export const getDb = async () => {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing.");
  }

  client = client || new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB_NAME || "ai_pdf_chat");
  return db;
};

export const getChatsCollection = async () => {
  const database = await getDb();
  return database.collection("chats");
};

export const getMessagesCollection = async () =>{
  const db = await getDb();
  const col = db.collection("chat_messages");

  await col.createIndex({ chatId: 1, createdAt: -1 }, { background: true });
  await col.createIndex({userId: 1}, {background: true});

  return col;
}

export const getUsersCollection = async () => {
  const database = await getDb();
  const collection = database.collection("users");
  await collection.createIndex({ email: 1 }, { unique: true });
  return collection;
};
