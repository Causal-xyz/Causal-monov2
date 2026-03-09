"use client";

import { useEffect, useState } from "react";

export interface OrgMeta {
  website?: string;
  twitter?: string;
  description?: string;
  shortDescription?: string;
}

export function useOrgMetas() {
  const [metas, setMetas] = useState<Record<string, OrgMeta>>({});

  useEffect(() => {
    fetch("/api/orgs/metas")
      .then((r) => r.json())
      .then(setMetas)
      .catch(() => {});
  }, []);

  return metas;
}

export function useOrgMeta(orgId: number | string) {
  const [meta, setMeta] = useState<OrgMeta>({});

  useEffect(() => {
    fetch(`/api/orgs/${orgId}/meta`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, [orgId]);

  return meta;
}

export async function saveOrgMeta(orgId: number, data: OrgMeta) {
  await fetch(`/api/orgs/${orgId}/meta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
