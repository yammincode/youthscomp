import { json, regStore, normPhone, clean } from "../lib/store.mjs";

// 家長以報名編號＋監護人手機查詢報名
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await req.json().catch(() => ({}));
  const code = clean(body.code, 10).toUpperCase();
  const phone = normPhone(body.phone);
  const r = code ? await regStore().get(code, { type: "json" }) : null;
  if (!r || r.guardian.phone !== phone) return json({ error: "查無資料，請確認報名編號與手機號碼" }, 404);
  return json({
    code: r.code,
    athleteName: r.athlete.name,
    division: r.division,
    events: r.events,
    amount: r.amount,
    status: r.status,
    payReport: r.payReport || null,
    rejectReason: r.rejectReason || "",
    createdAt: r.createdAt,
  });
};

export const config = { path: "/api/lookup" };
