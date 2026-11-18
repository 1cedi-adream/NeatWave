import { Router } from "express";
import { validate } from "@/middleware/validate.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import * as controller from "./staff.controller.js";
import * as schema from "./staff.schema.js";

export const staffRouter = Router();

staffRouter.get("/", asyncHandler(controller.list));
staffRouter.post(
  "/invite",
  validate(schema.inviteSchema),
  asyncHandler(controller.invite),
);
staffRouter.patch(
  "/:id",
  validate(schema.updateSchema),
  asyncHandler(controller.update),
);
