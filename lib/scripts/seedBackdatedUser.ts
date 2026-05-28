import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Wallet } from "@/lib/models/Wallet";
import { Transaction } from "@/lib/models/Transaction";
import { Investment } from "@/lib/models/Investment";
import bcrypt from "bcryptjs";

const generateReferralCode = () => {
  return Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();
};

export async function seedBackdatedUsers() {
  try {
    await connectDB();

    /**
     * Prevent duplicate seeding
     */
    const existingUser = await User.findOne({
      email: "anniigir54@gmail.com",
    });

    if (existingUser) {
      console.log("⚠️ Seed users already exist");
      return;
    }

    /**
     * PASSWORDS
     */
    const hashedPassword1 = await bcrypt.hash(
      "Twistedangel*54",
      10
    );

    const hashedPassword2 = await bcrypt.hash(
      "Cockerham@15",
      10
    );

    // =========================================================
    // USER 1 — ANNI ANDERSON
    // =========================================================

    const user1 = await User.create({
      firstName: "Anni",
      lastName: "Anderson",
      email: "anniigir54@gmail.com",
      password: hashedPassword1,

      role: "USER",

      kycStatus: "VERIFIED",

      isEmailVerified: true,

      referralCode: generateReferralCode(),
    });

    /**
     * WALLET
     */
    const wallet1 = await Wallet.create({
      userId: user1._id,

      balance: 43458,

      totalInvested: 233202,

      totalProfit: 2015538,

      totalWithdrawn: 0,
    });

    user1.wallet = wallet1._id;

    await user1.save();

    /**
     * DEPOSIT HISTORY
     */
    const deposits1 = [
      { amount: 484, date: "2025-02-08" },
      { amount: 1469, date: "2025-02-11" },
      { amount: 1560, date: "2025-02-18" },
      { amount: 234, date: "2025-03-01" },
      { amount: 5, date: "2025-03-01" },
      { amount: 2499, date: "2025-03-05" },
      { amount: 550, date: "2025-03-05" },
      { amount: 8900, date: "2025-04-07" },
      { amount: 245, date: "2025-05-02" },
      { amount: 3076, date: "2025-06-06" },
      { amount: 1115, date: "2025-06-06" },
      { amount: 4999, date: "2025-06-19" },
      { amount: 8099, date: "2025-07-04" },
      { amount: 264, date: "2025-07-04" },
      { amount: 475, date: "2025-08-02" },
      { amount: 297, date: "2025-08-16" },
      { amount: 4046, date: "2025-08-20" },
      { amount: 344, date: "2025-09-05" },
      { amount: 109500, date: "2025-09-05" },
      { amount: 149, date: "2025-09-24" },
      { amount: 448, date: "2025-11-06" },
      { amount: 47993, date: "2025-11-24" },
      { amount: 480, date: "2025-12-24" },
      { amount: 311, date: "2026-03-03" },
      { amount: 547, date: "2026-04-08" },
      { amount: 77992, date: "2026-04-20" },
      { amount: 579, date: "2026-05-22" },
    ];

    await Transaction.insertMany(
      deposits1.map((d, i) => ({
        userId: user1._id,

        amount: d.amount,

        address: "BACKDATED_DEPOSIT",

        method: "SEED",

        type: "DEPOSIT",

        status: "COMPLETED",

        reference: `ANNI-DEP-${i}-${Date.now()}`,

        createdAt: new Date(d.date),

        updatedAt: new Date(d.date),
      }))
    );

    /**
     * ROI / PROFITS
     */
    await Transaction.create({
      userId: user1._id,

      amount: 2015538,

      address: "SYSTEM_ROI",

      method: "AUTO",

      type: "ROI",

      status: "COMPLETED",

      reference: `ANNI-ROI-${Date.now()}`,

      createdAt: new Date("2026-05-22"),

      updatedAt: new Date("2026-05-22"),
    });

    /**
     * REFERRAL BONUS
     */
    await Transaction.create({
      userId: user1._id,

      amount: 36990,

      address: "REFERRAL_SYSTEM",

      method: "AUTO",

      type: "REFERRAL",

      status: "COMPLETED",

      reference: `ANNI-REF-${Date.now()}`,

      createdAt: new Date("2026-05-22"),

      updatedAt: new Date("2026-05-22"),
    });

    /**
     * INVESTMENTS
     */

    // XAI
    await Investment.create({
      userId: user1._id,

      amount: 30000,

      assetSymbol: "XAI",

      assetType: "CRYPTO",

      purchasePriceAtEntry: 30000,

      dailyProfit: 2500,

      totalExpectedReturn: 1000000,

      totalEarned: 1000000,

      durationDays: 365,

      status: "COMPLETED",

      approvedAt: new Date("2026-04-21"),

      lastPayoutDate: new Date("2026-05-22"),

      endDate: new Date("2027-04-21"),
    });

    // Tesla Energy
    await Investment.create({
      userId: user1._id,

      amount: 30000,

      assetSymbol: "Tesla Energy",

      assetType: "STOCK",

      purchasePriceAtEntry: 30000,

      dailyProfit: 2800,

      totalExpectedReturn: 1015538,

      totalEarned: 1015538,

      durationDays: 365,

      status: "COMPLETED",

      approvedAt: new Date("2026-04-21"),

      lastPayoutDate: new Date("2026-05-22"),

      endDate: new Date("2027-04-21"),
    });

    // =========================================================
    // USER 2 — MICHELE COCKERHAM
    // =========================================================

    const user2 = await User.create({
      firstName: "Michele",

      lastName: "Cockerham",

      email: "cockerhamm@icloud.com",

      password: hashedPassword2,

      role: "USER",

      kycStatus: "VERIFIED",

      isEmailVerified: true,

      referralCode: generateReferralCode(),

      referredBy: user1.referralCode,
    });

    /**
     * WALLET
     */
    const wallet2 = await Wallet.create({
      userId: user2._id,

      balance: 1748,

      totalInvested: 1000,

      totalProfit: 16489,

      totalWithdrawn: 0,
    });

    user2.wallet = wallet2._id;

    await user2.save();

    /**
     * DEPOSITS
     */
    const deposits2 = [
      { amount: 397, date: "2025-08-07" },
      { amount: 439, date: "2025-08-09" },
      { amount: 242, date: "2025-08-14" },
      { amount: 365, date: "2025-08-28" },
      { amount: 222, date: "2025-08-27" },
      { amount: 257, date: "2025-10-30" },
      { amount: 306, date: "2025-11-15" },
      { amount: 275, date: "2025-12-15" },
      { amount: 245, date: "2026-05-03" },
    ];

    await Transaction.insertMany(
      deposits2.map((d, i) => ({
        userId: user2._id,

        amount: d.amount,

        address: "BACKDATED_DEPOSIT",

        method: "SEED",

        type: "DEPOSIT",

        status: "COMPLETED",

        reference: `MICHELE-DEP-${i}-${Date.now()}`,

        createdAt: new Date(d.date),

        updatedAt: new Date(d.date),
      }))
    );

    /**
     * ROI
     */
    await Transaction.create({
      userId: user2._id,

      amount: 16489,

      address: "SYSTEM_ROI",

      method: "AUTO",

      type: "ROI",

      status: "COMPLETED",

      reference: `MICHELE-ROI-${Date.now()}`,

      createdAt: new Date("2026-05-03"),

      updatedAt: new Date("2026-05-03"),
    });

    /**
     * INVESTMENT
     */
    await Investment.create({
      userId: user2._id,

      amount: 1000,

      assetSymbol: "XAI",

      assetType: "CRYPTO",

      purchasePriceAtEntry: 1000,

      dailyProfit: 50,

      totalExpectedReturn: 16489,

      totalEarned: 16489,

      durationDays: 365,

      status: "COMPLETED",

      approvedAt: new Date("2025-08-07"),

      lastPayoutDate: new Date("2026-05-03"),

      endDate: new Date("2026-08-07"),
    });

    console.log(
      "✅ BACKDATED USERS SEEDED SUCCESSFULLY"
    );

    return {
      user1,
      user2,
    };
  } catch (error) {
    console.error(
      "❌ SEED_BACKDATED_USERS_ERROR:",
      error
    );
  }
}

// import { connectDB } from "@/lib/db";
// import { User } from "@/lib/models/User";
// import { Wallet } from "@/lib/models/Wallet";
// import { Transaction } from "@/lib/models/Transaction";
// import { Investment } from "@/lib/models/Investment";
// import bcrypt from "bcryptjs";

// export async function seedBackdatedUsers() {
//   try {
//     await connectDB();

//     const hashedPassword1 = await bcrypt.hash("Twistedangel*54", 10);
//     const hashedPassword2 = await bcrypt.hash("Cockerham@15", 10);

//     // =========================
//     // USER 1 (Michele Cockerham)
//     // =========================
//     const user1 = await User.create({
//       firstName: "Anni",
//       lastName: "Anderson",
//       email: "anniigir|54@gmail.com",
//       password: hashedPassword1,
//       role: "USER",
//       kycStatus: "VERIFIED",
//       isEmailVerified: true,
//     });

//     const wallet1 = await Wallet.create({
//       userId: user1._id,
//       balance: 43458,
//       totalInvested: 233202,
//       totalProfit: 2015538,
//       totalWithdrawn: 0,
//     });

//     user1.wallet = wallet1._id;
//     await user1.save();

//     // USER 1 DEPOSITS
//     const deposits1 = [
//       { amount: 484, date: "2025-02-08" },
//       { amount: 1469, date: "2025-02-11" },
//       { amount: 1560, date: "2025-02-18" },
//       { amount: 234, date: "2025-03-01" },
//       { amount: 5, date: "2025-03-01" },
//       { amount: 2499, date: "2025-03-05" },
//       { amount: 550, date: "2025-03-05" },
//       { amount: 8900, date: "2025-04-07" },
//       { amount: 245, date: "2025-05-02" },
//       { amount: 3076, date: "2025-06-06" },
//       { amount: 1115, date: "2025-06-06" },
//       { amount: 4999, date: "2025-06-19" },
//       { amount: 8099, date: "2025-07-04" },
//       { amount: 264, date: "2025-07-04" },
//       { amount: 475, date: "2025-08-02" },
//       { amount: 297, date: "2025-08-16" },
//       { amount: 4046, date: "2025-08-20" },
//       { amount: 344, date: "2025-09-05" },
//       { amount: 109500, date: "2025-09-05" },
//       { amount: 149, date: "2025-09-24" },
//       { amount: 448, date: "2025-11-06" },
//       { amount: 47993, date: "2025-11-24" },
//       { amount: 480, date: "2025-12-24" },
//       { amount: 311, date: "2026-03-03" },
//       { amount: 547, date: "2026-04-08" },
//       { amount: 77992, date: "2026-04-20" },
//       { amount: 579, date: "2026-05-22" },
//     ];

//     await Transaction.insertMany(
//       deposits1.map((d, i) => ({
//         userId: user1._id,
//         amount: d.amount,
//         address: "BACKDATED",
//         method: "SEED",
//         type: "DEPOSIT",
//         status: "COMPLETED",
//         reference: `U1-DEP-${i}`,
//         createdAt: new Date(d.date),
//         updatedAt: new Date(d.date),
//       }))
//     );

//     // ROI history (aligned to your profit)
//     await Transaction.create({
//       userId: user1._id,
//       amount: 2015538,
//       address: "SYSTEM_ROI",
//       method: "AUTO",
//       type: "ROI",
//       status: "COMPLETED",
//       reference: "U1-ROI-FINAL",
//       createdAt: new Date("2026-05-22"),
//     });

//     await Investment.create({
//       userId: user1._id,
//       amount: 10000,
//       dailyProfit: 500,
//       totalExpectedReturn: 2015538,
//       totalEarned: 2015538,
//       status: "COMPLETED",
//       durationDays: 365,
//       approvedAt: new Date("2025-02-08"),
//       lastPayoutDate: new Date("2026-05-22"),
//     });

//     // =========================
//     // USER 2 (NEW USER)
//     // =========================
//     const user2 = await User.create({
//       firstName: "Michele",
//       lastName: "Cockerham ",
//       email: "cockerhamm@icloud.com",
//       password: hashedPassword2,
//       role: "USER",
//       kycStatus: "VERIFIED",
//       isEmailVerified: true,
//       referredBy: "REF-001",
//     });

//     const wallet2 = await Wallet.create({
//       userId: user2._id,
//       balance: 1748,
//       totalInvested: 2748,
//       totalProfit: 16489,
//       totalWithdrawn: 0,
//     });

//     user2.wallet = wallet2._id;
//     await user2.save();

//     const deposits2 = [
//       { amount: 397, date: "2025-08-07" },
//       { amount: 439, date: "2025-08-09" },
//       { amount: 242, date: "2025-08-14" },
//       { amount: 365, date: "2025-08-28" },
//       { amount: 222, date: "2025-08-27" },
//       { amount: 257, date: "2025-10-30" },
//       { amount: 306, date: "2025-11-15" },
//       { amount: 275, date: "2025-12-15" },
//       { amount: 245, date: "2026-05-03" },
//     ];

//     await Transaction.insertMany(
//       deposits2.map((d, i) => ({
//         userId: user2._id,
//         amount: d.amount,
//         address: "BACKDATED",
//         method: "SEED",
//         type: "DEPOSIT",
//         status: "COMPLETED",
//         reference: `U2-DEP-${i}`,
//         createdAt: new Date(d.date),
//         updatedAt: new Date(d.date),
//       }))
//     );

//     await Transaction.create({
//       userId: user2._id,
//       amount: 16489,
//       address: "SYSTEM_ROI",
//       method: "AUTO",
//       type: "ROI",
//       status: "COMPLETED",
//       reference: "U2-ROI-FINAL",
//       createdAt: new Date("2026-05-03"),
//     });

//     await Investment.create({
//       userId: user2._id,
//       amount: 1000,
//       dailyProfit: 50,
//       totalExpectedReturn: 16489,
//       totalEarned: 16489,
//       status: "COMPLETED",
//       durationDays: 365,
//       approvedAt: new Date("2025-08-07"),
//       lastPayoutDate: new Date("2026-05-03"),
//     });

//     console.log("✅ BOTH SEED USERS CREATED SUCCESSFULLY");

//     return { user1, user2 };
//   } catch (error) {
//     console.error("❌ SEED ERROR:", error);
//   }
// }

