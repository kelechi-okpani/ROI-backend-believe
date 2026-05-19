

// BACKEND (Port 3001) - middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getCorsHeaders } from "@/lib/cors";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");

  // 1. Instantly resolve preflight options safely
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin) as any,
    });
  }

  // 2. Allow all API requests to flow through cleanly to routes
  const response = NextResponse.next();
  
  Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};