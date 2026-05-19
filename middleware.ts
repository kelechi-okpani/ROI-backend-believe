// // BACKEND (Port 3001) - middleware.ts
// import { NextRequest, NextResponse } from "next/server";
// import { decode } from "next-auth/jwt";
// import { getCorsHeaders } from "@/lib/cors";

// export async function middleware(req: NextRequest) {
//   const origin = req.headers.get("origin");

//   // 1. Handle OPTIONS preflight requests quickly
//   if (req.method === "OPTIONS") {
//     return new NextResponse(null, {
//       status: 204,
//       headers: getCorsHeaders(origin),
//     });
//   }

//   const { pathname } = req.nextUrl;
  
//   // Define which paths you want to protect globally
//   const isProtectedRoute = pathname.startsWith("/api/user/") || pathname.startsWith("/api/protected");

//   if (isProtectedRoute) {
//     // 2. Extract NextAuth cookie cross-origin variants from Port 3000
//     const sessionToken = 
//       req.cookies.get("authjs.session-token")?.value || 
//       req.cookies.get("next-auth.session-token")?.value ||
//       req.cookies.get("__Secure-authjs.session-token")?.value;

//     if (!sessionToken) {
//       return NextResponse.json(
//         { message: "Unauthorized: Missing Session Token" },
//         { status: 401, headers: getCorsHeaders(origin) }
//       );
//     }

//     try {
//       // 3. Manually decrypt the token with your shared secret
//       const decoded = await decode({
//         token: sessionToken,
//         secret: process.env.AUTH_SECRET!,
//         salt: ""
//       });

//       if (!decoded || !decoded.id) {
//         return NextResponse.json(
//           { message: "Unauthorized: Invalid or expired session" },
//           { status: 401, headers: getCorsHeaders(origin) }
//         );
//       }

//       // Optional: Pass the userId forward to your routes by altering request headers
//       const requestHeaders = new Headers(req.headers);
//       requestHeaders.set("x-user-id", decoded.id);
//       requestHeaders.set("x-user-role", decoded.role);

//       const response = NextResponse.next({
//         request: { headers: requestHeaders },
//       });

//       // Inject CORS headers onto the successful response chain
//       Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
//         response.headers.set(key, value);
//       });
//       return response;

//     } catch (error) {
//       return NextResponse.json(
//         { message: "Unauthorized: Decryption failed" },
//         { status: 401, headers: getCorsHeaders(origin) }
//       );
//     }
//   }

//   // 4. Default fallthrough path for public endpoints (like /api/auth/login)
//   const response = NextResponse.next();
//   Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
//     response.headers.set(key, value);
//   });
//   return response;
// }

// export const config = {
//   // Capture all API traffic to ensure clean CORS application
//   matcher: ["/api/:path*"],
// };

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