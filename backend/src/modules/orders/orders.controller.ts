import type { Request, Response } from "express";
import { and, count, desc, eq, gte, ilike, lt, or } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  customers,
  orderLines,
  orders,
  orderStatusHistory,
  payments,
  receipts,
} from "@/db/schema/index.js";
import { createPaginationMeta } from "@/utils/pagination.js";
import { notFound, AppError } from "@/utils/errors.js";
import * as service from "./orders.service.js";
import * as receiptService from "./receipt.service.js";
import { enqueueRealtimeEvent } from "@/modules/realtime/realtime.service.js";
import { realtimeRooms } from "@/modules/realtime/realtime.types.js";
export async function create(req: Request, res: Response) {
  res.status(201).json({
    data: await service.createOrder(
      req.auth!.tenantId!,
      req.auth!.userId,
      req.body,
    ),
  });
}
export async function list(req: Request, res: Response) {
  const { page, pageSize, search, status, customerId } =
    req.query as unknown as {
      page: number;
      pageSize: number;
      search?: string;
      status?: typeof orders.$inferSelect.status;
      customerId?: string;
    };
  const filter = and(
    eq(orders.tenantId, req.auth!.tenantId!),
    status ? eq(orders.status, status) : undefined,
    customerId ? eq(orders.customerId, customerId) : undefined,
    search
      ? or(
          ilike(orders.orderNumber, `%${search}%`),
          ilike(customers.fullName, `%${search}%`),
        )
      : undefined,
  );
  const base = db
    .select({
      order: orders,
      customerName: customers.fullName,
      customerPhone: customers.phone,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId));
  const [data, total] = await Promise.all([
    base
      .where(filter)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ value: count() })
      .from(orders)
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(filter),
  ]);
  res.json({
    data,
    meta: createPaginationMeta(page, pageSize, total[0]?.value ?? 0),
  });
}

export async function exportOrders(req: Request, res: Response) {
  const { period } = req.query as { period: string };
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  if (period === "yesterday") start.setUTCDate(start.getUTCDate() - 1);
  if (period === "last-week") start.setUTCDate(start.getUTCDate() - 7);
  if (period === "last-month") start.setUTCMonth(start.getUTCMonth() - 1);
  if (period === "last-year") start.setUTCFullYear(start.getUTCFullYear() - 1);
  const end =
    period === "today" || period === "yesterday"
      ? new Date(start.getTime() + 86_400_000)
      : now;
  const data = await db
    .select({
      order: orders,
      customerName: customers.fullName,
      customerPhone: customers.phone,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(
      and(
        eq(orders.tenantId, req.auth!.tenantId!),
        period === "all-time" ? undefined : gte(orders.createdAt, start),
        period === "all-time" ? undefined : lt(orders.createdAt, end),
      ),
    )
    .orderBy(desc(orders.createdAt))
    .limit(10_000);

  res.json({ data });
}
export async function detail(req: Request, res: Response) {
  const tenantId = req.auth!.tenantId!;
  const [record] = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(and(eq(orders.id, req.params.id!), eq(orders.tenantId, tenantId)))
    .limit(1);
  if (!record) throw notFound("Order");
  const { order, customer } = record;
  const [lines, statusHistory, paymentRows, receipt] = await Promise.all([
    db.select().from(orderLines).where(eq(orderLines.orderId, order.id)),
    db
      .select()
      .from(orderStatusHistory)
      .where(eq(orderStatusHistory.orderId, order.id))
      .orderBy(orderStatusHistory.createdAt),
    db
      .select()
      .from(payments)
      .where(
        and(eq(payments.orderId, order.id), eq(payments.tenantId, tenantId)),
      )
      .orderBy(desc(payments.createdAt)),
    db
      .select()
      .from(receipts)
      .where(
        and(eq(receipts.orderId, order.id), eq(receipts.tenantId, tenantId)),
      )
      .limit(1),
  ]);
  const summary = await service.paymentSummary(order.id);
  res.json({
    data: {
      ...order,
      customer,
      trackingUrl: order.trackingToken ? `/track/${order.trackingToken}` : null,
      lines,
      statusHistory,
      payments: paymentRows,
      receipt: receipt[0] ?? null,
      ...summary,
      balancePesewas: order.totalPesewas - summary.netPaidPesewas,
    },
  });
}
export async function downloadReceipt(req: Request, res: Response) {
  const pdf = await receiptService.generateTenantOrderReceipt(
    req.params.id!,
    req.auth!.tenantId!,
  );
  res
    .set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${req.params.id}-receipt.pdf"`,
      "Cache-Control": "no-store",
    })
    .send(pdf);
}
export async function status(req: Request, res: Response) {
  await service.changeStatus(
    req.auth!.tenantId!,
    req.auth!.userId,
    req.params.id!,
    req.body.status,
    req.body.note,
  );
  res.status(204).send();
}
export async function pay(req: Request, res: Response) {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.id, req.params.id!),
        eq(orders.tenantId, req.auth!.tenantId!),
      ),
    )
    .limit(1);
  if (!order) throw notFound("Order");
  const summary = await service.paymentSummary(order.id);
  if (req.body.amountPesewas > order.totalPesewas - summary.netPaidPesewas)
    throw new AppError(
      400,
      "OVERPAYMENT",
      "Payment exceeds the outstanding balance.",
    );
  const data = await db.transaction(async (transaction) => {
    const [createdPayment] = await transaction
      .insert(payments)
      .values({
        ...req.body,
        tenantId: req.auth!.tenantId!,
        orderId: order.id,
        recordedBy: req.auth!.userId,
      })
      .returning();
    if (!createdPayment) throw new Error("Payment creation failed");
    await enqueueRealtimeEvent(transaction, {
      rooms: [realtimeRooms.tenant(req.auth!.tenantId!)],
      type: "orders.changed",
      payload: { orderId: order.id, customerId: order.customerId },
    });
    return createdPayment;
  });
  res.status(201).json({ data });
}
export async function refund(req: Request, res: Response) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.id, req.params.paymentId!),
        eq(payments.orderId, req.params.id!),
        eq(payments.tenantId, req.auth!.tenantId!),
        eq(payments.kind, "payment"),
      ),
    )
    .limit(1);
  if (!payment) throw notFound("Payment");
  const refunded = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.parentPaymentId, payment.id),
        eq(payments.kind, "refund"),
      ),
    );
  const refundedAmount = refunded.reduce(
    (runningTotal, refundPayment) => runningTotal + refundPayment.amountPesewas,
    0,
  );
  if (req.body.amountPesewas > payment.amountPesewas - refundedAmount)
    throw new AppError(
      400,
      "INVALID_REFUND",
      "Refund exceeds the refundable amount.",
    );
  const data = await db.transaction(async (transaction) => {
    const [createdRefund] = await transaction
      .insert(payments)
      .values({
        tenantId: req.auth!.tenantId!,
        orderId: payment.orderId,
        kind: "refund",
        method: payment.method,
        amountPesewas: req.body.amountPesewas,
        reference: req.body.reference,
        parentPaymentId: payment.id,
        recordedBy: req.auth!.userId,
      })
      .returning();
    if (!createdRefund) throw new Error("Refund creation failed");
    await enqueueRealtimeEvent(transaction, {
      rooms: [realtimeRooms.tenant(req.auth!.tenantId!)],
      type: "orders.changed",
      payload: { orderId: payment.orderId },
    });
    return createdRefund;
  });
  res.status(201).json({ data });
}
