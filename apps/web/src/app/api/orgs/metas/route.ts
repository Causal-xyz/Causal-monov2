import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const STORE_PATH = join(process.cwd(), "data", "org-meta.json");

export async function GET() {
  try {
    return NextResponse.json(JSON.parse(await readFile(STORE_PATH, "utf-8")));
  } catch {
    return NextResponse.json({});
  }
}
