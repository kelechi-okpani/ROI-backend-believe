// import { NextRequest } from "next/server";
// import bcrypt from "bcryptjs";
// import { connectDB } from "@/lib/db";
// import { User } from "@/lib/models/User";
// import { corsResponse, corsOptionsResponse } from "@/lib/cors";

// export async function OPTIONS(request: NextRequest) {
//   return corsOptionsResponse(request.headers.get("origin"));
// }

// export async function POST(req: NextRequest) {
//   try {
//     await connectDB();
//     const { email, password } = await req.json();

//     if (!email || !password) {
//       return corsResponse({ message: "Email and password are required" }, 400, req);
//     }

//     const user = await User.findOne({ email: email.toLowerCase() });

//     if (!user || !user.password) {
//       return corsResponse({ message: "Invalid email or password" }, 401, req);
//     }

//     const isValid = await bcrypt.compare(password, user.password);

//     if (!isValid) {
//       return corsResponse({ message: "Invalid email or password" }, 401, req);
//     }

//     // Return pure JSON user payload back to the frontend's authorize() fetcher
//     return corsResponse({
//       id: user._id.toString(),
//       firstName: user.firstName,
//       lastName: user.lastName,
//       email: user.email,
//       role: user.role,
//     }, 200, req);

//   } catch (error) {
//     console.error("BACKEND_LOGIN_ERROR:", error);
//     return corsResponse({ message: "Internal server error" }, 500, req);
//   }
// }


import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";



export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const user = await User.findOne({
      email: body.email,
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(
      body.password,
      user.password
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.AUTH_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token,
    });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}