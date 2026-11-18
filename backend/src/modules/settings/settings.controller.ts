import type { Request, Response } from "express";
import * as settingsService from "./settings.service.js";

export async function getSettings(request: Request, response: Response) {
  const settings = await settingsService.getSettings(request.auth!.tenantId!);
  response.json({ data: settings });
}

export async function updateSettings(request: Request, response: Response) {
  const settings = await settingsService.updateSettings(
    request.auth!.tenantId!,
    request.body,
  );
  response.json({ data: settings });
}
