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
      return corsResponse({ error: "Forbidden: Access Denied" }, 403, req);
    }

    // 2. Establish Database Connection
    await connectDB();

    // 3. Fetch all investment entities with hybrid populations
    // .lean() converts complex documents to blazing fast plain JS objects
    const investments = await Investment.find({})
      .populate("userId", "firstName lastName email")
      .populate("planId", "name roiPercentage durationInDays") // Ensured duration match naming consistency
      .sort({ createdAt: -1 })
      .lean();

    // 4. Transform data inline to standardize outputs for the Admin Panel
    // This gives your frontend table simple fallback fields to render regardless of investment type!
    const standardizedRequests = investments.map((inv: any) => {
      const isMarketTrade = !inv.planId;
      
      return {
        ...inv,
        // UI Helper tags to let the frontend render clean visual badges
        investmentType: isMarketTrade ? "MARKET_TERMINAL" : "FIXED_PLAN",
        
        // Standardized Asset Name / Target Label
        displayName: isMarketTrade 
          ? `${inv.assetSymbol} (${inv.assetType})` 
          : inv.planId?.name || "Fixed Plan Asset",
          
        // Standardized Display Rate
        displayROI: isMarketTrade 
          ? `${((inv.dailyProfit / inv.amount) * 100).toFixed(2)}% Daily`
          : `${inv.planId?.roiPercentage || 0}% Total`
      };
    });

    return corsResponse(standardizedRequests, 200, req);
    
  } catch (error: any) {
    console.error("GET_INVESTMENT_REQUESTS_ERROR:", error);
    return corsResponse({ error: "Failed to fetch platform asset requests" }, 500, req);
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import { Investment } from "@/lib/models/Investment";
// import { corsOptionsResponse, corsResponse } from "@/lib/cors";

// import "@/lib/models/User";
// import "@/lib/models/InvestmentPlan";


// export async function OPTIONS(request: NextRequest) {
//     return corsOptionsResponse(request.headers.get("origin"));
// }

// export async function GET(req: NextRequest) {
//   try {
//     // 1. Admin Authorization Guard — Pass req directly to extract session data safely
//     const session = await auth(req);
    
//     if (!session || session?.role !== "ADMIN") {
//       return corsResponse({ error: "Forbidden: Access Denied" }, 403, req);
//     }

//     // 2. Establish Database Connection
//     await connectDB();

//     // 3. Fetch all investment entities with relational populations
//     // Added .lean() to convert complex Mongoose documents to high-performance plain JSON objects
//     const requests = await Investment.find({})
//       .populate("userId", "firstName lastName email")
//       .populate("planId", "name roiPercentage durationDays")
//       .sort({ createdAt: -1 })
//       .lean();

//     return corsResponse(requests, 200, req);
    
//   } catch (error: any) {
//     console.error("GET_INVESTMENT_REQUESTS_ERROR:", error);
//     return corsResponse({ error: "Failed to fetch platform asset requests" }, 500, req);
//   }
// }