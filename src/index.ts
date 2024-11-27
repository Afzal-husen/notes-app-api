import express, { NextFunction, Request, Response } from "express";
import { errorHandler } from "./middlewares/error-handler.js";
import userRouter from "./routes/user.js";

const app = express();

app.use(express.json());

app.use("/api/user", userRouter);
app.use(errorHandler);

const port: string | undefined = process.env.PORT;

app.listen(port, () => console.log(`Server running at port ${port}`));
