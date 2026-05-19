import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { token, password } = await req.json();

    if (!token || !password) {
        return corsResponse({ error: "Token and password are required" }, 400, req);
    }

    // 1. Hash the incoming token to match what's in the DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Find user with valid token and check expiry
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return corsResponse({ error: "Invalid or expired token" }, 400, req);
    }

    // 3. Hash new password and clear token fields
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    return corsResponse({ message: "Password reset successful" }, 200, req);

  } catch (error) {
    console.error("RESET_PASSWORD_ERROR:", error);
    return corsResponse({ error: "Internal Server Error" }, 500, req);
  }
}