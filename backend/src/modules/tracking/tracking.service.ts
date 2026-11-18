import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  orderLines,
  orders,
  orderStatusHistory,
  tenantSettings,
} from "@/db/schema/index.js";
import { notFound } from "@/utils/errors.js";
import { hashToken } from "@/utils/token.utils.js";

export async function getTrackingDetails(trackingToken: string) {
  const [order] = await db
    .select({
      id: orders.id,
      tenantId: orders.tenantId,
      orderNumber: orders.orderNumber,
      status: orders.status,
      dueAt: orders.dueAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.trackingTokenHash, hashToken(trackingToken)))
    .limit(1);

  if (!order) throw notFound("Tracking link");

  const [businessRows, lines, history] = await Promise.all([
    db
      .select({
        businessName: tenantSettings.businessName,
        phone: tenantSettings.phone,
        email: tenantSettings.email,
      })
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, order.tenantId))
      .limit(1),
    db
      .select({
        serviceName: orderLines.serviceName,
        quantity: orderLines.quantity,
        basketName: orderLines.basketName,
      })
      .from(orderLines)
      .where(eq(orderLines.orderId, order.id)),
    db
      .select({
        status: orderStatusHistory.toStatus,
        createdAt: orderStatusHistory.createdAt,
      })
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(orderStatusHistory.createdAt),
  ]);

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    dueAt: order.dueAt,
    createdAt: order.createdAt,
    business: businessRows[0],
    lines,
    history,
  };
}
