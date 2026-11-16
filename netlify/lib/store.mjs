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

// 路線設定與成績公布狀態：settings store，key = routes-<eventId> / status-<eventId>
export const settingsStore = () => getStore({ name: "settings", consistency: "strong" });
// 成績：每場一個 store，key = 報名編號
export const resultStore = (eventId) => getStore({ name: `results-${eventId}`, consistency: "strong" });

export async function loadEventData(eventId) {
  const s = settingsStore();
  const rs = resultStore(eventId);
  const [routes, status, { blobs }] = await Promise.all([
    s.get(`routes-${eventId}`, { type: "json" }),
    s.get(`status-${eventId}`),
    rs.list(),
  ]);
  const entries = {};
  await Promise.all(blobs.map(async (b) => (entries[b.key] = await rs.get(b.key, { type: "json" }))));
  return { routes: routes || [], status: status || "hidden", entries };
}
