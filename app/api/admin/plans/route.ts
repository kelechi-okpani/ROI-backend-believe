import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { InvestmentPlan } from "@/lib/models/InvestmentPlan";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";

// Handle preflight CORS requests automatically
export async function OPTIONS(request: NextRequest) {
  return corsOptionsResponse(request.headers.get("origin"));
}

/**
 * 📋 GET: Fetch ALL Investment Plans (Admin View)
 * Unlike the public user endpoint, this returns both active AND inactive plans
 * so administrators can edit or toggle them from their control panel.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Admin Authorization Guard
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden: Administrative access required" }, 403, req);
    }

    await connectDB();

    // 2. Fetch all plans sorted by category and minimum amount
    const allPlans = await InvestmentPlan.find({})
      .sort({ category: 1, minAmount: 1 })
      .lean();

    return corsResponse(allPlans, 200, req);
  } catch (error: any) {
    console.error("ADMIN_GET_PLANS_ERROR:", error);
    return corsResponse({ error: error.message || "Failed to retrieve plans" }, 500, req);
  }
}

/**
 * 🚀 POST: Create a New Investment Plan
 * Admins can submit plan details, including Tesla categories and custom image paths.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Admin Authorization Guard
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return corsResponse({ error: "Forbidden: Administrative access required" }, 403, req);
    }

    await connectDB();

    // 2. Extract configuration from body payload
    const body = await req.json();
    const { 
      name, 
      minAmount, 
      maxAmount, 
      roiPercentage, 
      durationDays, 
      category, 
      description, 
      imageUrl, // Caught cleanly from client
      isActive 
    } = body;

    // 3. Structural Validation Checks
    if (!name || !imageUrl || minAmount === undefined || maxAmount === undefined || !roiPercentage || !durationDays) {
      return corsResponse({ error: "Missing required fields to compile a plan profile" }, 400, req);
    }

    if (Number(maxAmount) < Number(minAmount)) {
      return corsResponse({ error: "Maximum investment cap cannot sit below the minimum entry floor" }, 400, req);
    }

    // 4. Duplicate Plan Check
    const planExists = await InvestmentPlan.findOne({ name: name.trim() });
    if (planExists) {
      return corsResponse({ error: "An investment package with this name already exists" }, 400, req);
    }

    console.log("Received imageUrl from client:", imageUrl); // Debug log to verify incoming image URL

    // 5. Commit to Database Collections
    // We trim and verify imageUrl exists. If it's empty/missing, we pass the default fallback placeholder.


    const newPlan = await InvestmentPlan.create({
      name: name.trim(),
      minAmount: Number(minAmount),
      maxAmount: Number(maxAmount),
      roiPercentage: Number(roiPercentage),
      durationDays: Number(durationDays),
      category: category || "STARTER",
      description: description?.trim() || "",
      imageUrl:  imageUrl || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60",
      isActive: isActive !== undefined ? isActive : true
    });

    return corsResponse({ 
      success: true, 
      message: "Investment package created and deployed successfully", 
      plan: newPlan 
    }, 201, req);

  } catch (error: any) {
    console.error("ADMIN_CREATE_PLAN_CRASH:", error);
    
    // Catch Mongoose validation constraints gracefully if skipped by front checks
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return corsResponse({ error: messages.join(", ") }, 400, req);
    }

    return corsResponse({ error: "Internal operational failure while generating plan" }, 500, req);
  }
}