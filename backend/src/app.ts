import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { logger } from "@/utils/logger.js";
import { env } from "@/config/env.js";
import {
  authenticate,
  requireManager,
  requireSuperAdmin,
  requireTenant,
} from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "@/modules/auth/auth.routes.js";
import { adminRouter } from "@/modules/admin/admin.routes.js";
import { customersRouter } from "@/modules/customers/customers.routes.js";
import { servicesRouter } from "@/modules/services/services.routes.js";
import { ordersRouter } from "@/modules/orders/orders.routes.js";
import { settingsRouter } from "@/modules/settings/settings.routes.js";
import { staffRouter } from "@/modules/staff/staff.routes.js";
import { trackingRouter } from "@/modules/tracking/tracking.routes.js";
import { dashboardRouter } from "@/modules/dashboard/dashboard.routes.js";
import { notificationsRouter } from "@/modules/notifications/notifications.routes.js";
import { getRealtimeHealth } from "@/modules/realtime/realtime.gateway.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use(
  pinoHttp({
    logger,
    redact: [
      "req.headers.authorization",
      "req.body.password",
      "req.body.refreshToken",
      "res.headers['set-cookie']",
    ],
  }),
);

app.get("/health", (_req, res) => res.json({ data: { status: "ok" } }));
app.get("/health/realtime", async (_req, res) => {
  const realtime = await getRealtimeHealth();
  res.status(realtime.status === "degraded" ? 503 : 200).json({
    data: realtime,
  });
});
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/public/tracking", trackingRouter);
app.use("/api/v1/admin", authenticate, requireSuperAdmin, adminRouter);
app.use("/api/v1/customers", authenticate, requireTenant, customersRouter);
app.use("/api/v1/services", authenticate, requireTenant, servicesRouter);
app.use("/api/v1/orders", authenticate, requireTenant, ordersRouter);
app.use("/api/v1/settings", authenticate, requireTenant, settingsRouter);
app.use(
  "/api/v1/staff",
  authenticate,
  requireTenant,
  requireManager,
  staffRouter,
);
app.use("/api/v1/dashboard", authenticate, requireTenant, dashboardRouter);
app.use(
  "/api/v1/notifications",
  authenticate,
  requireTenant,
  notificationsRouter,
);

app.use((_req, res) =>
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Route not found." } }),
);
app.use(errorHandler);
