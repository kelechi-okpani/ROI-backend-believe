
export const calculateDailyROI = (
  amount: number,
  roiPercentage: number,
  durationDays: number
) => {
  /**
   * ROI Example
   *
   * Amount = 7500
   * ROI = 39.9%
   *
   * Profit = 2992.5
   * Total Return = 10492.5
   * Daily Profit = 99.75
   */

  // Safety Validation
  if (!amount || amount <= 0) {
    throw new Error("Invalid investment amount");
  }

  if (!roiPercentage || roiPercentage <= 0) {
    throw new Error("Invalid ROI percentage");
  }

  if (!durationDays || durationDays <= 0) {
    throw new Error("Invalid investment duration");
  }

  // Convert to cents to avoid floating precision errors
  const amountInCents = Math.round(amount * 100);

  /**
   * TOTAL ROI PROFIT
   *
   * Example:
   * 7500 * 39.9%
   */
  const totalProfitInCents = Math.round(
    (amountInCents * roiPercentage) / 100
  );

  /**
   * TOTAL FINAL RETURN
   *
   * Principal + Profit
   */
  const totalExpectedReturnInCents =
    amountInCents + totalProfitInCents;

  /**
   * DAILY PROFIT
   */
  const dailyProfitInCents = Math.round(
    totalProfitInCents / durationDays
  );

  return {
    /**
     * Original Amount
     */
    amount: Number((amountInCents / 100).toFixed(2)),

    /**
     * Pure ROI Profit
     * Example: 2992.5
     */
    totalProfit: Number(
      (totalProfitInCents / 100).toFixed(2)
    ),

    /**
     * Principal + Profit
     * Example: 10492.5
     */
    totalExpectedReturn: Number(
      (
        totalExpectedReturnInCents / 100
      ).toFixed(2)
    ),

    /**
     * Profit per day
     * Example: 99.75
     */
    dailyProfit: Number(
      (dailyProfitInCents / 100).toFixed(2)
    ),

    /**
     * Metadata
     */
    roiPercentage,

    durationDays,
  };
};

// export const calculateDailyROI = (amount: number, roi: number, days: number) => {
//   // Use integer cents to prevent floating-point precision issues
//   const amountInCents = Math.round(amount * 100);
//   const totalProfitInCents = Math.round((amountInCents * roi) / 100);
  
//   const dailyProfit = (totalProfitInCents / days) / 100;
//   const totalExpectedReturn = (amountInCents + totalProfitInCents) / 100;

//   return {
//     dailyProfit: Number(dailyProfit.toFixed(2)),
//     totalExpectedReturn: Number(totalExpectedReturn.toFixed(2))
//   };
// };