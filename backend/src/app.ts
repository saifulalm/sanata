import express, { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "@/config/env";
import { localUploadDir } from "@/lib/storage";
import apiRoutes from "@/routes";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";
import { globalApiLimiter } from "@/middleware/rateLimiters";
import { openapiSpec } from "@/config/openapi";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: env.clientUrl, credentials: true }));
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.isProd ? "combined" : "dev"));

  app.use("/api", globalApiLimiter);

  // Hanya relevan untuk driver lokal; pada S3/R2 berkas dilayani dari CDN.
  app.use("/uploads", express.static(localUploadDir));

  app.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok", brand: "Sanata" } }));

  app.use(
    "/api/docs",
    (_req: Request, res: Response, next: NextFunction) => {
      res.removeHeader("Content-Security-Policy");
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, { customSiteTitle: "Sanata Construction API Docs" })
  );

  app.use("/api", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
