import mongoose from "mongoose";
import { seedAdmin } from "./seed-admin";
import { seedBackdatedUsers } from "./scripts/seedBackdatedUser";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Keep this false for better error visibility in Next.js
    };

    console.log("🚀 Attempting to connect to MongoDB...");

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("✅ MongoDB Connection Completed Successfully");
      return mongooseInstance;
    });
  }

  try {
    // 1. Wait for the promise to resolve into a connection
    cached.conn = await cached.promise;
    await seedAdmin(); 
    // await seedBackdatedUsers();

  } catch (e) {
    cached.promise = null;
    console.error("❌ MongoDB Connection Failed:", e);
    throw e;
  }

  return cached.conn;
}