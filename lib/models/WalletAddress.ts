import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminWalletAddress extends Document {
  name: string;         // e.g., "Bitcoin (BTC) - Main", "USDT (TRC20)"
  address: string;      // The actual blockchain address string
  network: string;      // e.g., "ERC20", "TRC20", "Native Bitcoin"
  isActive: boolean;    // To toggle visibility on the client frontend
  createdAt: Date;
  updatedAt: Date;
}

const AdminWalletAddressSchema: Schema<IAdminWalletAddress> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Wallet naming identifier is required"],
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      required: [true, "Blockchain public address sequence is required"],
      trim: true,
    },
    network: {
      type: String,
      required: [true, "Target blockchain network protocol specification is required"],
      trim: true,
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AdminWalletAddress: Model<IAdminWalletAddress> =
  mongoose.models.AdminWalletAddress ||
  mongoose.model<IAdminWalletAddress>("AdminWalletAddress", AdminWalletAddressSchema);