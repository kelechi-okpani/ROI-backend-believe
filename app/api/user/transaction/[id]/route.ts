import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { Wallet } from "@/lib/models/Wallet";
import { corsResponse } from "@/lib/cors";

// ⚡️ FIX: Define params as a Promise for Next.js 15 compliance
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden: Administrative access required" }, 403, req);
    }

    // ⚡️ FIX: Unpack dynamic layout identifiers from the parameters Promise
    const { id } = await params;
    if (!id) return corsResponse({ error: "Missing transaction identifier parameter" }, 400, req);

    await connectDB();
    const { action } = await req.json(); // "APPROVE" or "REJECT"

    if (action !== "APPROVE" && action !== "REJECT") {
      return corsResponse({ error: "Invalid execution action flag provided" }, 400, req);
    }

    // Determine target mutation updates before writing state changes
    const targetStatus = action === "APPROVE" ? "COMPLETED" : "REJECTED";

    // 🛡️ RACE CONDITION SAFE GUARD: Atomically isolate and intercept the document ONLY if it remains 'PENDING'
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, status: "PENDING" },
      { $set: { status: targetStatus } },
      { new: true } // Emits updated record state out immediately
    );

    if (!transaction) {
      return corsResponse({ error: "Invalid transaction record, or document has already been processed" }, 400, req);
    }

    const userId = transaction.userId;

    // 💼 TRANSACTION PROCESSING MATRIX
    if (transaction.type === "DEPOSIT") {
      if (action === "APPROVE") {
        // CREDIT USER: On approval, add to main balance
        await Wallet.updateOne(
          { userId },
          { $inc: { balance: transaction.amount } }
        );
      }
    } 
    else if (transaction.type === "WITHDRAWAL") {
      if (action === "REJECT") {
        // REFUND USER: Rejected, return capital assets safely back to profitBalance
        await Wallet.updateOne(
          { userId },
          { $inc: { profitBalance: transaction.amount } }
        );
      }
      // Note: Withdrawal approval requires no balancing actions since assets were secured during request creation
    }

    // Return the modified transaction layout document for explicit client-side RTK query cache synchronization
    return corsResponse(transaction, 200, req);
    
  } catch (error) {
    console.error("PATCH_TRANSACTION_ERROR:", error);
    return corsResponse({ error: "Internal ledger processing failure" }, 500, req);
  }
}