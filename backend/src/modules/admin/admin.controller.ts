import type { Request, Response } from "express";
import * as adminService from "./admin.service.js";

export async function summary(_request: Request, response: Response) {
  response.json({ data: await adminService.getSummary() });
}

export async function list(request: Request, response: Response) {
  response.json(await adminService.listTenants(request.query as never));
}

export async function detail(request: Request, response: Response) {
  response.json({ data: await adminService.getTenant(request.params.id!) });
}

export async function provision(request: Request, response: Response) {
  const tenant = await adminService.provisionTenant(
    request.auth!.userId,
    request.body,
  );
  response.status(201).json({ data: tenant });
}

export async function status(request: Request, response: Response) {
  const tenant = await adminService.updateTenantStatus(
    request.params.id!,
    request.body.active,
  );
  response.json({ data: tenant });
}

export async function resendInvitation(request: Request, response: Response) {
  response.json({
    data: await adminService.resendManagerInvitation(
      request.auth!.userId,
      request.params.id!,
    ),
  });
}
