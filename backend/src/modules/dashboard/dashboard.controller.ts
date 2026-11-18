import type { Request, Response } from "express";
import * as dashboardService from "./dashboard.service.js";

export async function getSummary(request: Request, response: Response) {
  const summary = await dashboardService.getSummary(request.auth!.tenantId!);
  response.json({ data: summary });
}
