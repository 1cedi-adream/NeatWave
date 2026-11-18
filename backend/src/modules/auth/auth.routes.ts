import { Router } from "express";
import { authenticate } from "@/middleware/auth.js";
import { validate } from "@/middleware/validate.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import * as controller from "./auth.controller.js";
import * as schema from "./auth.schema.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  validate(schema.loginSchema),
  asyncHandler(controller.login),
);
authRouter.post(
  "/refresh",
  validate(schema.refreshSchema),
  asyncHandler(controller.refresh),
);
authRouter.post(
  "/logout",
  validate(schema.refreshSchema),
  asyncHandler(controller.logout),
);

authRouter.post(
  "/forgot-password",
  validate(schema.forgotSchema),
  asyncHandler(controller.forgot),
);

authRouter.post(
  "/reset-password",
  validate(schema.resetSchema),
  asyncHandler(controller.reset),
);

authRouter.post(
  "/accept-invite",
  validate(schema.acceptInviteSchema),
  asyncHandler(controller.acceptInvite),
);

authRouter.get("/me", authenticate, asyncHandler(controller.me));
authRouter.patch(
  "/me",
  authenticate,
  validate(schema.updateProfileSchema),
  asyncHandler(controller.updateMe),
);
