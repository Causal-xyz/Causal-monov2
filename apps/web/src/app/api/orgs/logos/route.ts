import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const STORE_PATH = join(process.cwd(), "data", "org-logos.json");

export async function GET() {
  try {
    const raw = await readFile(STORE_PATH, "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({});
  }
}
