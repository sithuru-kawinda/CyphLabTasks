import { Router } from "express";
import * as projectController from "../controllers/project.controller";
import * as projectMemberController from "../controllers/projectMember.controller";
import * as taskController from "../controllers/task.controller";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateBody, validateQuery } from "../middleware/validateRequest";
import { createProjectSchema, updateProjectSchema, listProjectsQuerySchema } from "../validators/project.validators";
import { addMemberSchema } from "../validators/projectMember.validators";
import { createTaskSchema, listTasksQuerySchema } from "../validators/task.validators";

export const projectRouter = Router();

projectRouter.use(authenticate);

projectRouter.get("/", validateQuery(listProjectsQuerySchema), projectController.list);
projectRouter.post(
  "/",
  authorize("ADMIN", "PROJECT_MANAGER"),
  validateBody(createProjectSchema),
  projectController.create,
);
projectRouter.get("/:id", projectController.getById);
projectRouter.patch(
  "/:id",
  authorize("ADMIN", "PROJECT_MANAGER"),
  validateBody(updateProjectSchema),
  projectController.update,
);
projectRouter.delete("/:id", authorize("ADMIN"), projectController.remove);

projectRouter.get("/:projectId/members", projectMemberController.list);
projectRouter.post(
  "/:projectId/members",
  authorize("ADMIN", "PROJECT_MANAGER"),
  validateBody(addMemberSchema),
  projectMemberController.add,
);
projectRouter.delete(
  "/:projectId/members/:userId",
  authorize("ADMIN", "PROJECT_MANAGER"),
  projectMemberController.remove,
);

projectRouter.get("/:projectId/tasks", validateQuery(listTasksQuerySchema), taskController.listForProject);
projectRouter.post(
  "/:projectId/tasks",
  authorize("ADMIN", "PROJECT_MANAGER"),
  validateBody(createTaskSchema),
  taskController.create,
);
