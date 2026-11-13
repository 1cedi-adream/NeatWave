import { create } from "zustand";

export type ShopNotification = {
  id: number;
  title: string;
  detail: string;
  time: string;
  kind: "order" | "ready" | "delay";
  read: boolean;
};

const sampleNotifications: ShopNotification[] = [
  { id: 1, title: "Order ready for pickup", detail: "WD-2480 · Jonah Miller · Dry cleaning", time: "8 minutes ago", kind: "ready", read: false },
  { id: 2, title: "New order received", detail: "WD-2481 · Amara Okafor · Wash & fold", time: "26 minutes ago", kind: "order", read: false },
  { id: 3, title: "Order needs a quality check", detail: "WD-2477 · Elena Petrova · Bedding", time: "42 minutes ago", kind: "order", read: false },
  { id: 4, title: "Order marked completed", detail: "WD-2474 · Ben Carter · Wash & press", time: "Yesterday, 4:18 PM", kind: "ready", read: true },
  { id: 5, title: "Pickup is running behind", detail: "WD-2469 · Nora James · Express wash", time: "Yesterday, 2:50 PM", kind: "delay", read: true },
];

type NotificationState = {
  items: ShopNotification[];
  markAllRead: () => void;
  toggleRead: (id: number) => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  items: sampleNotifications,
  markAllRead: () => set((state) => ({ items: state.items.map((item) => ({ ...item, read: true })) })),
  toggleRead: (id) => set((state) => ({ items: state.items.map((item) => item.id === id ? { ...item, read: !item.read } : item) })),
}));
