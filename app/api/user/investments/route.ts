import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Investment } from "@/lib/models/Investment";
import { InvestmentPlan } from "@/lib/models/InvestmentPlan";
import { Wallet } from "@/lib/models/Wallet";
import { calculateDailyROI } from "@/lib/investment-utils";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";


export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}



// GET: Fetch investments (Admin sees all, User sees personal)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();

    let dbInvestments;

    if (session.user.role === "ADMIN") {
      // Admin: See everything with user details
      dbInvestments = await Investment.find({})
        .populate("userId", "firstName lastName email")
        .populate("planId", "name")
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // User: See only their own history
      dbInvestments = await Investment.find({ userId: session.user.id })
        .populate("planId", "name")
        .sort({ createdAt: -1 })
        .lean();
    }

    // Transform payload to structurally match your Dashboard component variables
    // e.g., flattening investment.planId.name into investment.planName
    const investments = dbInvestments.map((inv: any) => {
      const planName = inv.planId?.name || "Asset Node";
      return {
        ...inv,
        planName,
        // Ensure fallback structures exist if dashboard expects direct layout primitives
        progress: inv.progress ?? 0,
        daysLeft: inv.daysLeft ?? 0,
        profit: inv.profit ?? 0
      };
    });

    return corsResponse(investments, 200, req);
  } catch (error) {
    console.error("GET_INVESTMENTS_ERROR:", error);
    return corsResponse({ error: "Failed to fetch investments" }, 500, req);
  }
}




// POST: Create a new investment request
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();
    const { planId, amount } = await req.json();

    // 1. Fetch Plan & Wallet
    const [plan, wallet] = await Promise.all([
      InvestmentPlan.findById(planId),
      Wallet.findOne({ userId: session.user.id })
    ]);

    if (!plan) return corsResponse({ error: "Investment plan not found" }, 404, req);
    if (!wallet) return corsResponse({ error: "Wallet not found" }, 404, req);

    // 2. Validate Limits
    if (amount < plan.minAmount || amount > plan.maxAmount) {
      return corsResponse({ 
        error: `Amount must be between ${plan.minAmount} and ${plan.maxAmount}` 
      }, 400, req);
    }

    // 3. Check Sufficient Balance
    if (wallet.balance < amount) {
      return corsResponse({ error: "Insufficient balance in main wallet" }, 400, req);
    }

    // 4. Calculate ROI values
    const { dailyProfit, totalExpectedReturn } = calculateDailyROI(
      amount, 
      plan.roiPercentage, 
      plan.durationDays
    );

    /** 
     * 5. ATOMIC OPERATION
     * Deducting balance upfront to prevent double-spending.
     */
    wallet.balance -= amount;
    wallet.totalInvested += amount;
    await wallet.save();

    const investment = await Investment.create({
      userId: session.user.id,
      planId: plan._id,
      amount,
      dailyProfit,
      totalExpectedReturn,
      status: "PENDING",
    });

    return corsResponse({ 
      message: "Investment request submitted for approval", 
      investment 
    }, 201, req);

  } catch (error) {
    console.error("INVESTMENT_REQUEST_ERROR:", error);
    return corsResponse({ error: "Failed to process investment" }, 500, req);
  }
}