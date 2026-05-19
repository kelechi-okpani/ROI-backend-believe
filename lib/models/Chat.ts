import mongoose, { Schema, model, models, Document, Model } from "mongoose";

// --- TypeScript Interfaces for Type Safety ---
export interface IMessage {
  senderId: mongoose.Types.ObjectId | string;
  senderType: "USER" | "ADMIN";
  text: string;
  attachments?: string[];
  createdAt: Date;
}

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  messages: IMessage[];
  lastMessageAt: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// --- Message Subdocument Schema ---
const MessageSchema = new Schema<IMessage>({
  // Kept flexible to allow a valid User ObjectId OR an Admin fallback identifier string
  senderId: { 
    type: Schema.Types.Mixed, 
    required: [true, "Sender identification is required"] 
  },
  // Explicit flag makes frontend message styling mapping instantly clean
  senderType: { 
    type: String, 
    enum: ["USER", "ADMIN"], 
    required: true 
  },
  text: { 
    type: String, 
    required: [true, "Message text body cannot be blank"] 
  },
  attachments: [{ 
    type: String 
  }], 
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

// --- Main Chat Schema ---
const ChatSchema = new Schema<IChat>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: [true, "A target user owner must be tied to this chat instance"], 
      unique: true 
    },
    messages: [MessageSchema],
    lastMessageAt: { 
      type: Date, 
      default: Date.now 
    },
    isArchived: { 
      type: Boolean, 
      default: false 
    } 
  },
  { timestamps: true }
);

// Compiles safely for Next.js hot-reloading context
export const Chat: Model<IChat> = models.Chat || model<IChat>("Chat", ChatSchema);