import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Wallet } from "@/lib/models/Wallet";
import { Transaction } from "@/lib/models/Transaction";
import { Investment } from "@/lib/models/Investment"; 
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  try {
    // 1. Session & Auth Check
    const session = await auth(req);
    if (!session || !session?.id) {
      return corsResponse({ error: "Unauthorized access token" }, 401, req);
    }

    await connectDB();
    const userObjectId = new mongoose.Types.ObjectId(session?.id);

    // 2. Fetch or create the base Wallet Ledger Record first
    let wallet = await Wallet.findOne({ userId: userObjectId });
    if (!wallet) {
      wallet = await Wallet.create({ 
        userId: userObjectId,
        balance: 0,
        profitBalance: 0,
        referralBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalInvested: 0
      });
    }

    // 3. Aggregate Metrics Analytics (For accurate display counters)
    const [transactionAnalytics, investmentAnalytics] = await Promise.all([
      Transaction.aggregate([
        { 
          $match: { 
            userId: userObjectId, 
            status: { $in: ["COMPLETED", "APPROVED", "completed", "SUCCESS", "success"] } 
          } 
        },
        {
          $group: {
            _id: null,
            totalDeposited: {
              $sum: { $cond: [{ $eq: [{ $toUpper: "$type" }, "DEPOSIT"] }, "$amount", 0] }
            },
            totalWithdrawn: {
              $sum: { $cond: [{ $eq: [{ $toUpper: "$type" }, "WITHDRAWAL"] }, "$amount", 0] }
            },
            totalReferralEarned: {
              $sum: { $cond: [{ $eq: [{ $toUpper: "$type" }, "REFERRAL"] }, "$amount", 0] }
            }
          }
        }
      ]),
      Investment.aggregate([
        { 
          $match: { 
            userId: userObjectId, 
            status: { $in: ["ACTIVE", "COMPLETED"] } 
          } 
        },
        {
          $group: {
            _id: null,
            totalInvestedCapital: { $sum: "$amount" },
            totalProfitsEarned: { $sum: "$totalEarned" }
          }
        }
      ])
    ]);

    const txTotals = transactionAnalytics[0] || { totalDeposited: 0, totalWithdrawn: 0, totalReferralEarned: 0 };
    const invTotals = investmentAnalytics[0] || { totalInvestedCapital: 0, totalProfitsEarned: 0 };

    // 4. Handle Spendable Balance Safeguard
    // If for any reason the persistent wallet balance tracker goes out of sync, 
    // we fallback to math: Approved Deposits - Approved Withdrawals - Active Investments
    // This explicitly prevents "balance" from mimicking "totalDeposited"
    const verifiedBalance = Math.max(
      0, 
      txTotals.totalDeposited - txTotals.totalWithdrawn - invTotals.totalInvestedCapital
    );

    // If the saved balance is completely broken or out of bounds, use the calculated truth
    if (wallet.balance === undefined || wallet.balance === 0 && verifiedBalance > 0) {
      wallet.balance = verifiedBalance;
    }

    // 5. Update the analytical summary counters with our clean data matrix
    wallet.profitBalance = invTotals.totalProfitsEarned;
    wallet.referralBalance = txTotals.totalReferralEarned;
    wallet.totalDeposited = txTotals.totalDeposited;
    wallet.totalWithdrawn = txTotals.totalWithdrawn;
    wallet.totalInvested = invTotals.totalInvestedCapital;
    
    await wallet.save();

    // 6. Safely return the source-of-truth document record containing everything
    return corsResponse(wallet, 200, req);

  } catch (error) {
    console.error("GET_WALLET_ERROR:", error);
    return corsResponse({ error: "Failed to process financial portfolio matrix data" }, 500, req);
  }
}