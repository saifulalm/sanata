import { createApp } from "@/app";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { ensureWorkforceRoles } from "@/services/workforceRole.service";

async function bootstrap() {
  await ensureWorkforceRoles();

  const app = createApp();
  app.listen(env.port, () => {
    logger.info(`Sanata API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});
