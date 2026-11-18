import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),
  FRONTEND_URL: z.url().default("http://localhost:5173"),
  PUBLIC_API_URL: z.url().default("http://localhost:4000/api/v1"),
  SOCKET_ALLOWED_ORIGINS: z.string().optional(),

  MNOTIFY_API_KEY: z.string().optional(),
  MNOTIFY_SENDER_ID: z.string().default("NeatWave"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default("NeatWave <no-reply@example.com>"),

  WORKER_POLL_MS: z.coerce.number().int().min(1000).default(5000),

  SUPERADMIN_NAME: z.string().min(2).optional(),
  SUPERADMIN_EMAIL: z.email().optional(),
  SUPERADMIN_PASSWORD: z.string().min(8).optional(),
});

export const env = envSchema.parse(process.env);
