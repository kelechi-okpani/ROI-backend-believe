

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";


// Force Dynamic behavior to prevent Next.js from caching the GET request as a static page
export const dynamic = "force-dynamic";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  try {
    // 1. Session Check
    const session = await auth(req);

    if (!session?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();

    // 2. Fetch User (Using .lean() for performance)
    const user = await User.findById(session?.id)
      .select("-password -resetPasswordToken -resetPasswordExpires -verificationOtp -verificationOtpExpires")
      .lean();
    
    if (!user) {
      return corsResponse({ error: "User not found in database" }, 404, req);
    }

    return corsResponse(user, 200, req);
  } catch (error) {
    console.error("GET_PROFILE_ERROR:", error);
    return corsResponse({ error: "Internal Server Error" }, 500, req);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth(req);
        // const session = await getAuthUser(req);
    if (!session?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();
    const body = await req.json();

    // 1. Filter allowed fields only
    const { firstName, lastName, phoneNumber, country } = body;
    const updateData: any = {};
    
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (phoneNumber) updateData.phoneNumber = phoneNumber.trim();
    if (country) updateData.country = country;

    if (Object.keys(updateData).length === 0) {
       return corsResponse({ error: "No changes provided" }, 400, req);
    }



    // 2. Execute Update
    const updatedUser = await User.findByIdAndUpdate(
      session?.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires -verificationOtp -verificationOtpExpires");

    if (!updatedUser) {
      return corsResponse({ error: "User not found" }, 404, req);
    }

    return corsResponse(updatedUser, 200, req);
  } catch (error: any) {
    console.error("UPDATE_PROFILE_ERROR:", error);
    
    if (error.name === "ValidationError") {
      return corsResponse({ error: "Validation failed", details: error.message }, 400, req);
    }

    return corsResponse({ error: "Failed to update profile" }, 500, req);
  }
}