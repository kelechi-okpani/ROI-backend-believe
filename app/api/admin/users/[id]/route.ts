import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    
    // 1. Authorization Check
    if (!session || session.user?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden" }, 403, req);
    }

    // ⚡️ FIX: Await the params Promise to extract the ID safely
    const { id } = await params;
    if (!id) {
      return corsResponse({ error: "Missing user identifier target" }, 400, req);
    }

    await connectDB();
    const body = await req.json(); // e.g., { role: "ADMIN" } or { isSuspended: true }

    // 2. Update User using the unwrapped id
    const updatedUser = await User.findByIdAndUpdate(
      id, 
      body, 
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return corsResponse({ error: "User not found" }, 404, req);
    }

    return corsResponse(updatedUser, 200, req);

  } catch (error) {
    console.error("PATCH_USER_ERROR:", error);
    return corsResponse({ error: "Update failed" }, 500, req);
  }
}