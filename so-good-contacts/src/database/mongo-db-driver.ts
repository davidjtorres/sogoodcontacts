import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);
let db: Db;


export const connectMongoDB = async (): Promise<Db> => {
  if (!db) {
    await client.connect();
    db = client.db(process.env.MONGODB_DATABASE!);
  }
  return db;
};

export const disconnectMongoDB = async (): Promise<void> => {
  await client.close();
};
