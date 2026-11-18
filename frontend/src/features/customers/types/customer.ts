export type Customer = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  instructions?: string;
  smsConsent: boolean;
  emailConsent: boolean;
  active: boolean;
  createdAt: string;
};

export type CustomerInput = {
  fullName: string;
  phone: string;
  email?: string;
  instructions?: string;
  smsConsent: boolean;
  emailConsent: boolean;
};
export type CustomerOrder = {
  id: string;
  orderNumber: string;
  status: "Received" | "Washing" | "Ready for Pickup";
  dueAt: string;
  totalPesewas: number;
  createdAt: string;
};
export type CustomerDetail = Customer & { orders: CustomerOrder[] };
