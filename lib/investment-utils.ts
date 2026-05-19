export const calculateDailyROI = (amount: number, roi: number, days: number) => {
  // Example: 10% ROI on $1000 = $100 profit. 
  // Total Return = $1100.
  // Daily Profit = $100 / days.
  const totalProfit = (amount * roi) / 100;
  const totalExpectedReturn = amount + totalProfit;
  const dailyProfit = totalProfit / days;

  return {
    dailyProfit: parseFloat(dailyProfit.toFixed(2)),
    totalExpectedReturn: parseFloat(totalExpectedReturn.toFixed(2))
  };
};