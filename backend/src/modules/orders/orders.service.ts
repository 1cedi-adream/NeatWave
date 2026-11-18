import { and, eq, inArray, sql, sum } from "drizzle-orm";
import { db } from "@/db/index.js";
import { env } from "@/config/env.js";
import {
  basketOptions,
  customers,
  inAppNotifications,
  notificationJobs,
  orderLines,
  orders,
  orderStatusHistory,
  payments,
  receipts,
  servicePrices,
  services,
  tenantSettings,
} from "@/db/schema/index.js";
import { AppError, notFound } from "@/utils/errors.js";
import { logger } from "@/utils/logger.js";
import { createSecureToken, hashToken } from "@/utils/token.utils.js";
import {
  calculateLineTotal,
  calculateOrderTotals,
  validateStatusTransition,
} from "./orders.utils.js";
import { enqueueRealtimeEvent } from "@/modules/realtime/realtime.service.js";
import { realtimeRooms } from "@/modules/realtime/realtime.types.js";

type CreateInput = {
  customerId: string;
  dueAt?: Date;
  discountPesewas: number;
  taxBasisPoints?: number;
  notes?: string;
  lines: { serviceId: string; quantity?: number; basketOptionId?: string }[];
};

export async function createOrder(
  tenantId: string,
  userId: string,
  input: CreateInput,
) {
  const serviceIds = [
    ...new Set(input.lines.map((orderLine) => orderLine.serviceId)),
  ];

  const [available, settings, customerRows] = await Promise.all([
    db
      .select()
      .from(services)
      .where(
        and(
          eq(services.tenantId, tenantId),
          eq(services.active, true),
          inArray(services.id, serviceIds),
        ),
      ),
    db
      .select()
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, tenantId)),
    db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, input.customerId),
          eq(customers.tenantId, tenantId),
          eq(customers.active, true),
        ),
      ),
  ]);

  if (available.length !== serviceIds.length)
    throw new AppError(
      400,
      "INVALID_SERVICE",
      "One or more services are unavailable.",
    );

  const setting = settings[0];

  if (!setting)
    throw new AppError(
      500,
      "MISSING_SETTINGS",
      "Tenant settings are unavailable.",
    );

  if (!customerRows[0]) throw notFound("Customer");

  const details = await Promise.all(
    input.lines.map(async (line) => {
      const service = available.find(
        (availableService) => availableService.id === line.serviceId,
      )!;
      const [price] = await db
        .select()
        .from(servicePrices)
        .where(eq(servicePrices.serviceId, service.id));
      if (!price)
        throw new AppError(
          400,
          "INVALID_PRICING",
          "Service pricing is incomplete.",
        );
      let basket: typeof basketOptions.$inferSelect | undefined;
      if (service.pricingModel === "basket") {
        if (!line.basketOptionId)
          throw new AppError(
            400,
            "BASKET_REQUIRED",
            "A basket option is required.",
          );
        [basket] = await db
          .select()
          .from(basketOptions)
          .where(
            and(
              eq(basketOptions.id, line.basketOptionId),
              eq(basketOptions.serviceId, service.id),
              eq(basketOptions.active, true),
            ),
          );
        if (!basket)
          throw new AppError(
            400,
            "INVALID_BASKET",
            "Basket option is unavailable.",
          );
      }

      const snapshot = {
        unitPricePesewas: price.unitPricePesewas ?? undefined,
        basePricePesewas: price.basePricePesewas ?? undefined,
        includedItemCount: price.includedItemCount ?? undefined,
        overagePricePesewas: price.overagePricePesewas ?? undefined,
        basketPricePesewas: basket?.pricePesewas,
      };

      const lineTotalPesewas = calculateLineTotal({
        model: service.pricingModel,
        quantity: line.quantity,
        ...snapshot,
      });

      return { line, service, basket, snapshot, lineTotalPesewas };
    }),
  );

  const totals = calculateOrderTotals(
    details.map((lineDetails) => lineDetails.lineTotalPesewas),
    input.discountPesewas,
    input.taxBasisPoints ?? setting.taxBasisPoints,
  );

  const trackingToken = createSecureToken();

  const data = await db.transaction(async (tx) => {
    const [next] = await tx
      .update(tenantSettings)
      .set({
        nextOrderNumber: sql`${tenantSettings.nextOrderNumber}+1`,
        nextReceiptNumber: sql`${tenantSettings.nextReceiptNumber}+1`,
        updatedAt: new Date(),
      })
      .where(eq(tenantSettings.tenantId, tenantId))
      .returning({
        order: tenantSettings.nextOrderNumber,
        receipt: tenantSettings.nextReceiptNumber,
      });

    if (!next) throw new Error("Sequence allocation failed");

    const orderNumber = `WD-${String(next.order - 1).padStart(4, "0")}`,
      receiptNumber = `RC-${String(next.receipt - 1).padStart(4, "0")}`;

    const [order] = await tx
      .insert(orders)
      .values({
        tenantId,
        customerId: input.customerId,
        orderNumber,
        trackingTokenHash: hashToken(trackingToken),
        trackingToken,
        dueAt:
          input.dueAt ??
          new Date(Date.now() + setting.defaultCompletionHours * 3_600_000),
        ...totals,
        notes: input.notes,
        createdBy: userId,
      })
      .returning();

    if (!order) throw new Error("Order creation failed");

    await tx.insert(orderLines).values(
      details.map((lineDetails) => ({
        orderId: order.id,
        serviceId: lineDetails.service.id,
        serviceName: lineDetails.service.name,
        pricingModel: lineDetails.service.pricingModel,
        quantity: lineDetails.line.quantity?.toString(),
        basketOptionId: lineDetails.basket?.id,
        basketName: lineDetails.basket?.name,
        pricingSnapshot: lineDetails.snapshot,
        unitPricePesewas: lineDetails.snapshot.unitPricePesewas,
        lineTotalPesewas: lineDetails.lineTotalPesewas,
      })),
    );

    await tx
      .insert(orderStatusHistory)
      .values({ orderId: order.id, toStatus: "Received", changedBy: userId });

    await tx.insert(inAppNotifications).values({
      tenantId,
      title: "New order received",
      message: `${order.orderNumber} was created.`,
      kind: "order",
    });

    const customer = customerRows[0]!;
    const notificationPayload = {
      orderNumber,
      status: "Received",
      businessName: setting.businessName,
      trackingUrl: new URL(
        `/track/${trackingToken}`,
        env.FRONTEND_URL,
      ).toString(),
    };
    if (setting.smsEnabled && customer.smsConsent && customer.phone) {
      await tx
        .insert(notificationJobs)
        .values({
          tenantId,
          orderId: order.id,
          channel: "sms",
          recipient: customer.phone,
          template: "order-status",
          payload: notificationPayload,
          idempotencyKey: `${order.id}:Received:sms`,
        })
        .onConflictDoNothing();
    }
    if (setting.emailEnabled && customer.email && customer.emailConsent) {
      await tx
        .insert(notificationJobs)
        .values({
          tenantId,
          orderId: order.id,
          channel: "email",
          recipient: customer.email,
          template: "order-status",
          payload: notificationPayload,
          idempotencyKey: `${order.id}:Received:email`,
        })
        .onConflictDoNothing();
    }

    await tx.insert(receipts).values({
      tenantId,
      orderId: order.id,
      receiptNumber,
      snapshot: {
        businessName: setting.businessName,
        address: setting.address,
        phone: setting.phone,
        email: setting.email,
        footer: setting.receiptFooter,
        showContact: setting.showContactOnReceipt,
        currency: setting.currency,
        ...totals,
      },
    });

    await enqueueRealtimeEvent(tx, {
      rooms: [realtimeRooms.tenant(tenantId)],
      type: "orders.changed",
      payload: { orderId: order.id, customerId: order.customerId },
    });
    await enqueueRealtimeEvent(tx, {
      rooms: [realtimeRooms.tracking(order.trackingTokenHash)],
      type: "tracking.order-status.changed",
      payload: {
        orderNumber: order.orderNumber,
        status: order.status,
        changedAt: order.createdAt.toISOString(),
      },
    });
    await enqueueRealtimeEvent(tx, {
      rooms: [realtimeRooms.tenant(tenantId)],
      type: "notifications.changed",
      payload: {},
    });
    await enqueueRealtimeEvent(tx, {
      rooms: [realtimeRooms.tenant(tenantId)],
      type: "notifications.delivery.changed",
      payload: { orderId: order.id },
    });
    await enqueueRealtimeEvent(tx, {
      rooms: [realtimeRooms.admin],
      type: "platform.summary.changed",
      payload: { tenantId },
    });

    return order;
  });

  return { ...data, trackingToken, trackingUrl: `/track/${trackingToken}` };
}

export async function changeStatus(
  tenantId: string,
  userId: string,
  orderId: string,
  to: typeof orders.$inferInsert.status,
  note?: string,
) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
    .limit(1);
  if (!order) throw notFound("Order");
  validateStatusTransition(order.status, to!);
  const [setting] = await db
    .select()
    .from(tenantSettings)
    .where(eq(tenantSettings.tenantId, tenantId));
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, order.customerId));
  const queuedChannels: string[] = [];
  const skippedChannels: { channel: string; reason: string }[] = [];
  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: to!, updatedAt: new Date() })
      .where(eq(orders.id, order.id));
    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      fromStatus: order.status,
      toStatus: to!,
      changedBy: userId,
      note,
    });
    await tx.insert(inAppNotifications).values({
      tenantId,
      title:
        to === "Ready for Pickup"
          ? "Order ready for pickup"
          : "Order status updated",
      message: `${order.orderNumber} moved to ${to}.`,
      kind: to === "Ready for Pickup" ? "ready" : "order",
    });
    if (to === "Ready for Pickup" && setting) {
      const payload = {
        orderNumber: order.orderNumber,
        status: to,
        businessName: setting.businessName,
        trackingUrl: new URL(
          `/track/${order.trackingToken}`,
          env.FRONTEND_URL,
        ).toString(),
        ...(order.trackingToken
          ? {
              receiptPdfUrl: `${env.PUBLIC_API_URL.replace(/\/$/, "")}/public/tracking/${encodeURIComponent(order.trackingToken)}/receipt.pdf`,
            }
          : {}),
      };
      const idempotencyKeyPrefix = `${order.id}:${to}`;
      if (setting.smsEnabled && customer?.smsConsent && customer.phone) {
        await tx
          .insert(notificationJobs)
          .values({
            tenantId,
            orderId: order.id,
            channel: "sms",
            recipient: customer.phone,
            template: "order-status",
            payload,
            idempotencyKey: `${idempotencyKeyPrefix}:sms`,
          })
          .onConflictDoNothing();
        queuedChannels.push("sms");
      } else {
        skippedChannels.push({
          channel: "sms",
          reason: !setting.smsEnabled
            ? "disabled"
            : !customer?.smsConsent
              ? "no_consent"
              : "missing_phone",
        });
      }
      if (setting.emailEnabled && customer?.email && customer.emailConsent) {
        await tx
          .insert(notificationJobs)
          .values({
            tenantId,
            orderId: order.id,
            channel: "email",
            recipient: customer.email,
            template: "order-status",
            payload,
            idempotencyKey: `${idempotencyKeyPrefix}:email`,
          })
          .onConflictDoNothing();
        queuedChannels.push("email");
      } else {
        skippedChannels.push({
          channel: "email",
          reason: !setting.emailEnabled
            ? "disabled"
            : !customer?.email
              ? "missing_email"
              : "no_consent",
        });
      }
    } else {
      skippedChannels.push({
        channel: "all",
        reason: setting ? "status_not_notifiable" : "missing_settings",
      });
    }
    await enqueueRealtimeEvent(tx, {
      rooms: [realtimeRooms.tenant(tenantId)],
      type: "orders.changed",
      payload: { orderId: order.id, customerId: order.customerId },
    });
    await enqueueRealtimeEvent(tx, {
      rooms: [realtimeRooms.tenant(tenantId)],
      type: "notifications.changed",
      payload: {},
    });
    await enqueueRealtimeEvent(tx, {
      rooms: [realtimeRooms.tenant(tenantId)],
      type: "notifications.delivery.changed",
      payload: { orderId: order.id },
    });
    if (order.trackingTokenHash) {
      await enqueueRealtimeEvent(tx, {
        rooms: [realtimeRooms.tracking(order.trackingTokenHash)],
        type: "tracking.order-status.changed",
        payload: {
          orderNumber: order.orderNumber,
          status: to,
          changedAt: new Date().toISOString(),
        },
      });
    }
  });
  logger.info(
    { orderId, status: to, queuedChannels, skippedChannels },
    "Order status notification jobs evaluated",
  );
}
export async function paymentSummary(orderId: string) {
  const rows = await db
    .select({ kind: payments.kind, total: sum(payments.amountPesewas) })
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .groupBy(payments.kind);
  const paid = Number(
    rows.find((paymentRow) => paymentRow.kind === "payment")?.total ?? 0,
  );
  const refunded = Number(
    rows.find((paymentRow) => paymentRow.kind === "refund")?.total ?? 0,
  );
  return {
    paidPesewas: paid,
    refundedPesewas: refunded,
    netPaidPesewas: paid - refunded,
  };
}
