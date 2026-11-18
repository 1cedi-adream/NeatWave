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
  orderNumber: string | null;
  message: string;
  channel: "sms" | "email";
  state: "pending" | "processing" | "sent" | "failed";
  attempts: number;
  sentAt: string | null;
  createdAt: string;
};
