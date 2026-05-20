export const calculateDailyROI = (amount: number, roi: number, days: number) => {
  // Use integer cents to prevent floating-point precision issues
  const amountInCents = Math.round(amount * 100);
  const totalProfitInCents = Math.round((amountInCents * roi) / 100);
  
  const dailyProfit = (totalProfitInCents / days) / 100;
  const totalExpectedReturn = (amountInCents + totalProfitInCents) / 100;

  return {
    dailyProfit: Number(dailyProfit.toFixed(2)),
    totalExpectedReturn: Number(totalExpectedReturn.toFixed(2))
  };
};