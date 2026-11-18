import type { Request, Response } from "express";
import * as servicesService from "./services.service.js";

export async function list(request: Request, response: Response) {
  response.json({
    data: await servicesService.listServices(
      request.auth!.tenantId!,
      request.query.active === "true",
    ),
  });
}

export async function create(request: Request, response: Response) {
  const service = await servicesService.createService(
    request.auth!.tenantId!,
    request.body,
  );
  response.status(201).json({ data: service });
}

export async function update(request: Request, response: Response) {
  const service = await servicesService.updateService(
    request.auth!.tenantId!,
    request.params.id!,
    request.body,
  );
  response.json({ data: service });
}
