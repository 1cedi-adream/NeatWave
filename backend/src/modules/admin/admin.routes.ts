import { Router } from "express";
import { validate } from "@/middleware/validate.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import * as controller from "./admin.controller.js";
import * as schema from "./admin.schema.js";

export const adminRouter = Router();

adminRouter.get("/summary", asyncHandler(controller.summary));
adminRouter.get(
  "/tenants",
  validate(schema.listTenantsSchema),
  asyncHandler(controller.list),
);
adminRouter.post(
  "/tenants",
  validate(schema.provisionSchema),
  asyncHandler(controller.provision),
);
adminRouter.patch(
  "/tenants/:id/status",
  validate(schema.tenantStatusSchema),
  asyncHandler(controller.status),
);
adminRouter.post(
  "/tenants/:id/resend-invitation",
  validate(schema.resendInvitationSchema),
  asyncHandler(controller.resendInvitation),
);
adminRouter.get(
  "/tenants/:id",
  validate(schema.tenantParamsSchema),
  asyncHandler(controller.detail),
);
