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

export const getUsersCollection = async () => {
  const database = await getDb();
  const collection = database.collection("users");
  await collection.createIndex({ email: 1 }, { unique: true });
  return collection;
};
