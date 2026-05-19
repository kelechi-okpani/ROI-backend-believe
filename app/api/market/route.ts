// app/api/cron/market-sync/route.ts
import { NextRequest } from "next/server";
import { corsResponse } from "@/lib/cors";
import { connectDB } from "@/lib/db";
import { Market } from "@/lib/models/Market";
import { pulseMarketIndexUpdate } from "@/lib/liveMarket";

export const dynamic = "force-dynamic";


export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Fetch all stocks and cryptos sorted by asset type and name
    const marketData = await Market.find({})
      .sort({ assetType: 1, symbol: 1 })
      .lean();

    return corsResponse(marketData, 200, req);
  } catch (error: any) {
    console.error("❌ GET_MARKET_DATA_ERROR:", error);
    return corsResponse(
      { error: "Internal Server Error", details: error.message || "Failed to fetch live asset data" },
      500,
      req
    );
  }
}

/**
 * 🪙 BACKGROUND SYNC METHOD
 * Vercel Cron triggers this endpoint via a POST request once every minute to pull fresh data from Finnhub.
 * We switch this to POST to cleanly separate cron system mutations from standard client fetches.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    
    // Safety guard checking for Vercel's Cron secure token
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return corsResponse({ error: "Unauthorized: Access Denied" }, 401, req);
    }

    // Fire the price fetching engine sequence across stocks and crypto
    await pulseMarketIndexUpdate();
    
    return corsResponse(
      { success: true, message: "Market rates synchronized successfully into database" }, 
      200, 
      req
    );

  } catch (error: any) {
    console.error("❌ CRON_JOB_FAILURE:", error);
    return corsResponse(
      { error: "Internal Server Error", details: error.message || "Failed to execute market sync routine" }, 
      500, 
      req
    );
  }
}