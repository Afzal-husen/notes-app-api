import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/unauthorized.js";

interface DecodedToken {
  id: string;
}

const jwtSecret = process.env.JWT_SECRET;

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeaders = req.headers.authorization;

    if (!authHeaders && !authHeaders?.startsWith("Bearer "))
      return next(new UnauthorizedError("Unauthorized"));

    const token = authHeaders?.split(" ")[1];

    if (!token)
      return next(new UnauthorizedError("Token missing or malformed"));

    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    let user = req?.user!;
    user = decoded as DecodedToken;

    next();
  } catch (error) {
    next(error);
  }
};

export { authenticate };
