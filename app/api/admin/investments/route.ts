import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Investment } from "@/lib/models/Investment";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

import "@/lib/models/User";
import "@/lib/models/InvestmentPlan";


export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  try {
    // 1. Admin Authorization Guard — Pass req directly to extract session data safely
    const session = await auth();
    
    if (!session || session.user?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden: Access Denied" }, 403, req);
    }

    // 2. Establish Database Connection
    await connectDB();

    // 3. Fetch all investment entities with relational populations
    // Added .lean() to convert complex Mongoose documents to high-performance plain JSON objects
    const requests = await Investment.find({})
      .populate("userId", "firstName lastName email")
      .populate("planId", "name roiPercentage durationDays")
      .sort({ createdAt: -1 })
      .lean();

    return corsResponse(requests, 200, req);
    
  } catch (error: any) {
    console.error("GET_INVESTMENT_REQUESTS_ERROR:", error);
    return corsResponse({ error: "Failed to fetch platform asset requests" }, 500, req);
  }
}