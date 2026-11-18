import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler.js";
import * as controller from "./tracking.controller.js";

export const trackingRouter = Router();

trackingRouter.get(
  "/:token/receipt.pdf",
  asyncHandler(controller.downloadTrackingReceipt),
);
trackingRouter.get("/:token", asyncHandler(controller.getTrackingDetails));
