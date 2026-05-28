import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Investment } from "@/lib/models/Investment";
import { InvestmentPlan } from "@/lib/models/InvestmentPlan";
import { Wallet } from "@/lib/models/Wallet";
import { calculateDailyROI } from "@/lib/investment-utils";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";
import mongoose from "mongoose";
import { createNotification } from "@/lib/notifications";


export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}




// export async function GET(req: NextRequest) {
//   try {
//     const session = await auth(req);
//     if (!session || !session?.id) {
//       return corsResponse({ error: "Unauthorized" }, 401, req);
//     }

//     await connectDB();

//     let dbInvestments;

//     if (session?.role === "ADMIN") {
//       // Admin: See everything with user details
//       dbInvestments = await Investment.find({})
//         .populate("userId", "firstName lastName email")
//         .populate("planId", "name")
//         .sort({ createdAt: -1 })
//         .lean();
//     } else {
//       // User: See only their own history
//       dbInvestments = await Investment.find({ userId: session?.id })
//         .populate("planId", "name")
//         .sort({ createdAt: -1 })
//         .lean();
//     }

//     // Transform payload to structurally match your Dashboard component variables
//     // e.g., flattening investment.planId.name into investment.planName
//     const investments = dbInvestments.map((inv: any) => {
//       const plan = inv.planId;

//       const amount = Number(inv.amount || 0);
//       const roiPercentage = Number(plan?.roiPercentage || 0);

//       // Total profit expected from ROI
//       const expectedProfit = (amount * roiPercentage) / 100;

//       // Total amount user receives back
//       const expectedReturn = amount + expectedProfit;

//       // Progress tracking
//       const durationDays = Number(plan?.durationDays || 1);

//       const createdDate = new Date(inv.createdAt);
//       const today = new Date();

//       const elapsedDays = Math.max(
//         0,
//         Math.floor(
//           (today.getTime() - createdDate.getTime()) /
//             (1000 * 60 * 60 * 24)
//         )
//       );

//       const progress = Math.min(
//         100,
//         Math.floor((elapsedDays / durationDays) * 100)
//       );

//       const daysLeft = Math.max(0, durationDays - elapsedDays);

//       // Current live profit based on progress
//       const currentProfit = Number(
//         ((expectedProfit * progress) / 100).toFixed(2)
//       );

//       // If completed, total earned = full ROI profit
//       const totalEarned =
//         progress >= 100 ? expectedProfit : currentProfit;

//       return {
//         ...inv,

//         planName: plan?.name || "Asset Node",

//         roiPercentage,
//         durationDays,

//         progress,
//         daysLeft,

//         currentProfit,
//         totalEarned,
//         expectedReturn,

//         expectedProfit
//       };
//     });

//     return corsResponse(investments, 200, req);
//   } catch (error) {
//     console.error("GET_INVESTMENTS_ERROR:", error);
//     return corsResponse({ error: "Failed to fetch investments" }, 500, req);
//   }
// }


// export async function POST(req: NextRequest) {
//   try {
//     const authSession = await auth(req);

//     if (!authSession || !authSession?.id) {
//       return corsResponse({ error: "Unauthorized" }, 401, req);
//     }

//     await connectDB();
//     const { planId, amount } = await req.json();

//     // 1. Fetch Plan & Wallet
//     const [plan, wallet] = await Promise.all([
//       InvestmentPlan.findById(planId),
//       Wallet.findOne({ userId: authSession.id })
//     ]);

//     if (!plan) return corsResponse({ error: "Investment plan not found" }, 404, req);
//     if (!wallet) return corsResponse({ error: "Wallet not found" }, 404, req);

//     // 2. Validate Limits
//     if (amount < plan.minAmount || amount > plan.maxAmount) {
//       return corsResponse({ 
//         error: `Amount must be between ${plan.minAmount} and ${plan.maxAmount}` 
//       }, 400, req);
//     }

//     // 3. Check Sufficient Balance
//     if (wallet.balance < amount) {
//       return corsResponse({ error: "Insufficient balance in main wallet" }, 400, req);
//     }

//     // 4. Calculate ROI values
//     const { dailyProfit, totalExpectedReturn } = calculateDailyROI(
//       amount, 
//       plan.roiPercentage, 
//       plan.durationDays
//     );

//     // 5. Atomic Update: Deduct balance and increment totalInvested
//     // Using $inc prevents race conditions (double-spending)
//     await Wallet.updateOne(
//       { userId: authSession.id },
//       { 
//         $inc: { 
//           balance: -amount, 
//           totalInvested: amount 
//         } 
//       }
//     );

//     // 6. Create Investment
//     // Using new + save with validateBeforeSave: false avoids schema validation errors
//     const investment = new Investment({
//       userId: authSession.id,
//       planId: plan._id,
//       amount,
//       dailyProfit,
//       totalExpectedReturn,
//       status: "PENDING",
//     });

//     await investment.save({ validateBeforeSave: false });

//     // 7. Notification
//     await createNotification(
//       authSession.id, 
//       'INVESTMENT', 
//       'Investment Submitted', 
//       `Your investment of $${amount} has been submitted and is under review.`,
//       { investmentId: investment._id }
//     );

//     return corsResponse({ 
//       message: "Investment request submitted for approval", 
//       investment 
//     }, 201, req);

//   } catch (error: any) {
//     console.error("INVESTMENT_REQUEST_ERROR:", error);
//     return corsResponse({ error: error.message || "Failed to process investment" }, 500, req);
//   }
// }

export async function GET(req: NextRequest) {
  try {
    const session = await auth(req);

    if (!session || !session?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();

    const isAdmin = session?.role === "ADMIN";

    const dbInvestments = isAdmin
      ? await Investment.find({})
          .populate("userId", "firstName lastName email")
          .populate("planId", "name roiPercentage durationDays")
          .sort({ createdAt: -1 })
          .lean()
      : await Investment.find({ userId: session.id })
          .populate("planId", "name roiPercentage durationDays")
          .sort({ createdAt: -1 })
          .lean();

    const now = Date.now();

    const investments = dbInvestments.map((inv: any) => {
      const plan = inv.planId;

      const amount = Number(inv.amount || 0);

      // ✅ REAL VALUES FROM DB (set by CRON)
      const totalEarned = Number(inv.totalEarned || 0);
      const totalExpectedReturn = Number(inv.totalExpectedReturn || 0);
      const dailyProfit = Number(inv.dailyProfit || 0);

      const durationDays = Number(plan?.durationDays || inv.durationDays || 1);

      // ---- Progress based on TIME ONLY (NOT profit simulation)
      const created = new Date(inv.createdAt).getTime();
      const elapsedDays = Math.max(
        0,
        Math.floor((now - created) / (1000 * 60 * 60 * 24))
      );

      const progress = Math.min(
        100,
        Math.floor((elapsedDays / durationDays) * 100)
      );

      const daysLeft = Math.max(0, durationDays - elapsedDays);

      return {
        ...inv,

        planName: plan?.name || "Asset Node",

        roiPercentage: plan?.roiPercentage || 0,
        durationDays,

        // ✅ REAL DATA FROM DATABASE (IMPORTANT)
        totalEarned,
        totalExpectedReturn,
        dailyProfit,

        // UI helpers only
        progress,
        daysLeft,

        status: inv.status,

        investmentType: inv.planId
          ? "FIXED_PLAN"
          : "MARKET_TERMINAL",

        displayName: inv.planId
          ? plan?.name
          : `${inv.assetSymbol || "ASSET"} (${inv.assetType || "CRYPTO"})`,
      };
    });

    return corsResponse(investments, 200, req);
  } catch (error) {
    console.error("GET_INVESTMENTS_ERROR:", error);
    return corsResponse(
      { error: "Failed to fetch investments" },
      500,
      req
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    /**
     * 1. AUTHORIZATION
     */
    const authSession = await auth(req);

    if (!authSession || !authSession?.id) {
      return corsResponse(
        { error: "Unauthorized" },
        401,
        req
      );
    }

    /**
     * 2. DATABASE
     */
    await connectDB();

    /**
     * 3. REQUEST BODY
     */
    const { planId, amount, durationDays } = await req.json();

    /**
     * 4. FETCH PLAN + WALLET
     */
    const [plan, wallet] = await Promise.all([
      InvestmentPlan.findById(planId),
      Wallet.findOne({
        userId: authSession.id,
      }),
    ]);

    /**
     * 5. VALIDATIONS
     */
    if (!plan) {
      return corsResponse(
        { error: "Investment plan not found" },
        404,
        req
      );
    }

    if (!wallet) {
      return corsResponse(
        { error: "Wallet not found" },
        404,
        req
      );
    }

    /**
     * 6. CHECK INVESTMENT LIMITS
     */
    if (
      amount < plan.minAmount ||
      amount > plan.maxAmount
    ) {
      return corsResponse(
        {
          error: `Amount must be between ${plan.minAmount} and ${plan.maxAmount}`,
        },
        400,
        req
      );
    }

    /**
     * 7. CHECK WALLET BALANCE
     */
    if (wallet.balance < amount) {
      return corsResponse(
        {
          error:
            "Insufficient balance in main wallet",
        },
        400,
        req
      );
    }

    /**
     * 8. CALCULATE ROI
     */
    const {dailyProfit, totalExpectedReturn, } = 
    calculateDailyROI(amount, plan.roiPercentage, durationDays);

    /**
     * 9. DEDUCT USER WALLET
     */
    await Wallet.updateOne(
      {
        userId: authSession.id,
      },
      {
        $inc: {
          balance: -amount,
          totalInvested: amount,
        },
      }
    );

    /**
     * 10. CREATE INVESTMENT
     */
    const investment = await Investment.create({
      userId: authSession.id,
      planId: plan._id,
      amount,
      dailyProfit,
      totalExpectedReturn,
      durationDays,

      totalEarned: 0,
      status: "PENDING",
      imageUrl: plan.imageUrl || "",
    });

    /**
     * 11. CREATE NOTIFICATION
     */
    await createNotification(
      authSession.id,
      "INVESTMENT",
      "Investment Submitted",
      `Your investment of $${amount} has been submitted and is under review.`,
      {
        investmentId: investment._id,
      }
    );

    /**
     * 12. RESPONSE
     */
    return corsResponse(
      {
        success: true,

        message:
          "Investment request submitted successfully",

        investment,
      },
      201,
      req
    );
  } catch (error: any) {
    console.error(
      "INVESTMENT_REQUEST_ERROR:",
      error
    );

    return corsResponse(
      {
        error:
          error.message ||
          "Failed to process investment",
      },
      500,
      req
    );
  }
}