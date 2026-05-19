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
    // 1. Admin Authorization Check
    const session = await auth(req);
    if (!session || session?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden: Administrative access required" }, 403, req);
    }

    await connectDB();
    const body = await req.json();
    const { userId, amount, type, note } = body;

    // Structural Field Fallback Validation
    if (!userId || amount === undefined || !type) {
      return corsResponse({ error: "Missing required properties (userId, amount, type)" }, 400, req);
    }

    // 2. Validate Type (Prevents accidental updates to sensitive schema fields)
    const validFields = ["balance", "referralBonus", "totalInvested"];
    if (!validFields.includes(type)) {
      return corsResponse({ error: "Invalid adjustment type identifier" }, 400, req);
    }

    // Convert values explicitly to guarantee atomic arithmetic computation
    const parsedAmount = Number(amount);

    // 3. Atomic update to the user's wallet
    const walletUpdate = await Wallet.updateOne(
      { userId },
      { $inc: { [type]: parsedAmount } }
    );

    if (walletUpdate.matchedCount === 0) {
      return corsResponse({ error: "Target user ledger wallet structure not found" }, 404, req);
    }

    // Determine context logging tag based on positive or negative balance delta variables
    const calculatedDirection = parsedAmount >= 0 ? "CREDIT" : "DEBIT";

    // 4. Create Transaction Record
    await Transaction.create({
      userId,
      amount: Math.abs(parsedAmount), // Always store structural financial amounts as absolute positives
      type: "ADJUSTMENT", 
      method: "FUNDING_ADJUSTMENT", 
      status: "COMPLETED",
      description: `Admin manual balance ${calculatedDirection.toLowerCase()} on field: ${type}`,
      adminNote: note || "Manual administrative asset tier adjustment override",
      reference: `ADJ-${Date.now()}`
    });

    return corsResponse({ 
      success: true,
      message: `Successfully executed account ${calculatedDirection.toLowerCase()} of $${Math.abs(parsedAmount).toLocaleString()} to user ${type}` 
    }, 200, req);

  } catch (error: any) {
    console.log("WALLET_ADJUSTMENT_ERROR:", error);
    return corsResponse({ error: "Internal ledger processing pipeline failure" }, 500, req);
  }
}