export const orderStatuses = [
  "Received",
  "Washing",
  "Drying",
  "Ironing",
  "Ready for Pickup",
  "Out for Delivery",
  "Completed",
  "Cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
