import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { Wallet } from "@/lib/models/Wallet";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    // 1. Admin Authorization Guard
    const session = await auth(req);
    if (!session || session?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden: Administrative authentication required" }, 403, req);
    }

    const { id } = await params;
    if (!id) return corsResponse({ error: "Missing required transaction ID" }, 400, req);

    await connectDB();
    const { action } = await req.json(); // "APPROVE" or "REJECT"

    // 2. Locate PENDING transaction ledger entry
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return corsResponse({ error: "Transaction record not found" }, 404, req);
    }
    
    if (transaction.status !== "PENDING") {
      return corsResponse({ error: "Transaction has already been processed" }, 400, req);
    }

    // 3. Execution Action Matrices
    if (action === "APPROVE") {
      transaction.status = "COMPLETED";
      
      // DEPOSIT: Balance increases ONLY when approved by an admin
      if (transaction.type === "DEPOSIT") {
        await Wallet.updateOne(
          { userId: transaction.userId },
          { $inc: { balance: transaction.amount } }
        );
      }
      // Note: WITHDRAWAL funds are already subtracted from balance at submission to prevent double-spending.
      
    } else if (action === "REJECT") {
      transaction.status = "REJECTED";

      // WITHDRAWAL REJECTION: Refund the capital assets securely back to their active wallet balance
      if (transaction.type === "WITHDRAWAL") {
        await Wallet.updateOne(
          { userId: transaction.userId },
          { $inc: { balance: transaction.amount } }
        );
      }
      // Note: DEPOSIT rejection does nothing to balance since the funds were never verified/added.
    } else {
      return corsResponse({ error: "Invalid action parameter configuration" }, 400, req);
    }

    await transaction.save();
    return corsResponse({ message: `Transaction successfully ${action.toLowerCase()}ed` }, 200, req);

  } catch (error: any) {
    console.error("ADMIN_TRANSACTION_PATCH_ERROR:", error);
    return corsResponse({ error: "Internal ledger processing failure" }, 500, req);
  }
}