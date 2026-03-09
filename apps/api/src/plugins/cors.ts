import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { config } from "../config/env.js";

export async function registerCors(app: FastifyInstance) {
  await app.register(cors, {
    origin: true, // Allow all origins in development
  });
}
