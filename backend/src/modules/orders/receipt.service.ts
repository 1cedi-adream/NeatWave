import PDFDocument from "pdfkit";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  customers,
  orderLines,
  orders,
  payments,
  receipts,
  tenantSettings,
} from "@/db/schema/index.js";
import { notFound } from "@/utils/errors.js";
import { hashToken } from "@/utils/token.utils.js";

type ReceiptData = {
  order: typeof orders.$inferSelect;
  customer: typeof customers.$inferSelect;
  lines: (typeof orderLines.$inferSelect)[];
  settings: typeof tenantSettings.$inferSelect;
  receipt: typeof receipts.$inferSelect | undefined;
  netPaidPesewas: number;
};

export async function generateTenantOrderReceipt(
  orderId: string,
  tenantId: string,
) {
  const receiptData = await getReceiptData(eq(orders.id, orderId), tenantId);
  return createReceiptPdf(receiptData);
}

export async function generatePublicOrderReceipt(trackingToken: string) {
  const [order] = await db
    .select({ id: orders.id, tenantId: orders.tenantId })
    .from(orders)
    .where(eq(orders.trackingTokenHash, hashToken(trackingToken)))
    .limit(1);

  if (!order) throw notFound("Receipt link");

  const receiptData = await getReceiptData(
    eq(orders.id, order.id),
    order.tenantId,
  );
  return createReceiptPdf(receiptData);
}

async function getReceiptData(
  orderCondition: ReturnType<typeof eq>,
  tenantId: string,
) {
  const [row] = await db
    .select({ order: orders, customer: customers })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(and(orderCondition, eq(orders.tenantId, tenantId)))
    .limit(1);

  if (!row) throw notFound("Order");

  const [lines, settingsRows, receiptRows, paymentRows] = await Promise.all([
    db.select().from(orderLines).where(eq(orderLines.orderId, row.order.id)),
    db
      .select()
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, tenantId))
      .limit(1),
    db
      .select()
      .from(receipts)
      .where(
        and(
          eq(receipts.orderId, row.order.id),
          eq(receipts.tenantId, tenantId),
        ),
      )
      .limit(1),
    db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.orderId, row.order.id),
          eq(payments.tenantId, tenantId),
        ),
      ),
  ]);

  const settings = settingsRows[0];
  if (!settings) throw notFound("Business settings");

  return {
    order: row.order,
    customer: row.customer,
    lines,
    settings,
    receipt: receiptRows[0],
    netPaidPesewas: paymentRows.reduce(
      (netPaid, payment) =>
        netPaid +
        (payment.kind === "refund"
          ? -payment.amountPesewas
          : payment.amountPesewas),
      0,
    ),
  } satisfies ReceiptData;
}

function createReceiptPdf(receiptData: ReceiptData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    const { order, customer, lines, settings, receipt } = receiptData;
    const snapshot = (receipt?.snapshot ?? {}) as Record<string, unknown>;
    const receiptBusinessName =
      typeof snapshot.businessName === "string"
        ? snapshot.businessName
        : settings.businessName;
    const receiptAddress =
      typeof snapshot.address === "string"
        ? snapshot.address
        : settings.address;
    const receiptPhone =
      typeof snapshot.phone === "string" ? snapshot.phone : settings.phone;
    const receiptEmail =
      typeof snapshot.email === "string" ? snapshot.email : settings.email;
    const receiptFooter =
      typeof snapshot.footer === "string"
        ? snapshot.footer
        : settings.receiptFooter;
    const showContact =
      typeof snapshot.showContact === "boolean"
        ? snapshot.showContact
        : settings.showContactOnReceipt;
    const currency =
      typeof snapshot.currency === "string"
        ? snapshot.currency
        : settings.currency;
    const green = "#2e694f";
    const pesewas = (amount: number) =>
      `${currency} ${(amount / 100).toFixed(2)}`;

    document
      .fillColor(green)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(receiptBusinessName, { continued: false });
    document.moveDown(0.25).fillColor("#5d6a63").fontSize(10).font("Helvetica");
    if (showContact) {
      if (receiptAddress) document.text(receiptAddress);
      if (receiptPhone || receiptEmail) {
        document.text(
          [receiptPhone, receiptEmail].filter(Boolean).join("  ·  "),
        );
      }
    }

    document
      .moveDown(1.5)
      .fillColor("#1f2a24")
      .fontSize(17)
      .font("Helvetica-Bold")
      .text("Order receipt");
    document.moveDown(0.7).fontSize(10).font("Helvetica");
    document.text(`Order: ${order.orderNumber}`);
    document.text(`Receipt: ${receipt?.receiptNumber ?? "—"}`);
    document.text(`Date: ${formatReceiptDate(order.createdAt)}`);
    document.text(`Due: ${formatReceiptDate(order.dueAt)}`);
    document.text(`Status: ${order.status}`);

    document.moveDown(1).font("Helvetica-Bold").text("Customer");
    document.font("Helvetica").text(customer.fullName);
    document.text(customer.phone);
    if (customer.email) document.text(customer.email);

    document.moveDown(1.5);
    const left = 48;
    const serviceWidth = 235;
    const detailWidth = 140;
    const amountWidth = 125;
    const tableWidth = serviceWidth + detailWidth + amountWidth;
    let rowY = document.y;
    document.rect(left, rowY, tableWidth, 25).fill(green);
    document.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
    document.text("SERVICE", left + 8, rowY + 8, { width: serviceWidth - 12 });
    document.text("DETAIL", left + serviceWidth, rowY + 8, {
      width: detailWidth - 8,
    });
    document.text("AMOUNT", left + serviceWidth + detailWidth, rowY + 8, {
      width: amountWidth - 8,
      align: "right",
    });
    rowY += 25;

    for (const line of lines) {
      const detail =
        line.basketName ??
        (line.quantity ? `Quantity: ${line.quantity}` : "Flat fee");
      const rowHeight = 30;
      if (
        rowY + rowHeight >
        document.page.height - document.page.margins.bottom
      ) {
        document.addPage();
        rowY = document.y;
        document.rect(left, rowY, tableWidth, 25).fill(green);
        document.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
        document.text("SERVICE", left + 8, rowY + 8, {
          width: serviceWidth - 12,
        });
        document.text("DETAIL", left + serviceWidth, rowY + 8, {
          width: detailWidth - 8,
        });
        document.text("AMOUNT", left + serviceWidth + detailWidth, rowY + 8, {
          width: amountWidth - 8,
          align: "right",
        });
        rowY += 25;
      }
      document.rect(left, rowY, tableWidth, rowHeight).fill("#f6f6f2");
      document.fillColor("#1f2a24").font("Helvetica").fontSize(9);
      document.text(line.serviceName, left + 8, rowY + 9, {
        width: serviceWidth - 12,
      });
      document.text(detail, left + serviceWidth, rowY + 9, {
        width: detailWidth - 8,
      });
      document.text(
        pesewas(line.lineTotalPesewas),
        left + serviceWidth + detailWidth,
        rowY + 9,
        {
          width: amountWidth - 8,
          align: "right",
        },
      );
      rowY += rowHeight;
    }

    document.y = rowY + 18;
    const totalLabelX = 350;
    const totalAmountX = 435;
    const totals = [
      ["Subtotal", order.subtotalPesewas],
      ["Discount", -order.discountPesewas],
      ["Tax", order.taxPesewas],
      ["Total", order.totalPesewas],
      ["Paid", receiptData.netPaidPesewas],
      ["Balance", order.totalPesewas - receiptData.netPaidPesewas],
    ] as const;
    for (const [label, value] of totals) {
      const isTotal = label === "Total";
      document
        .font(isTotal ? "Helvetica-Bold" : "Helvetica")
        .fontSize(isTotal ? 12 : 10);
      document.text(label, totalLabelX, document.y, { width: 80 });
      document.text(pesewas(value), totalAmountX, document.y, {
        width: 125,
        align: "right",
      });
      document.moveDown(0.65);
    }

    if (receiptFooter) {
      document.moveDown(2).fillColor("#5d6a63").fontSize(9).font("Helvetica");
      document.text(receiptFooter, { align: "center" });
    }

    document.end();
  });
}

function formatReceiptDate(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  }).format(date);
}
