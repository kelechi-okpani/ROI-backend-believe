// BACKEND: app/api/investments/create/route.ts
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Investment } from "@/lib/models/Investment";
import { Wallet } from "@/lib/models/Wallet";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  const session = await mongoose.startSession();
  
  try {
    const authSession = await auth(req);
    if (!authSession) {
      return corsResponse({ error: "Unauthorized: Access Denied" }, 401, req);
    }

    await connectDB();
    const { asset, amount } = await req.json();

    // 1. Structural Sanity & Minimum Amount Validation Check
    if (!asset || !amount) {
      return corsResponse({ error: "Invalid asset payload or missing parameters" }, 400, req);
    }

    const MINIMUM_ALLOCATION = 500;
    if (amount < MINIMUM_ALLOCATION) {
      return corsResponse({ 
        error: `Investment allocation rejected. The absolute minimum contract funding tier is $${MINIMUM_ALLOCATION}.` 
      }, 400, req);
    }

    // Fixed configuration parameters for live terminal yields
    const YIELD_RATE_DAILY = 0.055; // 5.5% fixed performance yield
    const DURATION_DAYS = 15;

    const dailyProfit = amount * YIELD_RATE_DAILY;
    const totalExpectedReturn = amount + (dailyProfit * DURATION_DAYS);

    session.startTransaction();

    // 2. Balance Verification Validation Check
    const userWallet = await Wallet.findOne({ userId: authSession.id }).session(session);
    if (!userWallet || userWallet.balance < amount) {
      await session.abortTransaction();
      return corsResponse({ error: "Inadequate funding balances inside destination wallet" }, 400, req);
    }

    // 3. Atomically debit user capital assets immediately upon request submission
    userWallet.balance -= amount;
    await userWallet.save({ session });

    // 4. Record new specialized market entry mapping
    const marketInvestment = new Investment({
      planId: new mongoose.Types.ObjectId(),
      userId: authSession.id,
      amount,
      // Pass asset snapshot parameters natively into your collection metrics tracking layout
      assetSymbol: asset.symbol,
      assetType: asset.assetType,
      purchasePriceAtEntry: asset.price,
      imageUrl: asset.assetType === "CRYPTO" ? "/icons/crypto-vector.png" : "/icons/stock-vector.png",
      dailyProfit,
      totalExpectedReturn,
      status: "PENDING" // Placed into pending state waiting for admin clearance
    });

    await marketInvestment.save({ session });

    await session.commitTransaction();
    return corsResponse({ message: "Market deployment request logged successfully", investmentId: marketInvestment._id }, 201, req);

  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("CREATE_LIVE_INVESTMENT_ERROR:", error);
    return corsResponse({ error: error.message || "Internal Server Error" }, 500, req);
  } finally {
    await session.endSession();
  }
}