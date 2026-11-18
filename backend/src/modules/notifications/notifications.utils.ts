import type { Message } from "./notifications.service.js";

export function renderStatusMessage(
  payload: unknown,
  template = "order_status",
): Omit<Message, "recipient"> {
  if (template === "staff_invitation") {
    const invitation = payload as {
      businessName: string;
      invitationUrl: string;
    };
    return {
      subject: `Join ${invitation.businessName} on NeatWave`,
      text: `You have been invited to join ${invitation.businessName}. Accept your invitation: ${invitation.invitationUrl}`,
    };
  }

  if (template === "password_reset") {
    const reset = payload as { resetUrl: string };
    return {
      subject: "Reset your NeatWave password",
      text: `Reset your NeatWave password using this link: ${reset.resetUrl}`,
    };
  }

  const statusPayload = payload as {
    businessName: string;
    orderNumber: string;
    status: string;
    trackingUrl: string;
    receiptPdfUrl?: string;
  };
  const receiptLink = statusPayload.receiptPdfUrl
    ? ` Download your receipt: ${statusPayload.receiptPdfUrl}`
    : "";

  return {
    subject: `Your order from ${statusPayload.businessName} is ${statusPayload.status}`,
    text: `Your order ${statusPayload.orderNumber} from ${statusPayload.businessName} is ${statusPayload.status}. You can track its status using this link: ${statusPayload.trackingUrl}.${receiptLink}`,
  };
}
