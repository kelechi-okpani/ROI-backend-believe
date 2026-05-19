import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Wallet } from "@/lib/models/Wallet";
import { Transaction } from "@/lib/models/Transaction";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  try {
    // 1. Session & Auth Check
    const session = await auth();
    if (!session || !session.user?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();
    // Destructure walletType from incoming frontend request payload
    const { amount, walletType, bankDetails } = await req.json();

    // 2. Input Validation
    if (!amount || amount <= 0) {
      return corsResponse({ error: "A valid withdrawal amount is required" }, 400, req);
    }

    if (!bankDetails) {
      return corsResponse({ error: "Withdrawal destination details are required" }, 400, req);
    }

    // Map frontend dropdown state IDs to actual database schema keys
    let balanceField: "balance" | "profitBalance" | "referralBalance" = "balance";
    
    if (walletType === "profit") {
      balanceField = "profitBalance";
    } else if (walletType === "referral") {
      balanceField = "referralBalance";
    } else if (walletType === "main") {
      balanceField = "balance"; // Maps 'main' frontend state selection to 'balance' database path
    }

    // 3. Balance Check
    const wallet = await Wallet.findOne({ userId: session.user.id });

    if (!wallet) {
      return corsResponse({ error: "Wallet account not found" }, 404, req);
    }

    // Dynamic database path balance check
    if (wallet[balanceField] < amount) {
      const standardName = walletType === "main" ? "main balance" : `${walletType} balance`;
      return corsResponse({ error: `Insufficient funds in your ${standardName}` }, 400, req);
    }

    /** * 4. ATOMIC DEBIT
     * Dynamically deduct money directly from chosen balance field path
     */
    wallet[balanceField] -= amount;
    await wallet.save();

    // 5. Create Withdrawal Transaction
    const withdrawal = await Transaction.create({
      userId: session.user.id,
      amount,
      method: "USDT/BTC_TRANSFER", 
      type: "WITHDRAWAL",
      status: "PENDING",
      walletType: walletType, // Optional: save selected source wallet path for admin viewing history logs
      bankDetails, 
      reference: `WITH-${Date.now()}`
    });

    return corsResponse(
      { message: `Withdrawal request from ${walletType} wallet submitted for review.`, withdrawal }, 
      201, 
      req
    );

  } catch (error) {
    console.log("WITHDRAWAL_REQUEST_ERROR:", error);
    return corsResponse({ error: "Withdrawal request failed" }, 500, req);
  }
}