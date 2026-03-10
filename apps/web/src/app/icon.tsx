import { ImageResponse } from "next/og";
import { list } from "@vercel/blob";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  try {
    const { blobs } = await list({ prefix: "org-logos.json" });
    if (blobs.length > 0) {
      const res = await fetch(blobs[0].url);
      const logos: Record<string, string> = await res.json();
      const logoUrl = logos["9"];

      if (logoUrl) {
        const imgRes = await fetch(logoUrl);
        const imgData = await imgRes.arrayBuffer();
        const base64 = Buffer.from(imgData).toString("base64");
        const mimeType = logoUrl.includes(".png") ? "image/png" : "image/jpeg";

        return new ImageResponse(
          (
            <img
              src={`data:${mimeType};base64,${base64}`}
              width={32}
              height={32}
              style={{ borderRadius: 4, objectFit: "cover" }}
            />
          ),
          { ...size }
        );
      }
    }
  } catch {}

  // Fallback: green "C"
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 4,
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
