export const orderStatuses = [
  "Received",
  "Washing",
  "Ready for Pickup",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
