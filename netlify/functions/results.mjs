import { EVENTS } from "../../shared/config.mjs";
import { eventResults, seriesStandings, startOrder } from "../../shared/scoring.mjs";
import { json, listRegistrations, loadEventData } from "../lib/store.mjs";

// 公開成績：?event=e1 | ?view=series | ?view=startorder
export default async (req) => {
  const p = new URL(req.url).searchParams;
  const regs = await listRegistrations();
  const view = p.get("view");

  if (view === "series" || view === "startorder") {
    const all = Object.fromEntries(await Promise.all(EVENTS.map(async (e) => [e.id, await loadEventData(e.id)])));
    return json(view === "series" ? seriesStandings(regs, all) : startOrder(regs, all));
  }

  const eventId = p.get("event");
  if (!EVENTS.some((e) => e.id === eventId)) return json({ error: "場次錯誤" }, 400);
  const data = await loadEventData(eventId);
  if (data.status === "hidden") return json({ event: eventId, status: "hidden", categories: [] });
  const categories = eventResults(regs, eventId, data).map((c) => ({
    ...c,
    rows: c.rows.map(({ code, athlete, ...r }) => r),
  }));
  return json({ event: eventId, status: data.status, routes: data.routes, categories });
};

export const config = { path: "/api/results" };
