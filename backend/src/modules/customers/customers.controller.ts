import type { Request, Response } from "express";
import * as customersService from "./customers.service.js";

export async function listCustomers(request: Request, response: Response) {
  const result = await customersService.listCustomers(
    request.auth!.tenantId!,
    request.query as never,
  );
  response.json(result);
}

export async function createCustomer(request: Request, response: Response) {
  const customer = await customersService.createCustomer(
    request.auth!.tenantId!,
    request.body,
  );
  response.status(201).json({ data: customer });
}

export async function updateCustomer(request: Request, response: Response) {
  const customer = await customersService.updateCustomer(
    request.auth!.tenantId!,
    request.params.id!,
    request.body,
  );
  response.json({ data: customer });
}

export async function getCustomer(request: Request, response: Response) {
  const customer = await customersService.getCustomer(
    request.auth!.tenantId!,
    request.params.id!,
  );
  response.json({ data: customer });
}
