import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";
import { AdminWalletAddress } from "@/lib/models/WalletAddress";

// Handle preflight CORS requests automatically
export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * 📋 GET: Fetch All Platform Wallets (Admin Control View)
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Admin Authorization Guard — Pass req directly to extract session data safely
    const session = await auth(req);
 
      if (!session) {
      return corsResponse({ error: "Forbidden: Authentication  required" }, 403, req);
    }

    await connectDB();

    // 2. Fetch all configuration vectors sorted chronologically
    const globalWallets = await AdminWalletAddress.find({})
      .sort({ createdAt: -1 })
      .lean();

    return corsResponse(globalWallets, 200, req);
  } catch (error: any) {
    console.log("ADMIN_GET_WALLETS_ERROR:", error);
    return corsResponse({ error: error.message || "Failed to retrieve addresses" }, 500, req);
  }
}

/**
 * 🚀 POST: Authorize New Payment Target Destination
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Admin Authorization Guard — Pass req directly to extract session data safely
    const session = await auth(req);
    if (!session || session?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden: Administrative access required" }, 403, req);
    }

    await connectDB();

    // 2. Extract configuration safely from body payload
    const body = await req.json();
    const { name, address, network, isActive } = body;

    // 3. Structural Validation Checks
    if (!name || !address || !network) {
      return corsResponse({ error: "Missing required configuration fields (name, address, or network)" }, 400, req);
    }

    // 4. Duplicate Check (using exact trim targets matching model index rules)
    const normalizedName = name.trim();
    const assetExists = await AdminWalletAddress.findOne({ name: normalizedName });
    if (assetExists) {
      return corsResponse({ error: "A payment infrastructure node with this identifier name already exists" }, 400, req);
    }

    // 5. Commit to Database Collections
    const newSystemWallet = await AdminWalletAddress.create({
      name: normalizedName,
      address: address.trim(),
      network: network.trim().toUpperCase(),
      isActive: isActive !== undefined ? isActive : true,
    });

    return corsResponse({
      success: true,
      message: "Global inbound wallet registry initialized successfully",
      wallet: newSystemWallet,
    }, 201, req);

  } catch (error: any) {
    console.error("ADMIN_CREATE_WALLET_CRASH:", error);

    // Capture standard Mongoose Validation Errors or Unique Index Conflicts safely
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return corsResponse({ error: messages.join(", ") }, 400, req);
    }
    
    if (error.code === 11000) {
      return corsResponse({ error: "A wallet address with this property already exists in database indices." }, 400, req);
    }

    return corsResponse({ error: "Internal operational failure while generating wallet profile" }, 500, req);
  }
}