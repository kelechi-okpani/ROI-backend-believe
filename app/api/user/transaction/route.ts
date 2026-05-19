import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { Wallet } from "@/lib/models/Wallet"; 
import { nanoid } from "nanoid";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth(req);
    if (!session?.id) return corsResponse({ error: "Unauthorized" }, 401, req);

    await connectDB();

    const transactions = await Transaction.find({ userId: session?.id })
      .sort({ createdAt: -1 });

    return corsResponse(transactions, 200, req);
  } catch (error) {
    console.error("GET_TRANSACTIONS_ERROR:", error);
    return corsResponse({ error: "Failed to fetch transactions" }, 500, req);
  }
}



export async function POST(req: NextRequest) {
  try {
    const session = await auth(req);
    
    if (!session || !session?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();
    const { amount, type, paymentProof } = await req.json();

    // 1. Validation
    if (!amount || amount <= 0) {
      return corsResponse({ error: "Invalid amount" }, 400, req);
    }

    // 2. Withdrawal Logic: Debit upfront to avoid double-spending
    if (type === "WITHDRAWAL") {
      const wallet = await Wallet.findOne({ userId: session?.id });
      if (!wallet || wallet.profitBalance < amount) {
        return corsResponse({ error: "Insufficient profit balance" }, 400, req);
      }
      
      // Debit user immediately while request is PENDING
      wallet.profitBalance -= amount;
      await wallet.save();
    }

    // 3. Create the Transaction
    const transaction = await Transaction.create({
      userId: session.id,
      amount,
      type,
      paymentProof: type === "DEPOSIT" ? paymentProof : null,
      reference: `TRX-${nanoid(10).toUpperCase()}`,
      status: "PENDING"
    });

    return corsResponse(transaction, 201, req);
  } catch (error) {
    console.error("TRANSACTION_ERROR:", error);
    return corsResponse({ error: "Transaction failed" }, 500, req);
  }
}