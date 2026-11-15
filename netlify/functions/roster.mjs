import { EVENTS } from "../../shared/config.mjs";
import { categoriesFor, maskName } from "../../shared/scoring.mjs";
import { json, listRegistrations } from "../lib/store.mjs";

// 公開報名名單（姓名碼掉）
export default async (req) => {
  const eventId = new URL(req.url).searchParams.get("event") || EVENTS[0].id;
  if (!EVENTS.some((e) => e.id === eventId)) return json({ error: "場次錯誤" }, 400);
  const regs = await listRegistrations();
  const categories = categoriesFor(regs, eventId).map((c) => ({
    key: c.key,
    label: c.label,
    rows: c.members.map((r) => ({
      code: r.code,
      name: maskName(r.athlete.name),
      school: r.athlete.school,
      status: r.status,
      events: r.events,
      amount: r.amount,
    })),
  }));
  return json({ event: eventId, categories });
};

export const config = { path: "/api/roster" };
