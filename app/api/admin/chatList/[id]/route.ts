import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Chat } from "@/lib/models/Chat";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

// ⚡️ Next.js 15 standard requires route parameters to be wrapped in a Promise
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * 📋 GET: Open Full User Chat Thread for Admin
 * Aligns perfectly with: getAdminSingleChat
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth(req);
    if (session?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden: Administrative access required" }, 403, req);
    }

    // ⚡️ Await the params Promise before reading the dynamic identifier keys
    const { id } = await params;
    if (!id) return corsResponse({ error: "Missing chat instance tracker ID" }, 400, req);

    await connectDB();

    const chatThread = await Chat.findById(id)
      .populate("userId", "firstName lastName email")
      .lean();

    if (!chatThread) {
      return corsResponse({ error: "Chat thread instance not found" }, 404, req);
    }

    return corsResponse(chatThread, 200, req);
  } catch (error: any) {
    console.error("ADMIN_SINGLE_CHAT_GET_ERROR:", error);
    return corsResponse({ error: error.message || "Failed to fetch chat details" }, 500, req);
  }
}

/**
 * 🚀 POST: Admin sends a reply message into a user thread
 * Aligns perfectly with: sendAdminReply
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth(req);
    if (session?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden: Administrative access required" }, 403, req);
    }

    // ⚡️ Await the params Promise here as well
    const { id } = await params;
    const body = await req.json();
    const { messageText, attachments } = body; // Destructured to capture exact RTK payload parameters

    if (!id) return corsResponse({ error: "Missing chat target context ID" }, 400, req);
    if (!messageText?.trim() && (!attachments || attachments.length === 0)) {
      return corsResponse({ error: "Cannot dispatch an empty structural message payload" }, 400, req);
    }

    await connectDB();

    // Map internal key strings directly into standard schema design expectations
    const adminMessageObj = {
      senderId: session?.id,
      senderType: "ADMIN",
      text: messageText?.trim() || "",
      attachments: attachments || [],
      createdAt: new Date()
    };

    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      {
        $push: { messages: adminMessageObj },
        $set: { lastMessageAt: new Date() }
      },
      { new: true } // Immediately yields updated matrix back out
    )
    .populate("userId", "firstName lastName email")
    .lean();

    if (!updatedChat) {
      return corsResponse({ error: "Target active chat conversation node was not found" }, 404, req);
    }

    // Returns the full AdminChatThread document matching your RTK Slice expectations
    return corsResponse(updatedChat, 200, req);
  } catch (error: any) {
    console.error("ADMIN_CHAT_REPLY_CRASH:", error);
    return corsResponse({ error: error.message || "Internal network failure" }, 500, req);
  }
}