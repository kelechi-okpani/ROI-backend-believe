import { NextRequest } from "next/server";
import { Transaction } from "@/lib/models/Transaction";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";


export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}



export async function POST(req: NextRequest) {
  try {
    // 1. Session & Auth Check
    const session = await auth(req);
    if (!session || !session?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();
    const { amount, paymentProof, method, address } = await req.json();

    // 2. Input Validation
    if (!amount || amount <= 0) {
      return corsResponse({ error: "A valid deposit amount is required" }, 400, req);
    }

    if (!paymentProof) {
      return corsResponse({ error: "Payment proof is required" }, 400, req);
    }

    // 3. Create Pending Deposit Transaction
    const deposit = await Transaction.create({
      userId: session?.id,
      amount,
      type: "DEPOSIT",
      status: "PENDING",
      paymentProof, // URL from Cloudinary/Upload provider
      address,
      method,
      reference: `DEP-${Date.now()}`
    });

    // 4. Success Response
    return corsResponse(
      { message: "Deposit submitted for review", deposit }, 
      201, 
      req
    );

  } catch (error) {
    console.error("DEPOSIT_REQUEST_ERROR:", error);
    return corsResponse({ error: "Deposit request failed" }, 500, req);
  }
}