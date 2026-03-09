import Fastify from "fastify";
import { registerCors } from "./plugins/cors.js";
import { healthRoutes } from "./routes/health.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(registerCors);
  app.register(healthRoutes);

  return app;
}
