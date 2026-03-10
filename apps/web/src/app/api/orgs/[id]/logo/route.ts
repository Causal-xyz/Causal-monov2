import { NextRequest, NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

async function readStore(): Promise<Record<string, string>> {
  try {
    const { blobs } = await list({ prefix: "org-logos.json" });
    if (blobs.length === 0) return {};
    const latest = blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
    const res = await fetch(latest.url);
    return await res.json();
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, string>) {
  await put("org-logos.json", JSON.stringify(store), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = await readStore();
  return NextResponse.json({ url: store[id] ?? null });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }
  const store = await readStore();
  store[id] = url;
  await writeStore(store);
  return NextResponse.json({ ok: true, url });
}
