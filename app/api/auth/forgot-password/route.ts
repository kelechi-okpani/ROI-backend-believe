import { NextRequest } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { sendEmail } from "@/services/emailService";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email) {
      return corsResponse({ error: "Email is required" }, 400, req);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Security: Always return success to prevent email harvesting
    if (!user) {
      return corsResponse({ 
        message: "If an account matches that email, a reset link has been sent." 
      }, 200, req);
    }

    // Generate and Hash Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password for your Investment Account.</p>
        <p>Please click the button below to set a new password. This link expires in 60 minutes.</p>
        <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      text: `Reset your password here: ${resetUrl}`,
      html: emailHtml,
    });

    return corsResponse({ message: "Reset link sent successfully." }, 200, req);

  } catch (error: any) {
    console.error("FORGOT_PASSWORD_ERROR:", error);
    return corsResponse({ error: "Internal server error. Please try again later." }, 500, req);
  }
}