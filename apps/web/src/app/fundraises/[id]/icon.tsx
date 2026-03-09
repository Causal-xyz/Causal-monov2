import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon({ params }: { params: { id: string } }) {
  try {
    const logosPath = path.join(process.cwd(), "data", "org-logos.json");
    const logos: Record<string, string> = JSON.parse(
      await readFile(logosPath, "utf-8")
    );
    const logoRelPath = logos[params.id];

    if (logoRelPath) {
      const filePath = path.join(process.cwd(), "public", logoRelPath);
      const imgData = await readFile(filePath);
      const base64 = imgData.toString("base64");
      const mimeType = logoRelPath.endsWith(".png") ? "image/png" : "image/jpeg";

      return new ImageResponse(
        (
          <img
            src={`data:${mimeType};base64,${base64}`}
            width={32}
            height={32}
            style={{ borderRadius: 8, objectFit: "cover" }}
          />
        ),
        { ...size }
      );
    }
  } catch {}

  // Fallback: green "C"
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#22c55e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "Georgia, serif",
        }}
      >
        C
      </div>
    ),
    { ...size }
  );
}
