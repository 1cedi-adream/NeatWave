import type { Request, Response } from "express";
import * as staffService from "./staff.service.js";

export async function list(request: Request, response: Response) {
  response.json({
    data: await staffService.listStaff(request.auth!.tenantId!),
  });
}

export async function invite(request: Request, response: Response) {
  const invitation = await staffService.inviteStaff(
    request.auth!.tenantId!,
    request.auth!.userId,
    request.body,
  );
  response.status(201).json({ data: invitation });
}

export async function update(request: Request, response: Response) {
  const staff = await staffService.updateStaff(
    request.auth!.tenantId!,
    request.params.id!,
    request.body,
  );
  response.json({ data: staff });
}
