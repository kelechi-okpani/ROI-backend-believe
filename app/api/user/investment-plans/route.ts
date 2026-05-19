import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { InvestmentPlan } from "@/lib/models/InvestmentPlan";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}


export async function GET(req: NextRequest | any) {
  try {
    // FIXED: Swapped to backend-safe session retrieval helper
    const session = await auth();
    if (!session) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();

    // Fetches plans sorted by lowest price tier first (.lean() for raw performance)
    const plans = await InvestmentPlan.find({ isActive: true })
      .sort({ minAmount: 1 })
      .lean();

    return corsResponse(plans, 200, req);
  } catch (error) {
    console.error("GET_PLANS_ERROR:", error);
    return corsResponse({ error: "Failed to fetch investment plans" }, 500, req);
  }
}

