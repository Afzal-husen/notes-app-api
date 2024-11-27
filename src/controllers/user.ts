import { Request, Response, NextFunction, RequestHandler } from "express";
import { BadRequestError } from "../errors/bad-request.js";
import { prisma } from "../lib/prisma-client.js";
import { comparePassword, hashPassword } from "../lib/password.js";
import { generateToken } from "../lib/generate-token.js";
import { NotFoundError } from "../errors/not-found.js";

const checkUserExist = async (email: string) =>
  await prisma.user.findFirst({ where: { email } });

const register: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    if (!email) return next(new BadRequestError("Email is required"));
    if (!password) return next(new BadRequestError("Password is required"));
    if (!username) return next(new BadRequestError("Username is required"));

    const userExists = await checkUserExist(email);

    if (userExists) return next(new BadRequestError("User already exists"));

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
      },
    });

    if (!user) return next(new BadRequestError("Failed to register"));

    const token = generateToken(user.id);

    res
      .cookie("token", token, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
      })
      .status(201)
      .json({ error: false, message: "Registration successfull" });
  } catch (error) {
    next(error);
  }
};

const login: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email) return next(new BadRequestError("Email is required"));
    if (!password) return next(new BadRequestError("Password is required"));

    const user = await checkUserExist(email);

    if (!user) return next(new NotFoundError("User not found"));

    const isPasswordCorrect = await comparePassword(password, user.password);

    if (!isPasswordCorrect)
      return next(new BadRequestError("Password is incorrect"));

    const token = generateToken(user.id);

    res
      .cookie("token", token, {
        maxAge: 1000 * 60 * 60 * 24 * 30,
        httpOnly: true,
      })
      .status(201)
      .json({ error: false, message: "Login successfull" });
  } catch (error) {
    next(error);
  }
};

export { register, login };
