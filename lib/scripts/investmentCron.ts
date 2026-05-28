import { Investment } from "@/lib/models/Investment";


export async function processInvestmentProfits() {
  try {
    const now = new Date();

    const activeInvestments = await Investment.find({
      status: "ACTIVE",
    });

    for (const inv of activeInvestments) {
      if (!inv.lastPayoutDate) {
        inv.lastPayoutDate = now;
        await inv.save();
        continue;
      }

      const hoursPassed =
        (now.getTime() - new Date(inv.lastPayoutDate).getTime()) /
        (1000 * 60 * 60);

      // not time yet
      if (hoursPassed < 24) continue;

      // 🔥 SAFE ADDITION (avoid NaN / overflows)
      const newTotal = (inv.totalEarned || 0) + (inv.dailyProfit || 0);

      inv.totalEarned = Math.min(
        newTotal,
        inv.totalExpectedReturn
      );

      inv.lastPayoutDate = now;

      // auto complete
      if (inv.totalEarned >= inv.totalExpectedReturn) {
        inv.status = "COMPLETED";
      }

      await inv.save();
    }

    console.log("Investment profits processed.");
  } catch (error) {
    console.error("CRON_INVESTMENT_ERROR:", error);
  }
}