import { and, count, eq, sum } from "drizzle-orm";
import { db } from "@/db/index.js";
import { customers, orders } from "@/db/schema/index.js";

export async function getSummary(tenantId: string) {
  const [
    orderCountRows,
    orderValueRows,
    ordersByStatus,
    customerCountRows,
    readyOrders,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(orders)
      .where(eq(orders.tenantId, tenantId)),
    db
      .select({ value: sum(orders.totalPesewas) })
      .from(orders)
      .where(eq(orders.tenantId, tenantId)),
    db
      .select({ status: orders.status, value: count() })
      .from(orders)
      .where(eq(orders.tenantId, tenantId))
      .groupBy(orders.status),
    db
      .select({ value: count() })
      .from(customers)
      .where(eq(customers.tenantId, tenantId)),
    db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.tenantId, tenantId),
          eq(orders.status, "Ready for Pickup"),
        ),
      )
      .orderBy(orders.dueAt)
      .limit(5),
  ]);

  return {
    totalOrders: orderCountRows[0]?.value ?? 0,
    totalOrderValuePesewas: Number(orderValueRows[0]?.value ?? 0),
    ordersByStatus,
    customerCount: customerCountRows[0]?.value ?? 0,
    readyOrders,
  };
}
