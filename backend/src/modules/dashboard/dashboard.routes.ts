import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler.js";
import * as controller from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", asyncHandler(controller.getSummary));
