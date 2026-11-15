import { json, regStore, clean } from "../lib/store.mjs";

// 家長登錄繳費資訊：報名編號＋監護人手機末 4 碼驗證 → 狀態改為「待確認」
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const body = await req.json().catch(() => ({}));
  const code = clean(body.code, 10).toUpperCase();
  const last4 = String(body.phoneLast4 || "").replace(/\D/g, "");
  const store = regStore();
  const r = code ? await store.get(code, { type: "json" }) : null;
  if (!r || last4.length !== 4 || !r.guardian.phone.endsWith(last4)) return json({ error: "手機末 4 碼不正確" }, 403);
  if (r.status === "paid") return json({ error: "此報名已確認繳費" }, 409);
  if (r.status === "cancelled") return json({ error: "此報名已取消" }, 409);

  const last5 = String(body.last5 || "").replace(/\D/g, "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || "") ? body.date : "";
  const amount = Number(body.amount);
  const errors = [];
  if (last5.length !== 5) errors.push("請輸入匯款帳號末 5 碼");
  if (!date) errors.push("請填寫匯款日期");
  if (!Number.isInteger(amount) || amount <= 0) errors.push("請填寫匯款金額");
  if (errors.length) return json({ error: errors.join("\n") }, 400);

  r.payReport = { last5, date, amount, at: new Date().toISOString() };
  r.transferLast5 = last5;
  r.status = "reported";
  delete r.rejectReason;
  await store.setJSON(code, r);
  return json({ ok: true, status: r.status });
};

export const config = { path: "/api/pay" };
