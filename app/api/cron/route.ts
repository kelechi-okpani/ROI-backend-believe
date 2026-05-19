import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Investment } from "@/lib/models/Investment";
import { Wallet } from "@/lib/models/Wallet";

export async function GET(req: Request) {
  // 1. Verify Cron Secret to prevent public execution
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();

    // 2. Find all Active investments that haven't expired
    const activeInvestments = await Investment.find({ 
      status: "ACTIVE",
      endDate: { $gt: new Date() } 
    });

    const results = {
      payoutsProcessed: 0,
      matured: 0
    };

    for (const inv of activeInvestments) {
      // Logic: Credit the daily profit to the user's Profit Balance
      await Wallet.updateOne(
        { userId: inv.userId },
        { $inc: { profitBalance: inv.dailyProfit } }
      );

      inv.totalEarned += inv.dailyProfit;
      inv.lastPayoutDate = new Date();
      
      // 3. Handle Maturity
      if (new Date() >= inv.endDate) {
        inv.status = "COMPLETED";
        results.matured++;
      }

      await inv.save();
      results.payoutsProcessed++;
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ error: "Cron execution failed" }, { status: 500 });
  }
}