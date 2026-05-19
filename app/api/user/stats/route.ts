import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Wallet } from "@/lib/models/Wallet";
import { Investment } from "@/lib/models/Investment";
import { Transaction } from "@/lib/models/Transaction";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";



export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth(req);
    if (!session?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();
    const userId = session.id;

    // 1. Fetch data in parallel for maximum performance
    const [wallet, activeInvestments, recentTransactions] = await Promise.all([
      Wallet.findOne({ userId }).lean(),
      Investment.find({ userId, status: "ACTIVE" }).lean(),
      Transaction.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    // 2. Resilience: If wallet doesn't exist or resolves to an unexpected array, provide a default object
    const currentWallet = !Array.isArray(wallet) && wallet ? wallet : {
      balance: 0,
      profitBalance: 0,
      referralBalance: 0,
      totalInvested: 0,
    };

    // 3. Calculate Summary Logic
    const stats = {
      // Main Card Totals
      overview: {
        totalBalance: currentWallet.balance + currentWallet.profitBalance,
        mainBalance: currentWallet.balance,
        profitBalance: currentWallet.profitBalance,
        referralBalance: currentWallet.referralBalance,
        totalInvested: currentWallet.totalInvested,
      },
      // Investment Snapshot
      investments: {
        activeCount: activeInvestments.length,
        totalActiveValue: activeInvestments.reduce((sum, inv) => sum + inv.amount, 0),
        // Grouping for a mini-chart/list
        items: activeInvestments.slice(0, 3).map(inv => ({
          id: inv._id,
          amount: inv.amount,
          profit: inv.dailyProfit,
          status: inv.status
        }))
      },
      // Recent Activity for the Dashboard Feed
      recentActivity: recentTransactions.map(trx => ({
        id: trx._id,
        type: trx.type,
        amount: trx.amount,
        status: trx.status,
        date: trx.createdAt,
        reference: trx.reference
      }))
    };

    return corsResponse(stats, 200, req);
  } catch (error) {
    console.error("GET_USER_STATS_ERROR:", error);
    return corsResponse({ error: "Failed to compile user statistics" }, 500, req);
  }
}