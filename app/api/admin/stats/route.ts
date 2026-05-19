import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Transaction } from "@/lib/models/Transaction";
import { Investment } from "@/lib/models/Investment";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  try {
    // 1. Admin Authorization Guard
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden: Administrative access required" }, 403, req);
    }

    await connectDB();

    // 2. Parallel Deep Documents Execution (using .lean() for faster execution)
    const [users, investments, transactions] = await Promise.all([
      // User.find({}).sort({ createdAt: -1 }).lean(),
      User.find({ role: { $ne: "SUPER_ADMIN" } })
    .sort({ createdAt: -1 })
    .lean(),
      Investment.find({})
        .populate("userId", "firstName lastName email")
        .populate("planId", "name roiPercentage durationDays")
        .sort({ createdAt: -1 })
        .lean(),
      Transaction.find({})
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // 3. Compute structural analytics counters directly in memory from fetched arrays
    const totalUsersCount = users.length;
    const activeInvestmentsCount = investments.filter(inv => inv.status === "ACTIVE").length;
    const pendingTasksCount = transactions.filter(tx => tx.status === "PENDING").length;
    
    const totalDepositVolume = transactions
      .filter(tx => tx.status === "COMPLETED" && tx.type === "DEPOSIT")
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // 4. Combined Metrics Payload Response
    return corsResponse({
      summary: {
        totalUsers: totalUsersCount,
        activeInvestments: activeInvestmentsCount,
        pendingTasks: pendingTasksCount,
        totalDepositVolume: totalDepositVolume
      },
      rawData: {
        users,
        investments,
        transactions
      }
    }, 200, req);

  } catch (error: any) {
    console.error("ADMIN_FULL_EXPORTS_STATS_ERROR:", error);
    return corsResponse({ error: error.message || "Platform telemetry records failed to load" }, 500, req);
  }
}