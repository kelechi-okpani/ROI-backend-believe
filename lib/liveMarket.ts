// lib/marketEngine.ts
import axios from "axios";
import { connectDB } from "@/lib/db";
import { Market } from "@/lib/models/Market";

const API_KEY = process.env.FINNHUB_API_KEY || "d7gsak1r01qmqj46iadgd7gsak1r01qmqj46iae0";

const STOCK_SYMBOLS = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN"];
const CRYPTO_SYMBOLS = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "BINANCE:SOLUSDT", "BINANCE:XRPUSDT", "BINANCE:BNBUSDT"];

async function updateMarket({ symbol, price, assetType }: { symbol: string; price: number; assetType: "STOCK" | "CRYPTO" }) {
  try {
    if (!price || isNaN(price)) return;

    await connectDB();
    const existing = await Market.findOne({ symbol });

    const previousPrice = existing?.price || price;
    const change = price - previousPrice;
    const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;
    const direction = change > 0 ? "UP" : change < 0 ? "DOWN" : "NEUTRAL";

    await Market.findOneAndUpdate(
      { symbol },
      {
        symbol,
        assetType,
        price,
        previousPrice,
        change,
        changePercent,
        direction,
        marketStatus: "OPEN",
        timestamp: Math.floor(Date.now() / 1000),
        lastUpdatedAt: new Date(),
      },
      { upsert: true }
    );
  } catch (error) {
    console.error(`❌ UPDATE_ERROR ${symbol}:`, error);
  }
}

async function fetchQuote(symbol: string, assetType: "STOCK" | "CRYPTO") {
  try {
    const response = await axios.get("https://finnhub.io/api/v1/quote", {
      params: { symbol, token: API_KEY },
    });

    if (!response.data || !response.data.c) return;

    await updateMarket({
      symbol,
      price: Number(response.data.c),
      assetType,
    });
  } catch (error) {
    console.error(`❌ FETCH_ERROR ${symbol}:`, error);
  }
}

// This function gets called exactly once per minute by Vercel
export async function pulseMarketIndexUpdate() {
  for (const symbol of STOCK_SYMBOLS) await fetchQuote(symbol, "STOCK");
  for (const symbol of CRYPTO_SYMBOLS) await fetchQuote(symbol, "CRYPTO");
}