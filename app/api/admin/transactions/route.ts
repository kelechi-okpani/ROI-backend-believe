import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth(req);
    
    if (!session || session?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden" }, 403, req);
    }

    await connectDB();

    // Fetch pending transactions and populate user details
    const pendingTransactions = await Transaction.find({ })
    // const pendingTransactions = await Transaction.find({ status: "PENDING" })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return corsResponse(pendingTransactions, 200, req);

  } catch (error) {
    console.error("GET_PENDING_TRANSACTIONS_ERROR:", error);
    return corsResponse({ error: "Failed to fetch transactions" }, 500, req);
  }
}