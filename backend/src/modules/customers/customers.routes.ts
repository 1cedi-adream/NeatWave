import { Router } from "express";
import { validate } from "@/middleware/validate.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import * as controller from "./customers.controller.js";
import * as schema from "./customers.schema.js";

export const customersRouter = Router();

customersRouter.get(
  "/",
  validate(schema.listCustomersSchema),
  asyncHandler(controller.listCustomers),
);
customersRouter.post(
  "/",
  validate(schema.createCustomerSchema),
  asyncHandler(controller.createCustomer),
);
customersRouter.get("/:id", asyncHandler(controller.getCustomer));
customersRouter.patch(
  "/:id",
  validate(schema.updateCustomerSchema),
  asyncHandler(controller.updateCustomer),
);
