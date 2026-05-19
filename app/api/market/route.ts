// app/api/cron/market-sync/route.ts
import { NextRequest } from "next/server";
import { corsResponse } from "@/lib/cors";
import { pulseMarketIndexUpdate } from "@/lib/liveMarket";


export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    
    // Vercel automatically attaches the CRON_SECRET inside the Bearer token
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return corsResponse({ error: "Unauthorized: Access Denied" }, 401, req);
    }

    // Fire the price syncing sequence across stocks and crypto
    await pulseMarketIndexUpdate();
    
    return corsResponse(
      { success: true, message: "Market rates synchronized successfully" }, 
      200, 
      req
    );

  } catch (error: any) {
    console.error("❌ CRON_JOB_FAILURE:", error);
    return corsResponse(
      { error: "Internal Server Error", details: error.message || "Failed to parse market index updates" }, 
      500, 
      req
    );
  }
}