import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { type: String, required: true, minlength: 8 },
    role: { 
      type: String, 
      enum: ["USER", "ADMIN", "SUPER_ADMIN"], 
      default: "USER" 
    },
    phoneNumber: { type: String, trim: true },
    country: { type: String },
    kycStatus: { 
      type: String, 
      enum: ["NOT_SUBMITTED", "PENDING", "VERIFIED", "REJECTED"], 
      default: "VERIFIED" 
    },

    // --- AUTH & SECURITY FIELDS (Add these) ---
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    verificationOtp: { type: String },
    verificationOtpExpires: { type: Date },
    // ------------------------------------------
    
    isEmailVerified: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    referralCode: {
       type: String,
  unique: true,
  sparse: true,},
    referredBy: { type: String }, // Stores the referral code of the inviter
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet" },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);