import { getStore } from "@netlify/blobs";

export const regStore = () => getStore({ name: "registrations", consistency: "strong" });

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export async function listRegistrations() {
  const store = regStore();
  const { blobs } = await store.list();
  const items = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  return items.filter(Boolean).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export const normPhone = (s) => String(s || "").replace(/[^\d]/g, "");
export const clean = (s, max = 100) => String(s ?? "").trim().slice(0, max);
