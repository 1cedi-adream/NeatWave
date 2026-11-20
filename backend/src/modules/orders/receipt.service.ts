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

const PAGE_W = 400;
const OUTER = 20;
const PAD = 24;

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
  tenantId: string
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
    order.tenantId
  );
  return createReceiptPdf(receiptData);
}

async function getReceiptData(
  orderCondition: ReturnType<typeof eq>,
  tenantId: string
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
        and(eq(receipts.orderId, row.order.id), eq(receipts.tenantId, tenantId))
      )
      .limit(1),
    db
      .select()
      .from(payments)
      .where(
        and(eq(payments.orderId, row.order.id), eq(payments.tenantId, tenantId))
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
      0
    ),
  } satisfies ReceiptData;
}

function createReceiptPdf(receiptData: ReceiptData): Promise<Buffer> {
  const { order, customer, lines, settings, receipt } = receiptData;
  const snapshot = (receipt?.snapshot ?? {}) as Record<string, unknown>;

  const businessName =
    typeof snapshot.businessName === "string"
      ? snapshot.businessName
      : settings.businessName;
  const address =
    typeof snapshot.address === "string" ? snapshot.address : settings.address;
  const phone =
    typeof snapshot.phone === "string" ? snapshot.phone : settings.phone;
  const email =
    typeof snapshot.email === "string" ? snapshot.email : settings.email;
  const footer =
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

  const GREEN = "#2e694f";
  const GREEN_SOFT = "#e3efe8";
  const INK = "#1f2a24";
  const MUTED = "#7a867f";
  const BG = "#eef1ee";
  const LINE = "#c9d1cc";
  const money = (amount: number) => `${currency} ${(amount / 100).toFixed(2)}`;

  type Doc = InstanceType<typeof PDFDocument>;

  const render = (doc: Doc, pageH: number): number => {
    const cx = OUTER;
    const cw = PAGE_W - OUTER * 2;
    const ix = cx + PAD;
    const iw = cw - PAD * 2;
    const mid = PAGE_W / 2;
    let y = OUTER + 28;

    if (pageH > 0) {
      doc.rect(0, 0, PAGE_W, pageH).fill(BG);
      doc.roundedRect(cx, OUTER, cw, pageH - OUTER * 2, 18).fill("#ffffff");
    }

    const tearLine = (ty: number) => {
      doc
        .save()
        .dash(3, { space: 3 })
        .lineWidth(1)
        .strokeColor(LINE)
        .moveTo(cx + 16, ty)
        .lineTo(cx + cw - 16, ty)
        .stroke()
        .restore();
      if (pageH > 0) {
        doc.circle(cx, ty, 10).fill(BG);
        doc.circle(cx + cw, ty, 10).fill(BG);
      }
    };

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(GREEN)
      .text(businessName.toUpperCase(), ix, y, {
        width: iw,
        align: "center",
        characterSpacing: 1,
      });
    y = doc.y + 2;
    if (showContact) {
      doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
      if (address) {
        doc.text(address, ix, y, { width: iw, align: "center" });
        y = doc.y;
      }
      const contact = [phone, email].filter(Boolean).join("  ·  ");
      if (contact) {
        doc.text(contact, ix, y, { width: iw, align: "center" });
        y = doc.y;
      }
    }
    y += 18;

    const yc = y + 26;
    doc.circle(mid, yc, 26).fill(GREEN_SOFT);
    doc.circle(mid, yc, 18).fill(GREEN);
    doc
      .save()
      .lineWidth(3.5)
      .lineCap("round")
      .lineJoin("round")
      .moveTo(mid - 7, yc)
      .lineTo(mid - 2, yc + 5)
      .lineTo(mid + 8, yc - 5)
      .stroke("#ffffff")
      .restore();
    y += 52 + 14;

    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor(INK)
      .text("Thank you!", ix, y, { width: iw, align: "center" });
    y = doc.y + 4;
    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor(MUTED)
      .text("Your order receipt has been issued successfully", ix, y, {
        width: iw,
        align: "center",
      });
    y = doc.y + 22;

    tearLine(y);
    y += 24;

    const colW = iw / 2;
    const pair = (
      leftLabel: string,
      leftValue: string,
      rightLabel?: string,
      rightValue?: string,
      rightColor = INK
    ) => {
      doc.font("Helvetica").fontSize(8).fillColor(MUTED);
      doc.text(leftLabel, ix, y, { width: colW, characterSpacing: 0.8 });
      doc.text(rightLabel as string, ix + colW, y, {
        width: colW,
        align: "right",
        characterSpacing: 0.8,
      });
      doc.font("Helvetica-Bold").fontSize(12);
      doc.fillColor(INK).text(leftValue, ix, y + 13, { width: colW });
      doc.fillColor(rightColor).text(rightValue as string, ix + colW, y + 13, {
        width: colW,
        align: "right",
      });
      y += 42;
    };

    pair(
      "ORDER NUMBER",
      order.orderNumber,
      "AMOUNT",
      money(order.totalPesewas),
      GREEN
    );
    pair("RECEIPT NO.", receipt?.receiptNumber ?? "—");
    pair(
      "DATE & TIME",
      formatReceiptDate(order.createdAt),
      "DUE",
      formatReceiptDate(order.dueAt)
    );

    y += 2;
    doc.roundedRect(ix, y, iw, 52, 12).fill("#f3f5f2");
    doc.circle(ix + 30, y + 26, 16).fill(GREEN);
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#ffffff")
      .text(
        customer.fullName.trim().charAt(0).toUpperCase() || "?",
        ix + 14,
        y + 19,
        { width: 32, align: "center" }
      );
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(INK)
      .text(customer.fullName, ix + 58, y + 11, {
        width: iw - 70,
        height: 13,
        ellipsis: true,
      });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        [customer.phone, customer.email].filter(Boolean).join("  ·  "),
        ix + 58,
        y + 28,
        { width: iw - 70, height: 12, ellipsis: true }
      );
    y += 52 + 24;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text("SERVICES", ix, y, { width: iw, characterSpacing: 0.8 });
    y += 18;

    const amountW = 90;
    for (const line of lines) {
      const detail =
        line.basketName ??
        (line.quantity ? `Quantity: ${line.quantity}` : "Flat fee");

      doc.font("Helvetica-Bold").fontSize(10).fillColor(INK);
      doc.text(line.serviceName, ix, y, { width: iw - amountW - 8 });
      const afterName = doc.y;
      doc.text(money(line.lineTotalPesewas), ix + iw - amountW, y, {
        width: amountW,
        align: "right",
      });
      doc.font("Helvetica").fontSize(8.5).fillColor(MUTED);
      doc.text(detail, ix, afterName + 1, { width: iw - amountW - 8 });
      y = doc.y + 8;
      doc
        .save()
        .lineWidth(0.5)
        .strokeColor("#e6ebe7")
        .moveTo(ix, y)
        .lineTo(ix + iw, y)
        .stroke()
        .restore();
      y += 9;
    }

    y += 6;
    tearLine(y);
    y += 22;

    const totals: Array<[string, number, boolean]> = [
      ["Subtotal", order.subtotalPesewas, false],
      ...(order.discountPesewas
        ? ([["Discount", -order.discountPesewas, false]] as Array<
            [string, number, boolean]
          >)
        : []),
      ...(order.taxPesewas
        ? ([["Tax", order.taxPesewas, false]] as Array<
            [string, number, boolean]
          >)
        : []),
      ["Total", order.totalPesewas, true],
      // ["Paid", receiptData.netPaidPesewas, false],
      // ["Balance", order.totalPesewas - receiptData.netPaidPesewas, false],
    ];
    for (const [label, value, isTotal] of totals) {
      doc
        .font(isTotal ? "Helvetica-Bold" : "Helvetica")
        .fontSize(isTotal ? 13 : 10)
        .fillColor(isTotal ? GREEN : label === "Balance" ? INK : MUTED);
      doc.text(label, ix, y, { width: colW });
      doc
        .fillColor(isTotal ? GREEN : INK)
        .text(money(value), ix + colW, y, { width: colW, align: "right" });
      y += isTotal ? 26 : 19;
    }

    if (footer) {
      y += 8;
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(MUTED)
        .text(footer, ix, y, { width: iw, align: "center" });
      y = doc.y;
    }

    return y + PAD;
  };

  const probe = new PDFDocument({ size: [PAGE_W, 6000], margin: 0 });
  const contentEnd = render(probe, 0);
  probe.end();

  const pageH = Math.ceil(contentEnd + OUTER);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [PAGE_W, pageH], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    render(doc, pageH);
    doc.end();
  });
}

function formatReceiptDate(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  }).format(date);
}
