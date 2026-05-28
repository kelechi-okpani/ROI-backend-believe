
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { processInvestmentProfits } from "@/lib/scripts/investmentCron";

export async function GET() {
  try {
    await connectDB();

    await processInvestmentProfits();

    return NextResponse.json({
      success: true,
      message: "Investment cron executed",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Cron failed" },
      { status: 500 }
    );
  }
}