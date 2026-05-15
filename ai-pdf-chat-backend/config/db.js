import { MongoClient } from "mongodb";

let client;
let db;

export const getDb = async () => {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("<db_password>")) {
    throw new Error("MONGODB_URI is not configured. Replace <db_password> in .env.");
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
