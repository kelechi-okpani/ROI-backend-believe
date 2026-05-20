// BACKEND: app/api/investments/create/route.ts
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Investment } from "@/lib/models/Investment";
import { Wallet } from "@/lib/models/Wallet";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";
import { createNotification } from "@/lib/notifications";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}


// POST: Create a new live investment market deployment
export async function POST(req: NextRequest) {
  try {
    const authSession = await auth(req);
    if (!authSession || !authSession?.id) {
      return corsResponse({ error: "Unauthorized: Access Denied" }, 401, req);
    }

    await connectDB();
    const { asset, amount } = await req.json();

    if (!asset || !amount) {
      return corsResponse({ error: "Invalid asset payload or missing parameters" }, 400, req);
    }

    const MINIMUM_ALLOCATION = 500;
    if (amount < MINIMUM_ALLOCATION) {
      return corsResponse({ 
        error: `Investment allocation rejected. The absolute minimum contract funding tier is $${MINIMUM_ALLOCATION}.` 
      }, 400, req);
    }

    const YIELD_RATE_DAILY = 0.055;
    const DURATION_DAYS = 15;

    const dailyProfit = amount * YIELD_RATE_DAILY;
    const totalExpectedReturn = amount + (dailyProfit * DURATION_DAYS);

    // 1. Atomic Wallet Update: Verify balance and deduct in one step
    // This prevents race conditions without needing a session
    const walletUpdate = await Wallet.updateOne(
      { userId: authSession.id, balance: { $gte: amount } },
      { $inc: { balance: -amount } }
    );

    if (walletUpdate.modifiedCount === 0) {
      return corsResponse({ error: "Inadequate funding balances inside destination wallet" }, 400, req);
    }

    // 2. Record new specialized market entry mapping
    const marketInvestment = new Investment({
      planId: new mongoose.Types.ObjectId(),
      userId: authSession.id,
      amount,
      assetSymbol: asset.symbol,
      assetType: asset.assetType,
      purchasePriceAtEntry: asset.price,
      imageUrl: asset.assetType === "CRYPTO" ? "/icons/crypto-vector.png" : "/icons/stock-vector.png",
      dailyProfit,
      totalExpectedReturn,
      status: "PENDING"
    });

    // Use validateBeforeSave: false to bypass schema requirements like address
    await marketInvestment.save({ validateBeforeSave: false });

    // 3. Trigger Notification
    await createNotification(
      authSession.id,
      'INVESTMENT',
      'Market Deployment Logged',
      `Your request to deploy $${amount} into ${asset.symbol} has been submitted for admin clearance.`,
      { investmentId: marketInvestment._id }
    );

    return corsResponse({ 
      message: "Market deployment request logged successfully", 
      investmentId: marketInvestment._id 
    }, 201, req);

  } catch (error: any) {
    console.error("CREATE_LIVE_INVESTMENT_ERROR:", error);
    return corsResponse({ error: error.message || "Internal Server Error" }, 500, req);
  }
}

