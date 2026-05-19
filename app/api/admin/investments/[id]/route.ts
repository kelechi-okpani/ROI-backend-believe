import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Investment } from "@/lib/models/Investment";
import { Wallet } from "@/lib/models/Wallet";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await mongoose.startSession();
  
  try {
    const authSession = await auth(req);
    if (!authSession || authSession?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden: Access Denied" }, 403, req);
    }

    await connectDB();
    
    const { action } = await req.json(); 
    const { id } = await params;

    if (!id) return corsResponse({ error: "Missing investment ID" }, 400, req);
    if (!["APPROVE", "REJECT"].includes(action)) {
      return corsResponse({ error: "Invalid review action parameter" }, 400, req);
    }

    session.startTransaction();

    const investment = await Investment.findById(id).populate("planId").session(session);
    if (!investment) {
      await session.abortTransaction();
      return corsResponse({ error: "Investment context not found" }, 404, req);
    }

    if (investment.status !== "PENDING") {
      await session.abortTransaction();
      return corsResponse({ error: `Investment already processed as ${investment.status}` }, 400, req);
    }

    if (action === "APPROVE") {
      const durationDays = investment.planId?.durationInDays || 30; // Handled potential typo: durationInDays
      
      investment.status = "ACTIVE";
      investment.approvedAt = new Date();
      investment.endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      investment.lastPayoutDate = new Date(); 
      
      // Increment cumulative tracking totals (capital was already deducted at submission)
      await Wallet.updateOne(
        { userId: investment.userId },
        { $inc: { totalInvested: investment.amount } },
        { session }
      );

      await investment.save({ session });
    } 
    else if (action === "REJECT") {
      investment.status = "CANCELLED";
      
      // REJECTION REFUND: Send the capital back since it was moved at submission
      await Wallet.updateOne(
        { userId: investment.userId },
        { $inc: { balance: investment.amount } }, 
        { session }
      );
      
      await investment.save({ session });
    }

    await session.commitTransaction();
    return corsResponse({ message: `Investment ${action.toLowerCase()}ed successfully` }, 200, req);

  } catch (error: any) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    console.error("PATCH_INVESTMENT_ERROR:", error);
    return corsResponse({ error: error.message || "Internal Server Error" }, 500, req);
  } finally {
    await session.endSession();
  }
}