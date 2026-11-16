import { EVENTS, GRADES, divisionForGrade, priceFor } from "../../shared/config.mjs";
import { json, regStore, listRegistrations, normPhone, clean } from "../lib/store.mjs";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => CODE_CHARS[b % CODE_CHARS.length]).join("");

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "資料格式錯誤" }, 400);
  }

  const errors = [];
  const a = {
    name: clean(body.name, 30),
    gender: body.gender === "M" || body.gender === "F" ? body.gender : "",
    birthday: /^\d{4}-\d{2}-\d{2}$/.test(body.birthday || "") ? body.birthday : "",
    school: clean(body.school, 50),
    grade: GRADES.some((g) => g.id === body.grade) ? body.grade : "",
    team: clean(body.team, 50),
  };
  const g = {
    name: clean(body.guardianName, 30),
    phone: normPhone(body.guardianPhone),
    email: clean(body.guardianEmail, 100),
    emergencyName: clean(body.emergencyName, 30),
    emergencyPhone: normPhone(body.emergencyPhone),
  };
  const note = clean(body.note, 300);

  if (!a.name) errors.push("請填寫選手姓名");
  if (!a.gender) errors.push("請選擇性別");
  if (!a.birthday) errors.push("請填寫生日");
  if (!a.school) errors.push("請填寫就讀學校");
  if (!a.grade) errors.push("請選擇年級");
  if (!g.name) errors.push("請填寫監護人姓名");
  if (!/^09\d{8}$/.test(g.phone)) errors.push("監護人手機格式錯誤（09 開頭 10 碼）");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email)) errors.push("Email 格式錯誤");
  if (!g.emergencyName || g.emergencyPhone.length < 8) errors.push("請填寫緊急聯絡人與電話");
  if (!body.agreeWaiver) errors.push("請勾選同意免責聲明");
  if (!body.agreePrivacy) errors.push("請勾選同意個資使用");

  const eventIds = [...new Set(Array.isArray(body.events) ? body.events : [])].filter((id) =>
    EVENTS.some((e) => e.id === id)
  );
  if (eventIds.length === 0) errors.push("請至少選擇一場比賽");
  const closed = eventIds.filter((id) => !EVENTS.find((e) => e.id === id).open);
  if (closed.length) errors.push("所選場次已截止報名：" + closed.map((id) => EVENTS.find((e) => e.id === id).name).join("、"));

  if (errors.length) return json({ error: errors.join("\n") }, 400);

  // 重複報名檢查：同選手（姓名＋生日）、未取消的報名中已有相同場次
  const existing = await listRegistrations();
  const dup = new Set();
  for (const r of existing) {
    if (r.status === "cancelled") continue;
    if (r.athlete.name === a.name && r.athlete.birthday === a.birthday) {
      for (const id of r.events) if (eventIds.includes(id)) dup.add(id);
    }
  }
  if (dup.size) {
    return json(
      { error: "此選手已報名過：" + [...dup].map((id) => EVENTS.find((e) => e.id === id).name).join("、") + "\n如需修改請聯絡主辦單位" },
      409
    );
  }

  const division = divisionForGrade(a.grade);
  const store = regStore();
  let code;
  do code = makeCode();
  while (await store.get(code));

  const record = {
    code,
    createdAt: new Date().toISOString(),
    athlete: a,
    guardian: g,
    note,
    division: division.id,
    events: EVENTS.filter((e) => eventIds.includes(e.id)).map((e) => e.id),
    amount: priceFor(eventIds),
    status: "pending", // pending 待繳費 / paid 已繳費 / cancelled 已取消
    transferLast5: "",
  };
  await store.setJSON(code, record);
  return json({ ok: true, code, amount: record.amount, division: division.id, events: record.events });
};

export const config = { path: "/api/register" };
