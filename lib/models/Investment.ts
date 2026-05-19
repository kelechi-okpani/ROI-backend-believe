
// BACKEND (Port 3001) - lib/models/Investment.ts
import mongoose, { Schema, model, models } from "mongoose";

const InvestmentSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  // CHANGED: Made optional so stock/crypto assets don't require a pre-configured plan document
  planId: { 
    type: Schema.Types.ObjectId, 
    ref: "InvestmentPlan", 
    required: false 
  },
  amount: { 
    type: Number, 
    required: true,
    min: [500, "The minimum investment allocation tier is $500"] // ADDED: $500 hard minimum constraint
  },
  imageUrl: { 
    type: String 
  }, 
  dailyProfit: { 
    type: Number, 
    required: true 
  }, 
  totalExpectedReturn: { 
    type: Number, 
    required: true 
  }, 
  totalEarned: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"], 
    default: "PENDING" 
  },
  
  // ADDED: Specialized metadata vectors for capturing live crypto/stock ticker parameters
  assetSymbol: {
    type: String,
    required: false // Only required if not using a traditional planId
  },
  assetType: {
    type: String,
    enum: ["CRYPTO", "STOCK"],
    required: false
  },
  purchasePriceAtEntry: {
    type: Number,
    required: false
  },

  approvedAt: { 
    type: Date 
  }, 
  endDate: { 
    type: Date 
  },
  lastPayoutDate: { 
    type: Date 
  },
}, { timestamps: true });

export const Investment = models.Investment || model("Investment", InvestmentSchema);


// // BACKEND (Port 3001) - lib/models/Investment.ts
// import mongoose, { Schema, model, models } from "mongoose";

// const InvestmentSchema = new Schema({
//   userId: { 
//     type: Schema.Types.ObjectId, 
//     ref: "User", 
//     required: true 
//   },
//   planId: { 
//     type: Schema.Types.ObjectId, 
//     ref: "InvestmentPlan", 
//     required: true 
//   },
//   amount: { 
//     type: Number, 
//     required: true 
//   },
//   imageUrl: { 
//     type: String 
//   }, // ADDED: Snapshotted asset graphic URL for user's portfolio layouts
//   dailyProfit: { 
//     type: Number, 
//     required: true 
//   }, // Pre-calculated based on ROI %
//   totalExpectedReturn: { 
//     type: Number, 
//     required: true 
//   }, // Principal + total computed ROI
//   totalEarned: { 
//     type: Number, 
//     default: 0 
//   },
//   status: { 
//     type: String, 
//     enum: ["PENDING", "ACTIVE", "COMPLETED", "CANCELLED"], 
//     default: "PENDING" 
//   },
//   approvedAt: { 
//     type: Date 
//   }, // Cron calculation trigger starts exactly from this point
//   endDate: { 
//     type: Date 
//   },
//   lastPayoutDate: { 
//     type: Date 
//   },
// }, { timestamps: true });

// export const Investment = models.Investment || model("Investment", InvestmentSchema);
