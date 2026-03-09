"use client";

import { useEffect, useState } from "react";

export function useOrgLogos() {
  const [logos, setLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/orgs/logos")
      .then((r) => r.json())
      .then(setLogos)
      .catch(() => {});
  }, []);

  return logos;
}

export async function saveOrgLogo(orgId: number, url: string) {
  await fetch(`/api/orgs/${orgId}/logo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}
