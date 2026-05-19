import NextAuth, { type DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

// ⚡️ 1. NEXTAUTH V4 CORRECTED TYPES AUGMENTATIONS
declare module "next-auth" {
  interface User {
    id?: string;
    firstName: string;
    lastName: string;
    role: string;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      firstName: string;
      lastName: string;
      role: string;
    } & DefaultSession["user"];
  }
}

// ⚡️ FIX: Target next-auth/jwt namespace instead of NextAuth v5's @auth/core
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    firstName: string;
    lastName: string;
    role: string; // Sticking to your string definition for easy validation mapping
  }
}

// ⚡️ 2. CONFIGURATION OBJECT STRUCTURE
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectDB();

        if (!credentials?.email || !credentials?.password) {
          return null; 
        }

        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase(),
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }

      if (trigger === "update" && session?.user) {
        return { ...token, ...session.user };
      }

      return token;
    },

    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
      }

      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.AUTH_SECRET,
};

// ⚡️ 3. CORE EXPORT PARADIGM FOR ROUTE HANDLERS & MIDDLEWARE INTERFACES
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Standard utility export helper for accessing sessions inside server-side layout structures
export const auth = () => NextAuth(authOptions);



// import NextAuth, { type DefaultSession, type User as NextAuthUser } from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from "bcryptjs";
// import { connectDB } from "@/lib/db";
// import { User } from "@/lib/models/User";

// // 1. Corrected Module Augmentations
// // declare module "next-auth" {
// //   interface User {
// //     id?: any; // Ensure id is explicitly a string instead of string | undefined
// //     firstName: string;
// //     lastName: string;
// //     role: string;
// //   }

// //   interface Session extends DefaultSession {
// //     user: User & DefaultSession["user"];
// //   }

// //   interface JWT {
// //     id: string;
// //     firstName: string;
// //     lastName: string;
// //     role: string;
// //   }
// // }


// declare module "next-auth" {
//   interface User {
//     id?: string;
//     firstName: string;
//     lastName: string;
//     role: string;
//   }

//   interface Session extends DefaultSession {
//     user: {
//       id: string;
//       firstName: string;
//       lastName: string;
//       role: string;
//     } & DefaultSession["user"];
//   }
// }

// declare module "@auth/core/jwt" {
//   interface JWT {
//     id: string;
//     firstName: string;
//     lastName: string;
//     // role: string;
//     role: "USER" | "ADMIN" | "SUPER_ADMIN"; 
//   }
// }

// export const { handlers, auth, signIn, signOut } = NextAuth({
//   providers: [
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "text" },
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         await connectDB();

//         if (!credentials?.email || !credentials?.password) {
//           // Returning null or throwing specific error strings can be caught by NextAuth
//           return null; 
//         }

//         const user = await User.findOne({
//           email: (credentials.email as string).toLowerCase(),
//         });

//         // Fail early if user doesn't exist or is an OAuth user without a password
//         if (!user || !user.password) {
//           return null;
//         }

//         const isValid = await bcrypt.compare(
//           credentials.password as string,
//           user.password
//         );

//         if (!isValid) {
//           return null;
//         }

//         // Return values MUST match the interface User defined above
//         return {
//           id: user._id.toString(),
//           firstName: user.firstName,
//           lastName: user.lastName,
//           email: user.email,
//           role: user.role,
//         };
//       },
//     }),
//   ],

//   callbacks: {
//     async jwt({ token, user, trigger, session }) {
//       if (user) {
//         token.id = user.id as string;
//         token.role = user.role;
//         token.firstName = user.firstName;
//         token.lastName = user.lastName;
//       }

//       // Sync custom profile updates back into the JWT
//       if (trigger === "update" && session?.user) {
//         return { ...token, ...session.user };
//       }

//       return token;
//     },

//     async session({ session, token }) {
//       const typedToken = token as {
//         id: string;
//         role: string;
//         firstName: string;
//         lastName: string;
//       };

//       if (token && session.user) {
//         session.user.id = typedToken.id;
//         session.user.role = typedToken.role;
//         session.user.firstName = typedToken.firstName;
//         session.user.lastName = typedToken.lastName;
//       }

//       return session;
//     },
//   },

//   pages: {
//     signIn: "/auth/login",
//   },

//   session: {
//     strategy: "jwt",
//     maxAge: 30 * 24 * 60 * 60, // 30 days
//   },

//   secret: process.env.AUTH_SECRET,
// });