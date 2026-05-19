import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Chat } from "@/lib/models/Chat";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const adminSelectedUserId = searchParams.get("userId");

    let targetId: string;

    if (session.user.role === "ADMIN") {
      if (!adminSelectedUserId) {
        return corsResponse({ error: "User ID required for Admin view" }, 400, req);
      }
      targetId = adminSelectedUserId;
    } else {
      targetId = session.user.id;
    }

    // FIXED: Dropped old broken population query parameters targeting subdocument arrays
    const chat = await Chat.findOne({ userId: targetId })
      .populate("userId", "firstName lastName email")
      .lean();

    if (!chat) {
      return corsResponse({ messages: [] }, 200, req);
    }

    return corsResponse(chat, 200, req);
  } catch (error) {
    console.error("FETCH_CHAT_ERROR:", error);
    return corsResponse({ error: "Internal Server Error" }, 500, req);
  }
}