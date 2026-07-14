import { Router } from "express";
import * as taskController from "../controllers/task.controller";
import * as commentController from "../controllers/comment.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateBody, validateQuery } from "../middleware/validateRequest";
import { updateTaskSchema, listTasksQuerySchema } from "../validators/task.validators";
import { createCommentSchema } from "../validators/comment.validators";

export const taskRouter = Router();

taskRouter.use(authenticate);

taskRouter.get("/my", validateQuery(listTasksQuerySchema), taskController.listMy);
taskRouter.get("/:id", taskController.getById);
taskRouter.get("/:id/history", taskController.history);
taskRouter.patch("/:id", validateBody(updateTaskSchema), taskController.update);
taskRouter.delete("/:id", authorize("ADMIN", "PROJECT_MANAGER"), taskController.remove);

taskRouter.get("/:id/comments", commentController.list);
taskRouter.post("/:id/comments", validateBody(createCommentSchema), commentController.create);
