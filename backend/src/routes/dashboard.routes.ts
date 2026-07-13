import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { authenticate } from "../middleware/authenticate";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", authenticate, dashboardController.summary);
