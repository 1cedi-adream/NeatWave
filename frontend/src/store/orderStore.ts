import { create } from "zustand";
import { sampleOrders } from "../features/orders/data/sampleOrders";
import type { OrderStatus } from "../constants/orderStatuses";
import type { Order, Receipt } from "../features/orders/types/order";
import { formatCurrency } from "../lib/formatCurrency";

type OrderStore = {
  orders: Order[];
  createOrder: (
    name: string,
    phone: string,
    items: string,
    amountDue: number,
    payment: string,
  ) => Receipt;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: sampleOrders,
  createOrder: (name, phone, items, amountDue, payment) => {
    const id = `WD-${2482 + Math.max(0, get().orders.length - sampleOrders.length)}`;
    const amount = formatCurrency(amountDue);
    const initials = name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    set((state) => ({
      orders: [
        {
          id,
          name,
          phone,
          initials,
          items,
          due: "Today, 5:00 PM",
          status: "Received",
          tone: "violet",
          amount,
        },
        ...state.orders,
      ],
    }));
    return { id, name, phone, items, amount, payment };
  },
  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map((order) => order.id === orderId ? { ...order, status } : order),
  })),
}));
