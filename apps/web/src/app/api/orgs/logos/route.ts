import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

async function readStore(): Promise<Record<string, string>> {
  try {
    const { blobs } = await list({ prefix: "org-logos.json" });
    if (blobs.length === 0) return {};
    const res = await fetch(blobs[0].url);
    return await res.json();
  } catch {
    return {};
  }
}

export async function GET() {
  return NextResponse.json(await readStore());
}
