import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Chat } from "@/lib/models/Chat";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();
    const { text, attachments, receiverId } = await req.json();

    if (!text?.trim() && (!attachments || attachments.length === 0)) {
      return corsResponse({ error: "Cannot send an empty message" }, 400, req);
    }

    const isAdmin = session.user.role === "ADMIN";
    const threadOwnerId = isAdmin ? receiverId : session.user.id;

    if (!threadOwnerId) {
      return corsResponse({ error: "Target User ID is required" }, 400, req);
    }

    // FIXED: Maps structural type changes matching standard layout parameters cleanly
    const newMessage = {
      senderId: session.user.id,
      senderType: isAdmin ? "ADMIN" : "USER",
      text: text?.trim() || "",
      attachments: attachments || [],
      createdAt: new Date(),
    };

    const updatedChat = await Chat.findOneAndUpdate(
      { userId: threadOwnerId },
      { 
        $push: { messages: newMessage },
        $set: { lastMessageAt: new Date() }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate("userId", "firstName lastName email role");

    return corsResponse(updatedChat, 201, req);
  } catch (error: any) {
    console.error("SEND_MESSAGE_ERROR:", error);
    return corsResponse({ error: "Failed to send message" }, 500, req);
  }
}