import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";

import { auth } from "../../modules/auth/auth";
import { getRequestUser } from "../../middlewares/auth.middleware";

const authorize = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Better Auth is the single runtime auth source for protected routes.
      const session = await auth?.api.getSession({
        headers: req.headers as any,
      });

      if (!session) {
        const tokenUser = await getRequestUser(req);

        if (!tokenUser) {
          return res.status(401).json({
            success: false,
            message: "You are not authorized!",
          });
        }

        req.user = tokenUser;
      } else {
        if (!session.user.emailVerified) {
          return res.status(403).json({
            success: false,
            message: "Email verification required. Please verify your email!",
          });
        }

        req.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role as Role,
          isEmailVerified: session.user.emailVerified,
          isBlocked: (session.user as any).isBlocked ?? false,
        };
      }

      if (req.user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Your account has been blocked.",
        });
      }

      if (
        roles.length &&
        req.user &&
        !roles.includes(req.user.role)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden! You don't have permission to access this resources!",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default authorize;
