import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL || "https://roi-frontend-believe.vercel.app",
  "https://roi-frontend-believe.vercel.app",
  "https://roi-frontend-believe.vercel.app/api",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
];

export function getCorsHeaders(origin: string | null | undefined) {
  let allowedOrigin = ALLOWED_ORIGINS[0];

  if (typeof origin === "string") {
    const isAllowed =
      ALLOWED_ORIGINS.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) ||
      process.env.NODE_ENV === "development";

    if (isAllowed) {
      allowedOrigin = origin;
    }
  }

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    // FIXED: Added Cookie and X-NextAuth-Session-Token to allow session sharing
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Cookie, X-NextAuth-Session-Token",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin", 
  };
}

// export function corsResponse(data: any, status: number = 200, req: Request | NextRequest) {
//   const origin = req.headers.get("origin");
//   const headers = getCorsHeaders(origin);
//   const response = NextResponse.json(data, { status });

//   response.headers.delete("Access-Control-Allow-Origin");

//   Object.entries(headers).forEach(([key, value]) => {
//     response.headers.set(key, value);
//   });

//   return response;
// }

export function corsResponse(data: any, status: number = 200, req: Request | NextRequest) {
  const origin = req.headers.get("origin");
  const headers = getCorsHeaders(origin);
  
  // Directly attach headers inside the initialization object
  const response = NextResponse.json(data, { 
    status,
    headers: headers as any
  });

  return response;
}

export function corsOptionsResponse(origin: string | null | undefined) {
  const headers = getCorsHeaders(origin);
  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

