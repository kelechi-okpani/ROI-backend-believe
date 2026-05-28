import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Investment } from "@/lib/models/Investment";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

// Prevent missing-model boundary schema errors during population phases
import "@/lib/models/User";
import "@/lib/models/InvestmentPlan";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  try {
    // 1. Admin Authorization Guard
    const session = await auth(req);

    if (!session || session?.role !== "ADMIN") {
      return corsResponse(
        { error: "Forbidden: Access Denied" },
        403,
        req
      );
    }

    // 2. Connect DB
    await connectDB();

    // 3. Fetch Investments
    const investments = await Investment.find({})
      .populate("userId", "firstName lastName email")
      .populate("planId", "name roiPercentage durationInDays")
      .sort({ createdAt: -1 })
      .lean();

    // 4. Standardize
  // 4. Transform + Persist Live Calculations
const standardizedRequests = await Promise.all(
  investments.map(async (inv: any) => {
    const isMarketTrade = !inv.planId;

    // --- LIVE ACCRUED PROFIT CALCULATION ---
    let calculatedProfit = inv.totalEarned || 0;
    let daysLeft = inv.durationDays || 0;

    if (inv.status === "ACTIVE" && inv.approvedAt) {
      const approvedTime = new Date(inv.approvedAt).getTime();
      const now = Date.now();

      const endTime = inv.endDate
        ? new Date(inv.endDate).getTime()
        : now;

      const effectiveNow = Math.min(now, endTime);

      const timeDiffMs = effectiveNow - approvedTime;

      if (timeDiffMs > 0) {
        const daysElapsed =
          timeDiffMs / (1000 * 60 * 60 * 24);

        calculatedProfit = parseFloat(
          (daysElapsed * inv.dailyProfit).toFixed(2)
        );

        // Prevent exceeding max return
        if (
          inv.totalExpectedReturn &&
          calculatedProfit > inv.totalExpectedReturn
        ) {
          calculatedProfit =
            inv.totalExpectedReturn;
        }
      }

      // Calculate days left
      if (inv.endDate) {
        const timeLeftMs =
          new Date(inv.endDate).getTime() - now;

        daysLeft =
          timeLeftMs > 0
            ? Math.ceil(
                timeLeftMs /
                  (1000 * 60 * 60 * 24)
              )
            : 0;
      }

      /**
       * SAVE UPDATED PROFIT TO DATABASE
       */
      await Investment.findByIdAndUpdate(inv._id, {
        totalEarned: calculatedProfit,
        lastPayoutDate: new Date(),
      });
    }

    // Completed investment
    if (inv.status === "COMPLETED") {
      calculatedProfit =
        inv.totalExpectedReturn ||
        inv.totalEarned;

      await Investment.findByIdAndUpdate(inv._id, {
        totalEarned: calculatedProfit,
      });
    }

    return {
      // Original DB fields
      _id: inv._id,

      userId: inv.userId,
      planId: inv.planId,

      amount: inv.amount,
      imageUrl: inv.imageUrl,

      dailyProfit: inv.dailyProfit,
      totalExpectedReturn:
        inv.totalExpectedReturn,

      totalEarned: calculatedProfit,

      status: inv.status,

      assetSymbol: inv.assetSymbol,
      assetType: inv.assetType,

      purchasePriceAtEntry:
        inv.purchasePriceAtEntry,

      approvedAt: inv.approvedAt,

      durationDays: inv.durationDays,

      endDate: inv.endDate,

      lastPayoutDate:
        inv.lastPayoutDate,

      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,

      __v: inv.__v,

      // Frontend Helpers
      currentProfit: calculatedProfit,

      daysLeft,

      investmentType: isMarketTrade
        ? "MARKET_TERMINAL"
        : "FIXED_PLAN",

      displayName: isMarketTrade
        ? `${inv.assetSymbol} (${inv.assetType})`
        : inv.planId?.name ||
          "Fixed Plan Asset",

      displayROI: isMarketTrade
        ? `${(
            (inv.dailyProfit / inv.amount) *
            100
          ).toFixed(2)}% Daily`
        : `${
            inv.planId?.roiPercentage || 0
          }% Total`,
    };
  })
);

    return corsResponse(
      standardizedRequests,
      200,
      req
    );

  } catch (error: any) {
    console.error(
      "GET_INVESTMENT_REQUESTS_ERROR:",
      error
    );

    return corsResponse(
      {
        error:
          "Failed to fetch platform asset requests",
      },
      500,
      req
    );
  }
}

// export async function GET(req: NextRequest) {
//   try {
//     // 1. Admin Authorization Guard
//     const session = await auth(req);
    
//     if (!session || session?.role !== "ADMIN") {
//       return corsResponse({ error: "Forbidden: Access Denied" }, 403, req);
//     }

//     // 2. Establish Database Connection
//     await connectDB();

//     // 3. Fetch all investment entities with hybrid populations
//     const investments = await Investment.find({})
//       .populate("userId", "firstName lastName email")
//       .populate("planId", "name roiPercentage durationInDays") 
//       .sort({ createdAt: -1 })
//       .lean();

//     // 4. Transform data inline to standardize outputs for the Admin Panel
//     const standardizedRequests = investments.map((inv: any) => {
//       const isMarketTrade = !inv.planId;
      
//       // --- LIVE ACCRUED PROFIT CALCULATION ---
//       let calculatedProfit = inv.totalEarned || 0;
//       let daysLeft = inv.durationDays || 0;

//       if (inv.status === "ACTIVE" && inv.approvedAt) {
//         const approvedTime = new Date(inv.approvedAt).getTime();
//         const now = Date.now();
//         const endTime = inv.endDate ? new Date(inv.endDate).getTime() : now;
        
//         // Ensure we don't calculate profit past the investment's end date
//         const effectiveNow = Math.min(now, endTime);
//         const timeDiffMs = effectiveNow - approvedTime;
        
//         if (timeDiffMs > 0) {
//           const daysElapsed = timeDiffMs / (1000 * 60 * 60 * 24);
          
//           // NOTE: Leave as fractional days for continuous live-ticking profit, 
//           // or use Math.floor(daysElapsed) if you want payouts strictly every 24 hours.
//           calculatedProfit = parseFloat((daysElapsed * inv.dailyProfit).toFixed(2));
          
//           // Safety Cap: Don't let current profit exceed total expected returns
//           if (inv.totalExpectedReturn && calculatedProfit > inv.totalExpectedReturn) {
//             calculatedProfit = inv.totalExpectedReturn;
//           }
//         }

//         // --- CALCULATE DAYS LEFT ---
//         if (inv.endDate) {
//           const timeLeftMs = new Date(inv.endDate).getTime() - now;
//           daysLeft = timeLeftMs > 0 ? Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24)) : 0;
//         }

//       } else if (inv.status === "COMPLETED") {
//         calculatedProfit = inv.totalExpectedReturn || inv.totalEarned;
//       }
//       // ---------------------------------------

//       return {
//         ...inv,
//         // Fallback injection for UI matching whatever keys your frontend reads
//         totalEarned: calculatedProfit,
//         currentProfit: calculatedProfit, 
//         daysLeft: daysLeft,
        
//         // UI Helper tags to let the frontend render clean visual badges
//         investmentType: isMarketTrade ? "MARKET_TERMINAL" : "FIXED_PLAN",
        
//         // Standardized Asset Name / Target Label
//         displayName: isMarketTrade 
//           ? `${inv.assetSymbol} (${inv.assetType})` 
//           : inv.planId?.name || "Fixed Plan Asset",
          
//         // Standardized Display Rate
//         displayROI: isMarketTrade 
//           ? `${((inv.dailyProfit / inv.amount) * 100).toFixed(2)}% Daily`
//           : `${inv.planId?.roiPercentage || 0}% Total`
//       };
//     });

//     return corsResponse(standardizedRequests, 200, req);
    
//   } catch (error: any) {
//     console.error("GET_INVESTMENT_REQUESTS_ERROR:", error);
//     return corsResponse({ error: "Failed to fetch platform asset requests" }, 500, req);
//   }
// }



