export type BusinessSettings = {
  tenantId: string;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  currency: "GHS";
  timezone: string;
  taxBasisPoints: number;
  defaultCompletionHours: number;
  receiptFooter: string;
  showContactOnReceipt: boolean;
  notifyStatuses: ("Received" | "Washing" | "Ready for Pickup")[];
  smsEnabled: boolean;
  emailEnabled: boolean;
  smsSenderId: string | null;
};
