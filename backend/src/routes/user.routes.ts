import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateBody, validateQuery } from "../middleware/validateRequest";
import { updateUserSchema, listUsersQuerySchema } from "../validators/user.validators";

export const userRouter = Router();

userRouter.use(authenticate);

userRouter.get("/assignable", authorize("ADMIN", "PROJECT_MANAGER"), userController.listAssignable);
userRouter.get("/", authorize("ADMIN"), validateQuery(listUsersQuerySchema), userController.list);
userRouter.get("/:id", authorize("ADMIN"), userController.getById);
userRouter.patch("/:id", authorize("ADMIN"), validateBody(updateUserSchema), userController.update);
userRouter.delete("/:id", authorize("ADMIN"), userController.deactivate);
