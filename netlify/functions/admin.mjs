import { json, regStore, listRegistrations, clean } from "../lib/store.mjs";

const authed = (req) => {
  const pw = process.env.ADMIN_PASSWORD;
  return Boolean(pw) && req.headers.get("x-admin-password") === pw;
};

export default async (req) => {
  if (!process.env.ADMIN_PASSWORD) return json({ error: "尚未設定 ADMIN_PASSWORD 環境變數" }, 500);
  if (!authed(req)) return json({ error: "密碼錯誤" }, 401);

  if (req.method === "GET") return json({ registrations: await listRegistrations() });

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    const code = clean(body.code, 10);
    const store = regStore();
    const r = await store.get(code, { type: "json" });
    if (!r) return json({ error: "找不到報名資料" }, 404);
    if (body.status) {
      if (!["pending", "paid", "cancelled"].includes(body.status)) return json({ error: "狀態錯誤" }, 400);
      r.status = body.status;
    }
    if (body.adminNote !== undefined) r.adminNote = clean(body.adminNote, 300);
    r.updatedAt = new Date().toISOString();
    await store.setJSON(code, r);
    return json({ ok: true, registration: r });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/admin" };
