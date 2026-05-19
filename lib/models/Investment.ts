// BACKEND (Port 3001) - lib/models/Investment.ts
import mongoose, { Schema, model, models } from "mongoose";

const InvestmentSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  planId: { 
    type: Schema.Types.ObjectId, 
    ref: "InvestmentPlan", 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  imageUrl: { 
    type: String 
  }, // ADDED: Snapshotted asset graphic URL for user's portfolio layouts
  dailyProfit: { 
    type: Number, 
    required: true 
  }, // Pre-calculated based on ROI %
  totalExpectedReturn: { 
    type: Number, 
    required: true 
  }, // Principal + total computed ROI
  totalEarned: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"], 
    default: "PENDING" 
  },
  approvedAt: { 
    type: Date 
  }, // Cron calculation trigger starts exactly from this point
  endDate: { 
    type: Date 
  },
  lastPayoutDate: { 
    type: Date 
  },
}, { timestamps: true });

export const Investment = models.Investment || model("Investment", InvestmentSchema);
