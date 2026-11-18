export type Notification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  kind: string;
};

export type NotificationDelivery = {
  id: string;
  orderId: string | null;
  channel: "sms" | "email";
  state: "pending" | "processing" | "sent" | "failed";
  attempts: number;
  sentAt: string | null;
  createdAt: string;
};
