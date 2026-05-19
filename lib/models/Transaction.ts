import mongoose, { Schema, model, models } from "mongoose";

const TransactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  address: { type: String, required: true },
  method: { type: String, required: true },
  type: { type: String, enum: ["DEPOSIT", "WITHDRAWAL", "ROI", "REFERRAL", "ADJUSTMENT"], required: true },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"], default: "PENDING" },
  paymentProof: { type: String }, // Cloudinary URL
  reference: { type: String, unique: true },
  adminNote: { type: String },
}, { timestamps: true });

export const Transaction = models.Transaction || model("Transaction", TransactionSchema);