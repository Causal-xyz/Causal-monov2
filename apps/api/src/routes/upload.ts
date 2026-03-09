import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { createWriteStream, mkdirSync } from "fs";
import { join, extname } from "path";
import { pipeline } from "stream/promises";

const UPLOADS_DIR = join(process.cwd(), "uploads");
mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadRoutes(app: FastifyInstance) {
  app.post("/upload/image", async (req, reply) => {
    try {
      const data = await req.file();

      if (!data) {
        return reply.status(400).send({ error: "No file provided" });
      }

      if (!ALLOWED_MIME.has(data.mimetype)) {
        return reply.status(400).send({ error: `File type not allowed. Allowed: ${Array.from(ALLOWED_MIME).join(", ")}` });
      }

      if (data.file.bytesRead > MAX_FILE_SIZE) {
        return reply.status(413).send({ error: "File too large (max 5 MB)" });
      }

      const ext = extname(data.filename) || ".jpg";
      const filename = `${randomUUID()}${ext}`;
      const dest = join(UPLOADS_DIR, filename);

      await pipeline(data.file, createWriteStream(dest));

      const host = req.headers.host ?? "localhost:3001";
      const protocol = req.headers["x-forwarded-proto"] ?? "http";
      const url = `${protocol}://${host}/uploads/${filename}`;

      return reply.send({ url });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: "Upload failed" });
    }
  });
}
