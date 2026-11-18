import { createServer } from "node:http";
import { app } from "@/app.js";
import { env } from "@/config/env.js";
import { logger } from "@/utils/logger.js";
import { attachRealtimeGateway } from "@/modules/realtime/realtime.gateway.js";

const httpServer = createServer(app);
const realtimeServer = attachRealtimeGateway(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "NeatWave API started");
});

function shutDown(signal: string) {
  logger.info({ signal }, "NeatWave API shutting down");
  void realtimeServer.close(() => process.exit(0));
}

process.on("SIGTERM", () => shutDown("SIGTERM"));
process.on("SIGINT", () => shutDown("SIGINT"));
