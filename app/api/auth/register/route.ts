import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Wallet } from "@/lib/models/Wallet";
import { registerSchema } from "@/lib/validations/auth";
import { nanoid } from "nanoid";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  try {
    console.log("1. API Hit");
    await connectDB();
    const body = await req.json();
    console.log("2. Body received:", body);


    // 1. Validation
    const validatedData = registerSchema.parse(body);
    console.log("3. Validation passed");
    const { firstName, lastName, email, password, referralCode } = validatedData;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return corsResponse({ error: "Email already in use" }, 400, req);
    }

    // 2. Hash Password & Create User
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      referralCode: nanoid(8).toUpperCase(),
      referredBy: referralCode || null,
    });

    // 3. Create Wallet
    const newWallet = await Wallet.create({
      userId: newUser._id,
      balance: 0,
      profitBalance: 0,
      referralBalance: 0,
    });

    newUser.wallet = newWallet._id;
    await newUser.save();

    return corsResponse({ message: "User registered successfully" }, 201, req);

  } catch (error: any) {
    if (error.name === "ZodError") {
      return corsResponse({ error: error.errors[0].message }, 400, req);
    }
    console.error("REGISTRATION_ERROR:", error);
    return corsResponse({ error: "Internal Server Error" }, 500, req);
  }
}