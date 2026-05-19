import mongoose, {
  Schema,
  model,
  models,
} from "mongoose";

const MarketSchema = new Schema(
  {
    symbol: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
    },

    assetType: {
      type: String,

      enum: [
        "CRYPTO",
        "STOCK",
        "ETF",
        "INDEX",
      ],

      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    previousPrice: {
      type: Number,
      default: 0,
    },

    change: {
      type: Number,
      default: 0,
    },

    changePercent: {
      type: Number,
      default: 0,
    },

    direction: {
      type: String,

      enum: [
        "UP",
        "DOWN",
        "NEUTRAL",
      ],

      default: "NEUTRAL",
    },

    marketStatus: {
      type: String,

      enum: [
        "OPEN",
        "CLOSED",
      ],

      default: "OPEN",
    },

    timestamp: {
      type: Number,
      required: true,
      default: () =>
        Math.floor(Date.now() / 1000),
    },

    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },

  {
    timestamps: true,
  }
);

export const Market =
  models.Market ||
  model("Market", MarketSchema);