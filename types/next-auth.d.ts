import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extending the built-in session user object
   */
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  /**
   * Extending the built-in user object
   */
  interface User {
    id?: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  /** Extending the JSON Web Token */
  interface JWT {
    id: string;
    role: string;
  }
}