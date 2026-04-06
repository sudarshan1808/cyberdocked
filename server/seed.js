import { createRequire } from "module";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Content from "./models/Content.js";

dotenv.config();

const require = createRequire(import.meta.url);
const { contentData } = require("./data.js");

async function cleanDatabase() {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  if (collections.length === 0) {
    console.log("No existing collections found in the database.");
    return;
  }

  for (const { name } of collections) {
    await db.dropCollection(name);
    console.log(`Dropped collection ${name}`);
  }
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  // Ensure DB is clean and only required data is present.
  await cleanDatabase();

  await Content.insertMany(contentData);
  console.log(`Seeded ${contentData.length} items`);

  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
