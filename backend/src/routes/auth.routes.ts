import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { validateBody } from "../middleware/validateRequest";
import { registerSchema, loginSchema } from "../validators/auth.validators";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), authController.register);
authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authenticate, authController.me);
