import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth(req);
    
    if (!session || session?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden" }, 403, req);
    }

    await connectDB();

    const usersWithWallets = await User.aggregate([
      { $match: { role: { $ne: "SUPER_ADMIN" } } },
      { $sort: { createdAt: -1 } },
      {
        $project: { password: 0 } // Exclude password hashes safely
      },
      {
        $lookup: {
          from: "wallets",         // Make sure this matches your exact MongoDB collection name
          localField: "_id",
          foreignField: "userId",
          as: "wallet"
        }
      },
      {
        // $lookup returns an array. This flattens it to an object or sets it to null if empty
        $addFields: {
          wallet: { $ifNull: [{ $arrayElemAt: ["$wallet", 0] }, null] }
        }
      }
    ]);

    return corsResponse(usersWithWallets, 200, req);

  } catch (error) {
    console.error("GET_USERS_ERROR:", error);
    return corsResponse({ error: "Failed to fetch users" }, 500, req);
  }
}