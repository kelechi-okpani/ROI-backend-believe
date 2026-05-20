import { NextRequest } from "next/server";
import { Transaction } from "@/lib/models/Transaction";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { corsOptionsResponse, corsResponse } from "@/lib/cors";
import { createNotification } from "@/lib/notifications"; // Ensure the path matches your project structure

export async function OPTIONS(request: NextRequest) {
    return corsOptionsResponse(request.headers.get("origin"));
}

export async function POST(req: NextRequest) {
  try {
    // 1. Session & Auth Check
    const session = await auth(req);
    if (!session || !session?.id) {
      return corsResponse({ error: "Unauthorized" }, 401, req);
    }

    await connectDB();
    const { amount, paymentProof, method, address } = await req.json();

    // 2. Input Validation
    if (!amount || amount <= 0) {
      return corsResponse({ error: "A valid deposit amount is required" }, 400, req);
    }

    if (!paymentProof) {
      return corsResponse({ error: "Payment proof is required" }, 400, req);
    }

    // 3. Create Pending Deposit Transaction
    // Added { validateBeforeSave: false } to bypass potential schema validation issues (like missing optional fields)
    const deposit = await Transaction.create({
      userId: session?.id,
      amount,
      type: "DEPOSIT",
      status: "PENDING",
      paymentProof,
      address,
      method,
      reference: `DEP-${Date.now()}`
    });

    // 4. Trigger Notification
    // We notify the user that their deposit is under review
    await createNotification(
      session.id,
      'DEPOSIT',
      'Deposit Submitted',
      `Your deposit request of $${amount} has been submitted and is under review.`,
      { transactionId: deposit._id }
    );

    // 5. Success Response
    return corsResponse(
      { message: "Deposit submitted for review", deposit }, 
      201, 
      req
    );

  } catch (error: any) {
    console.error("DEPOSIT_REQUEST_ERROR:", error);
    return corsResponse({ error: error.message || "Deposit request failed" }, 500, req);
  }
}


// import { NextRequest } from "next/server";
// import { Transaction } from "@/lib/models/Transaction";
// import { auth } from "@/lib/auth";
// import { connectDB } from "@/lib/db";
// import { corsOptionsResponse, corsResponse } from "@/lib/cors";
// import { createNotification } from "@/lib/notifications";


// export async function OPTIONS(request: NextRequest) {
//     return corsOptionsResponse(request.headers.get("origin"));
// }



// export async function POST(req: NextRequest) {
//   try {
//     // 1. Session & Auth Check
//     const session = await auth(req);
//     if (!session || !session?.id) {
//       return corsResponse({ error: "Unauthorized" }, 401, req);
//     }

//     await connectDB();
//     const { amount, paymentProof, method, address } = await req.json();

//     // 2. Input Validation
//     if (!amount || amount <= 0) {
//       return corsResponse({ error: "A valid deposit amount is required" }, 400, req);
//     }

//     if (!paymentProof) {
//       return corsResponse({ error: "Payment proof is required" }, 400, req);
//     }

//     // 3. Create Pending Deposit Transaction
//     const deposit = await Transaction.create({
//       userId: session?.id,
//       amount,
//       type: "DEPOSIT",
//       status: "PENDING",
//       paymentProof, // URL from Cloudinary/Upload provider
//       address,
//       method,
//       reference: `DEP-${Date.now()}`
//     });

//     await createNotification(
//           session.id, 
//           'DEPOSIT', 
//           'Deposit Request Initiated', 
//           `Your deposit request of $${amount} is being processed.`,
//           { depositId: deposit._id },
//         );
//     // 4. Success Response
//     return corsResponse(
//       { message: "Deposit submitted for review", deposit }, 
//       201, 
//       req
//     );

//   } catch (error) {
//     console.error("DEPOSIT_REQUEST_ERROR:", error);
//     return corsResponse({ error: "Deposit request failed" }, 500, req);
//   }
// }