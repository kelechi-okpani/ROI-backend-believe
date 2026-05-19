import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return corsResponse({ message: "Email and password are required" }, 400, req);
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.password) {
      return corsResponse({ message: "Invalid email or password" }, 401, req);
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return corsResponse({ message: "Invalid email or password" }, 401, req);
    }

    // Return pure JSON user payload back to the frontend's authorize() fetcher
    return corsResponse({
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    }, 200, req);

  } catch (error) {
    console.error("BACKEND_LOGIN_ERROR:", error);
    return corsResponse({ message: "Internal server error" }, 500, req);
  }
}

// import { NextRequest, NextResponse } from "next/server";
// import { signIn } from "@/lib/auth";
// import { AuthError } from "next-auth";
// import { corsOptionsResponse, corsResponse } from "@/lib/cors";
// import bcrypt from "bcryptjs";
// import { User } from "@/lib/models/User";
// import { connectDB } from "@/lib/db";

// export async function OPTIONS(request: NextRequest) {
//   return corsOptionsResponse(request.headers.get("origin"));
// }

// export async function POST(request: Request) {
//   try {
//     await connectDB();
//     const { email, password } = await request.json();

//     if (!email || !password) {
//       return NextResponse.json({ message: "Missing credentials" }, { status: 400 });
//     }

//     const user = await User.findOne({ email: email.toLowerCase() });

//     if (!user || !user.password) {
//       return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
//     }

//     const isValid = await bcrypt.compare(password, user.password);

//     if (!isValid) {
//       return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
//     }

//     // Return pure data back to the Frontend (Port 3000)
//     return NextResponse.json({
//       id: user._id.toString(),
//       firstName: user.firstName,
//       lastName: user.lastName,
//       email: user.email,
//       role: user.role,
//     }, { status: 200 });

//   } catch (error) {
//     return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
//   }
// }


// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { email, password } = body;

//     if (!email || !password) {
//       return corsResponse({ error: "Email and password required" }, 400, req);
//     }

//     // This triggers the authorize callback in lib/auth.ts
//     // Note: NextAuth v5 (Auth.js) signIn can sometimes throw redirects even with redirect: false
//     await signIn("credentials", {
//       email,
//       password,
//       redirect: false,
//     });

//     return corsResponse({ message: "Login successful" }, 200, req);

//   } catch (error) {
//     if (error instanceof AuthError) {
//       switch (error.type) {
//         case "CredentialsSignin":
//           return corsResponse({ error: "Invalid credentials" }, 401, req);
//         default:
//           return corsResponse({ error: "Authentication failed" }, 500, req);
//       }
//     }
    
//     // Catch-all for non-auth errors (like database connection issues)
//     console.error("Login Error:", error);
//     return corsResponse({ error: "Internal Server Error" }, 500, req);
//   }
// }