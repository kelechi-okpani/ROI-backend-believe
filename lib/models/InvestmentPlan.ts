// BACKEND (Port 3001) - lib/models/InvestmentPlan.ts
import mongoose, { Schema, model, models } from "mongoose";

export interface IInvestmentPlan {
  name: string;
  minAmount: number;
  maxAmount: number;
  roiPercentage: number; // e.g. 15 for 15% total ROI
  durationDays: number;
  isActive: boolean;
  description: string;
  imageUrl: string; // ADDED: Direct support for marketplace graphics
  category: "STARTER" | "PRO" | "PREMIUM" | "VIP" | "MEGAPACK_SOLAR" | "ROBOTAXI_FLEET"; // MODIFIED
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentPlanSchema = new Schema<IInvestmentPlan>(
  {
    name: { 
      type: String, 
      required: [true, "Please provide a name for the investment plan"], 
      unique: true,
      trim: true 
    },
    minAmount: { 
      type: Number, 
      required: [true, "Minimum investment amount is required"],
      min: [0, "Amount cannot be negative"]
    },
   maxAmount: { 
      type: Number, 
      required: [true, "Maximum investment amount is required"],
      validate: {
        // ⚡️ FIX: Safely retrieve context validation fallback properties to prevent serverless execution crashes
        validator: function(this: any, value: number) {
          const doc = this?.getUpdate ? this.getUpdate().$set : this;
          if (!doc || doc.minAmount === undefined) return true; 
          return value >= doc.minAmount;
        },
        message: "Maximum amount must be greater than or equal to minimum amount"
      }
    },
    roiPercentage: { 
      type: Number, 
      required: [true, "ROI percentage is required"],
      min: [0.1, "ROI must be at least 0.1%"]
    },
    durationDays: { 
      type: Number, 
      required: [true, "Duration in days is required"],
      min: [1, "Duration must be at least 1 day"]
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    description: { 
      type: String, 
      trim: true 
    },
   imageUrl: {
      type: String,
      required: true,
      trim: true,
      default: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60"
    },
    category: {
      type: String,
      enum: ["STARTER", "PRO", "PREMIUM", "VIP", "MEGAPACK_SOLAR", "ROBOTAXI_FLEET"],
      default: "STARTER"
    }
  },
  { timestamps: true }
);

if (models.InvestmentPlan) {
  delete (mongoose as any).models.InvestmentPlan;
}

export const InvestmentPlan = models.InvestmentPlan || model<IInvestmentPlan>("InvestmentPlan", InvestmentPlanSchema);