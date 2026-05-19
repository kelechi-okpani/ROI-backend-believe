import mongoose, { Schema, model, models } from "mongoose";

const WalletSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", // Must exactly match your User model registration name
    required: true, 
    unique: true 
  },
  balance: { type: Number, default: 0, min: 0 },
  profitBalance: { type: Number, default: 0, min: 0 },
  referralBalance: { type: Number, default: 0, min: 0 },
  totalDeposited: { type: Number, default: 0, min: 0 },
  totalWithdrawn: { type: Number, default: 0, min: 0 },
  totalInvested: { type: Number, default: 0, min: 0 },
}, { 
  timestamps: true,
  collection: "wallets" // Forces strict target mapping to your collection name
});

export const Wallet = models.Wallet || model("Wallet", WalletSchema);