import { Wallet } from "@/lib/models/Wallet";
import { Transaction } from "@/lib/models/Transaction";

/**
 * Updates a user's wallet and creates an audit trail entry.
 */

export async function updateWalletBalance(
  userId: string, 
  amount: number, 
  type: "balance" | "profitBalance" | "referralBalance",
  transactionType: "DEPOSIT" | "WITHDRAWAL" | "ROI" | "REFERRAL"
) {
  // 1. Atomic update of the balance
  const wallet = await Wallet.findOneAndUpdate(
    { userId },
    { $inc: { [type]: amount } },
    { new: true, upsert: true }
  );

  // 2. Create the Ledger (Transaction Record)
  await Transaction.create({
    userId,
    amount: Math.abs(amount),
    type: transactionType,
    status: "COMPLETED",
    reference: `WAL-${Date.now()}`
  });

  return wallet;
}