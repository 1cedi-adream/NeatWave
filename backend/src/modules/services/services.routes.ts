import { Router } from "express";
import { requireManager } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import * as controller from "./services.controller.js";
import * as schema from "./services.schema.js";

export const servicesRouter = Router();

servicesRouter.get("/", asyncHandler(controller.list));

servicesRouter.post(
  "/",
  requireManager,
  validate(schema.createServiceSchema),
  asyncHandler(controller.create),
);

servicesRouter.patch(
  "/:id",
  requireManager,
  validate(schema.updateServiceSchema),
  asyncHandler(controller.update),
);
