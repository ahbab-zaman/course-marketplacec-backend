import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token";
import { prisma } from "../database/prisma";
import { Role } from "@prisma/client";

export async function getRequestUser(req: Request) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    token = req.cookies.accessToken;
  }
  if (!token) return null;
  const decoded = verifyAccessToken(token);
  if (!decoded) return null;
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      role: true,
      email: true,
      name: true,
      isBlocked: true,
      isEmailVerified: true,
    },
  });
  if (!user || user.isBlocked) return null;
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    isEmailVerified: user.isEmailVerified,
    isBlocked: user.isBlocked,
  };
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await getRequestUser(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
      isBlocked: user.isBlocked,
    };

    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

export const authorizeRoles = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};
