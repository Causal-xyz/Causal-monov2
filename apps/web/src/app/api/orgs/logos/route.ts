import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

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

export async function GET() {
  return NextResponse.json(await readStore());
}
