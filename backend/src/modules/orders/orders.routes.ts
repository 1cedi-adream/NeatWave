import { Router } from "express";
import { validate } from "@/middleware/validate.js";
import { requireManager } from "@/middleware/auth.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import * as controller from "./orders.controller.js";
import * as schema from "./orders.schema.js";

export const ordersRouter = Router();

ordersRouter.get(
  "/",
  validate(schema.listOrdersSchema),
  asyncHandler(controller.list),
);
ordersRouter.post(
  "/",
  validate(schema.createOrderSchema),
  asyncHandler(controller.create),
);
ordersRouter.get(
  "/export",
  validate(schema.exportOrdersSchema),
  asyncHandler(controller.exportOrders),
);
ordersRouter.get("/:id", asyncHandler(controller.detail));
ordersRouter.get(
  "/:id/receipt.pdf",
  requireManager,
  asyncHandler(controller.downloadReceipt),
);

ordersRouter.post(
  "/:id/status",
  validate(schema.statusSchema),
  asyncHandler(controller.status),
);

ordersRouter.post(
  "/:id/payments",
  validate(schema.paymentSchema),
  asyncHandler(controller.pay),
);

ordersRouter.post(
  "/:id/payments/:paymentId/refunds",
  validate(schema.refundSchema),
  asyncHandler(controller.refund),
);
