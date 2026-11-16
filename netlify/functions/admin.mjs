import { EVENTS, DIVISIONS, RESULT_STATUS } from "../../shared/config.mjs";
import { categoriesFor } from "../../shared/scoring.mjs";
import { json, regStore, listRegistrations, clean, settingsStore, resultStore, loadEventData } from "../lib/store.mjs";

const STATUSES = ["pending", "reported", "paid", "cancelled"];
const validEvent = (id) => EVENTS.some((e) => e.id === id);

export default async (req) => {
  if (!process.env.ADMIN_PASSWORD) return json({ error: "尚未設定 ADMIN_PASSWORD 環境變數" }, 500);
  if (req.headers.get("x-admin-password") !== process.env.ADMIN_PASSWORD) return json({ error: "密碼錯誤" }, 401);

  if (req.method === "GET") {
    const eventId = new URL(req.url).searchParams.get("event");
    if (!eventId) return json({ registrations: await listRegistrations() });
    if (!validEvent(eventId)) return json({ error: "場次錯誤" }, 400);
    // 成績登錄用：路線、狀態、成績、各分類選手
    const [regs, data] = await Promise.all([listRegistrations(), loadEventData(eventId)]);
    const categories = categoriesFor(regs, eventId).map((c) => ({
      key: c.key,
      label: c.label,
      division: c.division,
      members: c.members.map((r) => ({ code: r.code, name: r.athlete.name, school: r.athlete.school })),
    }));
    return json({ ...data, categories });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await req.json().catch(() => ({}));

  switch (body.action || "setStatus") {
    case "setStatus": {
      const code = clean(body.code, 10);
      const store = regStore();
      const r = await store.get(code, { type: "json" });
      if (!r) return json({ error: "找不到報名資料" }, 404);
      if (!STATUSES.includes(body.status)) return json({ error: "狀態錯誤" }, 400);
      r.status = body.status;
      if (body.status === "pending" && body.reason) r.rejectReason = clean(body.reason, 200);
      if (body.status === "paid") {
        delete r.rejectReason;
        r.paidConfirmedAt = new Date().toISOString();
      }
      r.updatedAt = new Date().toISOString();
      await store.setJSON(code, r);
      return json({ ok: true, registration: r });
    }

    case "saveRoutes": {
      if (!validEvent(body.event)) return json({ error: "場次錯誤" }, 400);
      const divIds = DIVISIONS.map((d) => d.id);
      const routes = (Array.isArray(body.routes) ? body.routes : []).map((r) => ({
        id: clean(r.id, 10).toUpperCase(),
        points: Math.max(0, Math.round(Number(r.points) || 0)),
        divisions: [...new Set(r.divisions || [])].filter((d) => divIds.includes(d)),
      }));
      const ids = routes.map((r) => r.id);
      if (ids.some((id) => !id)) return json({ error: "路線編號不可空白" }, 400);
      if (new Set(ids).size !== ids.length) return json({ error: "路線編號重複" }, 400);
      if (routes.some((r) => !r.divisions.length)) return json({ error: "每條路線至少要屬於一個組別" }, 400);
      await settingsStore().setJSON(`routes-${body.event}`, routes);
      return json({ ok: true, routes });
    }

    case "setResultStatus": {
      if (!validEvent(body.event) || !RESULT_STATUS[body.status]) return json({ error: "參數錯誤" }, 400);
      await settingsStore().set(`status-${body.event}`, body.status);
      return json({ ok: true });
    }

    case "saveResult": {
      if (!validEvent(body.event)) return json({ error: "場次錯誤" }, 400);
      const code = clean(body.code, 10);
      const store = resultStore(body.event);
      if (body.remove) {
        await store.delete(code);
        return json({ ok: true });
      }
      const entry = {
        tops: [...new Set((body.tops || []).map((t) => clean(t, 10)))],
        attempts: Math.max(0, Math.round(Number(body.attempts) || 0)),
        updatedAt: new Date().toISOString(),
      };
      await store.setJSON(code, entry);
      return json({ ok: true, entry });
    }
  }
  return json({ error: "未知的動作" }, 400);
};

export const config = { path: "/api/admin" };
