import { Router } from "express";
import { requireManager } from "@/middleware/auth.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import * as controller from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", asyncHandler(controller.list));
notificationsRouter.post("/read-all", asyncHandler(controller.markAll));
notificationsRouter.post("/:id/read", asyncHandler(controller.markRead));

notificationsRouter.get(
  "/deliveries/jobs",
  requireManager,
  asyncHandler(controller.deliveries),
);

notificationsRouter.get(
  "/deliveries/:id/attempts",
  requireManager,
  asyncHandler(controller.attempts),
);

notificationsRouter.post(
  "/deliveries/:id/retry",
  requireManager,
  asyncHandler(controller.retry),
);
