import jwt, { JwtPayload } from "jsonwebtoken";

export type AuthUser = {
  id: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  iat?: number;
  exp?: number;
};

export async function auth(req: Request): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.AUTH_SECRET!
    ) as JwtPayload;

    if (!decoded?.id) {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch (error) {
    console.log("AUTH ERROR:", error);
    return null;
  }
}