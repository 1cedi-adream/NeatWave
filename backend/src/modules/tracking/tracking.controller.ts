import type { Request, Response } from "express";
import * as trackingService from "./tracking.service.js";
import * as receiptService from "../orders/receipt.service.js";

export async function getTrackingDetails(request: Request, response: Response) {
  const trackingDetails = await trackingService.getTrackingDetails(
    request.params.token!,
  );
  response.json({ data: trackingDetails });
}

export async function downloadTrackingReceipt(
  request: Request,
  response: Response,
) {
  const pdf = await receiptService.generatePublicOrderReceipt(
    request.params.token!,
  );
  response
    .set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="order-receipt.pdf"',
      "Cache-Control": "no-store",
    })
    .send(pdf);
}
