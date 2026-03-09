import Fastify from "fastify";
import multipart from "@fastify/multipart";
import staticPlugin from "@fastify/static";
import { join } from "path";
import { mkdirSync } from "fs";
import { registerCors } from "./plugins/cors.js";
import { healthRoutes } from "./routes/health.js";
import { uploadRoutes } from "./routes/upload.js";

const UPLOADS_DIR = join(process.cwd(), "uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(registerCors);
  app.register(multipart);
  app.register(staticPlugin, { root: UPLOADS_DIR, prefix: "/uploads/" });
  app.register(healthRoutes);
  app.register(uploadRoutes);

  return app;
}
