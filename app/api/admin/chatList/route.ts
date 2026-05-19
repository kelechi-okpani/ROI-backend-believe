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
        // 1. Admin Authorization Check
        const session = await auth(req);
        if (session?.role !== "ADMIN") {
            return corsResponse({ error: "Forbidden" }, 403, req);
        }

        await connectDB();

        /**
         * 2. Fetch Chat List
         * We populate user details and sort by the most recent activity.
         * Using .lean() here makes the query faster for read-only lists.
         */
        const chats = await Chat.find({})
            .populate("userId", "firstName lastName email")
            .select("-messages") // Exclude full history to keep the payload light
            .sort({ lastMessageAt: -1 })
            .lean();

        // 3. Success Response
        return corsResponse(chats, 200, req);

    } catch (error) {
        console.error("ADMIN_INBOX_ERROR:", error);
        return corsResponse({ error: "Failed to fetch inbox" }, 500, req);
    }
}