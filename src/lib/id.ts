function bytes(): string {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function uid(prefix = "id"): string {
  const raw = crypto.randomUUID?.() ?? bytes();
  return `${prefix}_${raw.replace(/-/g, "").slice(0, 8)}`;
}
