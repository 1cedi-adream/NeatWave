import type { Order } from "../types/order";

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function downloadOrdersCsv(orders: Order[]) {
  const rows = [
    ["Order", "Customer", "Phone", "Items", "Due by", "Status", "Total"],
    ...orders.map((order) => [order.id, order.name, order.phone, order.items, order.due, order.status, order.amount]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "fresh-and-fold-orders.csv";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
