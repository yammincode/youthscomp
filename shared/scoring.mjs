// 計分、排名、系列賽積分、正式賽出場序（後端共用）
import { EVENTS, DIVISIONS, GENDER_SPLIT_THRESHOLD, SERIES_POINTS, PARTICIPATION_POINTS } from "./config.mjs";

const divById = Object.fromEntries(DIVISIONS.map((d) => [d.id, d]));
const GENDER_LABEL = { M: "男子組", F: "女子組" };

// 黃小語 → 黃Ｘ語；黃語 → 黃Ｘ；歐陽小明 → 歐陽Ｘ明
export function maskName(name) {
  const c = Array.from(String(name || ""));
  if (c.length <= 1) return c.join("");
  if (c.length === 2) return c[0] + "Ｘ";
  if (c.length === 3) return c[0] + "Ｘ" + c[2];
  if (c.length === 4) return c[0] + c[1] + "Ｘ" + c[3];
  return c[0] + "Ｘ".repeat(c.length - 2) + c[c.length - 1];
}

export const athleteKey = (r) => r.athlete.name + "|" + r.athlete.birthday;
export const activeFor = (regs, eventId) => regs.filter((r) => r.status !== "cancelled" && r.events.includes(eventId));

// 該場次中需拆男女組的組別
export function splitDivisions(regs, eventId) {
  const set = new Set();
  const active = activeFor(regs, eventId);
  for (const d of DIVISIONS) {
    if (!d.splitByGender) continue;
    const list = active.filter((r) => r.division === d.id);
    const m = list.filter((r) => r.athlete.gender === "M").length;
    if (m > GENDER_SPLIT_THRESHOLD || list.length - m > GENDER_SPLIT_THRESHOLD) set.add(d.id);
  }
  return set;
}

export function categoryKey(reg, split) {
  return split.has(reg.division) ? `${reg.division}-${reg.athlete.gender}` : reg.division;
}

export function categoryLabel(key) {
  const [div, g] = key.split("-");
  return divById[div].label + (g ? `（${GENDER_LABEL[g]}）` : "");
}

// 依組別順序（男子組在前）列出所有分類，members 為報名資料
export function categoriesFor(regs, eventId) {
  const split = splitDivisions(regs, eventId);
  const active = activeFor(regs, eventId);
  const out = [];
  for (const d of DIVISIONS) {
    const keys = split.has(d.id) ? [`${d.id}-M`, `${d.id}-F`] : [d.id];
    for (const key of keys) {
      const members = active.filter((r) => categoryKey(r, split) === key);
      out.push({ key, label: categoryLabel(key), division: d.id, members });
    }
  }
  return out;
}

// 只計算屬於該組別的路線，同一路線只算一次
export function scoreEntry(entry, routes, division) {
  const valid = new Map(routes.filter((r) => r.divisions.includes(division)).map((r) => [r.id, r]));
  const tops = [...new Set(entry?.tops || [])].filter((id) => valid.has(id));
  return {
    total: tops.reduce((s, id) => s + valid.get(id).points, 0),
    tops: tops.length,
    topIds: tops,
    attempts: Number(entry?.attempts) || 0,
  };
}

// 總分高 → 完攀條數多 → 嘗試次數少；完全相同則並列
export function rankRows(rows) {
  rows.sort((a, b) => b.total - a.total || b.tops - a.tops || a.attempts - b.attempts);
  rows.forEach((r, i) => {
    const p = rows[i - 1];
    r.rank = p && p.total === r.total && p.tops === r.tops && p.attempts === r.attempts ? p.rank : i + 1;
  });
  return rows;
}

// 單場成績：data = { routes, entries: { [code]: {tops, attempts} } }
export function eventResults(regs, eventId, data) {
  return categoriesFor(regs, eventId).map((c) => {
    const rows = c.members
      .filter((r) => data.entries[r.code])
      .map((r) => ({
        code: r.code,
        athlete: athleteKey(r),
        name: r.athlete.name,
        school: r.athlete.school,
        team: r.athlete.team,
        ...scoreEntry(data.entries[r.code], data.routes, r.division),
      }));
    return { key: c.key, label: c.label, registered: c.members.length, rows: rankRows(rows) };
  });
}

export const seriesPointsFor = (rank) => (rank <= SERIES_POINTS.length ? SERIES_POINTS[rank - 1] : PARTICIPATION_POINTS);

// 系列賽總排名：只列入四場都有報名的選手；只計算已公布「正式成績」的場次
// eventData: { [eventId]: { status, routes, entries } }
export function seriesStandings(regs, eventData) {
  const active = regs.filter((r) => r.status !== "cancelled");
  const byAthlete = new Map();
  for (const r of active) {
    if (!byAthlete.has(athleteKey(r))) byAthlete.set(athleteKey(r), []);
    byAthlete.get(athleteKey(r)).push(r);
  }

  // 各場正式成績 → 選手名次
  const ranks = {};
  for (const e of EVENTS) {
    const d = eventData[e.id];
    if (!d || d.status !== "final") continue;
    ranks[e.id] = new Map();
    for (const c of eventResults(regs, e.id, d)) for (const row of c.rows) ranks[e.id].set(row.athlete, row.rank);
  }

  // 任一場拆男女組，總排名也拆
  const splitAny = new Set();
  for (const e of EVENTS) for (const d of splitDivisions(regs, e.id)) splitAny.add(d);

  const cats = new Map();
  for (const [key, list] of byAthlete) {
    const events = new Set(list.flatMap((r) => r.events));
    if (!EVENTS.every((e) => events.has(e.id))) continue;
    const latest = list[list.length - 1];
    const cat = categoryKey(latest, splitAny);
    const perEvent = EVENTS.map((e) => {
      const rank = ranks[e.id]?.get(key);
      if (!rank) return null;
      return { rank, points: Math.round(seriesPointsFor(rank) * (e.seriesMultiplier || 1) * 10) / 10 };
    });
    if (!cats.has(cat)) cats.set(cat, []);
    cats.get(cat).push({
      name: latest.athlete.name,
      school: latest.athlete.school,
      perEvent,
      total: Math.round(perEvent.reduce((s, p) => s + (p?.points || 0), 0) * 10) / 10,
    });
  }

  const out = [];
  for (const d of DIVISIONS) {
    for (const key of splitAny.has(d.id) ? [`${d.id}-M`, `${d.id}-F`] : [d.id]) {
      const rows = (cats.get(key) || []).sort((a, b) => b.total - a.total);
      rows.forEach((r, i) => (r.rank = i && rows[i - 1].total === r.total ? rows[i - 1].rank : i + 1));
      out.push({ key, label: categoryLabel(key), rows });
    }
  }
  return { finalEvents: Object.keys(ranks), categories: out };
}

const hash = (s) => {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
  return h >>> 0;
};

// 正式賽出場序：依大亂鬥場次（已公布正式成績）路線積分加總，分數低者先出場、最高分最後出場
// 同分以固定亂數排序（同一選手每次結果相同）
export function startOrder(regs, eventData) {
  const finalEvent = EVENTS.find((e) => e.format === "正式賽");
  const jamEvents = EVENTS.filter((e) => e.format === "大亂鬥" && eventData[e.id]?.status === "final");

  const points = new Map();
  for (const e of jamEvents) {
    for (const c of eventResults(regs, e.id, eventData[e.id])) {
      for (const row of c.rows) points.set(row.athlete, (points.get(row.athlete) || 0) + row.total);
    }
  }

  const categories = categoriesFor(regs, finalEvent.id).map((c) => {
    const rows = c.members
      .map((r) => ({
        name: r.athlete.name,
        school: r.athlete.school,
        points: points.get(athleteKey(r)) || 0,
        tiebreak: hash(athleteKey(r) + finalEvent.id),
      }))
      .sort((a, b) => a.points - b.points || a.tiebreak - b.tiebreak)
      .map(({ tiebreak, ...r }, i) => ({ order: i + 1, ...r }));
    return { key: c.key, label: c.label, rows };
  });

  return { finalEvent: finalEvent.id, basedOn: jamEvents.map((e) => e.id), categories };
}
