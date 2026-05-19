import bcrypt from "bcryptjs";
import { User } from "./models/User";
import { Wallet } from "./models/Wallet";
import { nanoid } from "nanoid";

export const seedAdmin = async () => {
  try {
    // Collect credentials Matrix configuration maps
    const configurations = [
      {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
        role: "ADMIN" as const,
        firstName: "Tesla System Admin",
        lastName: "Admin"
      },
      {
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
        role: "SUPER_ADMIN" as const,
        firstName: "Default Super Admin",
        lastName: "Admin"
      }
    ];

    for (const config of configurations) {
      const { email, password, role, firstName, lastName } = config;

      // 1. Structural Environment Verification Guard
      if (!email || !password) {
        console.warn(`⚠️ Skipping ${role} Seed: Environment credentials missing inside runtime execution context.`);
        continue;
      }

      const normalizedEmail = email.toLowerCase().trim();

      // 2. Avoid duplicate entry violations
      const accountExists = await User.findOne({ email: normalizedEmail });
      if (accountExists) {
        continue; // Context instance already present, bypass processing iteration.
      }

      console.log(`🚀 Provisioning baseline node access channel for ${role}: ${normalizedEmail}...`);

      // 3. Encrypt payload baseline hash standard iterations
      const hashedPassword = await bcrypt.hash(password, 12);

      // 4. Instantiation structural assignment layout
      const newUser = new User({
        firstName,
        lastName,
        email: normalizedEmail,
        password: hashedPassword,
        role,
        isEmailVerified: true,
        referralCode: nanoid(8).toUpperCase(),
        kycStatus: "VERIFIED",
      });

      // 5. Initialize accompanying asset wallet bounds atomically
      const newWallet = new Wallet({
        userId: newUser._id,
        balance: 0,
        profitBalance: 0,
        referralBalance: 0,
      });

      // Associate cross-reference identifiers and commit using a combined array save execution sequence
      newUser.wallet = newWallet._id;

      // Persist documents sequentially to secure instance integrity
      await newWallet.save();
      await newUser.save();

      console.log(`✅ ${role} account successfully anchored to the cluster.`);
    }

  } catch (error) {
    console.error("❌ High privilege system automation provisioning process crashed:", error);
  }
};