import { json, regStore, normPhone, clean } from "../lib/store.mjs";

// 家長查詢報名狀態 / 回報匯款末五碼（需報名編號＋監護人手機）
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await req.json().catch(() => ({}));
  const code = clean(body.code, 10).toUpperCase();
  const phone = normPhone(body.phone);
  const store = regStore();
  const r = code ? await store.get(code, { type: "json" }) : null;
  if (!r || r.guardian.phone !== phone) return json({ error: "查無資料，請確認報名編號與手機號碼" }, 404);

  if (body.transferLast5 !== undefined) {
    const last5 = String(body.transferLast5).replace(/\D/g, "");
    if (last5.length !== 5) return json({ error: "請輸入 5 位數字" }, 400);
    if (r.status === "pending") {
      r.transferLast5 = last5;
      r.transferReportedAt = new Date().toISOString();
      await store.setJSON(code, r);
    }
  }

  return json({
    code: r.code,
    athleteName: r.athlete.name,
    division: r.division,
    events: r.events,
    amount: r.amount,
    status: r.status,
    transferLast5: r.transferLast5,
    createdAt: r.createdAt,
  });
};

export const config = { path: "/api/lookup" };
