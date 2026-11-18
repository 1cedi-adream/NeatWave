import nodemailer from "nodemailer";
import { env } from "@/config/env.js";

export type Message = { recipient: string; subject: string; text: string };

export interface MessageProvider {
  send(message: Message): Promise<string | undefined>;
}

export class MnotifyProvider implements MessageProvider {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
    private readonly apiKey = env.MNOTIFY_API_KEY,
  ) {}

  async send(message: Message) {
    if (!this.apiKey) throw new Error("MNOTIFY_API_KEY is not configured");

    const url = new URL("https://api.mnotify.com/api/sms/quick");

    url.searchParams.set("key", this.apiKey);

    const response = await this.fetcher(url, {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recipient: [message.recipient],
        sender: env.MNOTIFY_SENDER_ID,
        message: message.text,
        is_schedule: false,
        schedule_date: "",
      }),
    });

    const responseText = await response.text();
    if (!response.ok) throw new Error(`mNotify HTTP ${response.status}`);
    let body: {
      status?: string;
      code?: string;
      message?: string;
      summary?: { _id?: string; total_rejected?: number };
    };
    try {
      body = JSON.parse(responseText) as typeof body;
    } catch {
      throw new Error("mNotify returned invalid JSON");
    }

    if (body.status !== "success")
      throw new Error(
        `mNotify rejected the message${body.code ? ` (${body.code})` : ""}`,
      );
    if (!body.summary?._id)
      throw new Error("mNotify response did not include a campaign ID");
    if (body.summary.total_rejected)
      throw new Error("mNotify rejected one or more recipients");
    return body.summary._id;
  }
}

export class EmailProvider implements MessageProvider {
  private transporter = nodemailer.createTransport({
    pool: true,
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined,
  });

  async verify() {
    await this.transporter.verify();
  }

  async send(message: Message) {
    if (!env.SMTP_HOST) throw new Error("SMTP_HOST is not configured");
    const info = await this.transporter.sendMail({
      from: env.SMTP_FROM,
      to: message.recipient,
      subject: message.subject,
      text: message.text,
    });
    return info.messageId;
  }
}

export function validateNotificationConfiguration() {
  const missing: string[] = [];
  if (!env.MNOTIFY_API_KEY) missing.push("MNOTIFY_API_KEY");
  if (!env.SMTP_HOST) missing.push("SMTP_HOST");
  if (!env.SMTP_USER) missing.push("SMTP_USER");
  if (!env.SMTP_PASSWORD) missing.push("SMTP_PASSWORD");
  if (missing.length) {
    throw new Error(
      `Notification worker missing configuration: ${missing.join(", ")}`,
    );
  }
}

export class FakeProvider implements MessageProvider {
  async send() {
    return "fake-message-id";
  }
}
