import { Router } from "express";
import { requireManager } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import * as controller from "./settings.controller.js";
import * as schema from "./settings.schema.js";

export const settingsRouter = Router();

settingsRouter.get("/", asyncHandler(controller.getSettings));
settingsRouter.patch(
  "/",
  requireManager,
  validate(schema.updateSettingsSchema),
  asyncHandler(controller.updateSettings),
);
