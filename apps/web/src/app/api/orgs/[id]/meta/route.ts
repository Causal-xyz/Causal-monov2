import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "org-meta.json");

interface OrgMeta {
  website?: string;
  twitter?: string;
  description?: string;
  shortDescription?: string;
}

async function readStore(): Promise<Record<string, OrgMeta>> {
  try {
    return JSON.parse(await readFile(STORE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, OrgMeta>) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = await readStore();
  return NextResponse.json(store[id] ?? {});
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json() as OrgMeta;
  const store = await readStore();
  store[id] = { ...store[id], ...body };
  await writeStore(store);
  return NextResponse.json({ ok: true });
}
