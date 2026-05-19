import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";


export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * GET handler to verify the API status and Database connectivity.
 */
export async function GET(req: NextRequest) {
      
  try {
    // 1. Check Database Connection
    await connectDB();

    // 2. Return Success Response via CORS helper
    return corsResponse(
      {
        status: "Online",
        message: "Investment Backend API is fully operational",
        timestamp: new Date().toISOString(),
        database: "Connected",
      },
      200,
      req
    );
  } catch (error) {
    console.error("HEALTH_CHECK_ERROR:", error);
    
    // Return error if DB is down but API is up
    return corsResponse(
      {
        status: "Degraded",
        message: "API is running but Database connection failed",
        error: process.env.NODE_ENV === "development" ? error : "Internal Error",
      },
      500,
      req
    );
  }
}


