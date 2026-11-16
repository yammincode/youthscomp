// 賽事設定：日期確定後修改這裡即可（前端與後端共用）
export const SERIES_NAME = "青少年攀岩系列賽";

export const EVENTS = [
  { id: "e1", order: 1, name: "第一場・A22", venue: "A22", date: "待公告", format: "大亂鬥", open: true, seriesMultiplier: 1 },
  { id: "e2", order: 2, name: "第二場・明德", venue: "明德", date: "待公告", format: "大亂鬥", open: true, seriesMultiplier: 1 },
  { id: "e3", order: 3, name: "第三場・大埔", venue: "大埔", date: "待公告", format: "大亂鬥", open: true, seriesMultiplier: 1 },
  { id: "e4", order: 4, name: "第四場・A22 正式賽", venue: "A22", date: "待公告", format: "正式賽", open: true, seriesMultiplier: 1.5 },
];

export const PRICE_PER_EVENT = 1500;
export const PRICE_ALL_EVENTS = 5000; // 四場套票

// 比賽年度：年齡以「該年 12 月 31 日」計算（國際攀岩總會規則），即 年齡 = 比賽年度 − 出生年
export const SEASON_YEAR = 2027;

// 國際賽年齡分組（由易到難排列，路線梯度依此順序）
// splitByGender: 單一性別超過 GENDER_SPLIT_THRESHOLD 人時拆男女組
export const DIVISIONS = [
  { id: "K", label: "K 組", intl: "U11 兒童", minAge: 6, maxAge: 10, splitByGender: false },
  { id: "D", label: "Youth D", intl: "U13", minAge: 11, maxAge: 12, splitByGender: true },
  { id: "C", label: "Youth C", intl: "U15", minAge: 13, maxAge: 14, splitByGender: true },
  { id: "B", label: "Youth B", intl: "U17", minAge: 15, maxAge: 16, splitByGender: true },
  { id: "A", label: "Youth A", intl: "U19", minAge: 17, maxAge: 18, splitByGender: true },
].map((d) => ({ ...d, bornFrom: SEASON_YEAR - d.maxAge, bornTo: SEASON_YEAR - d.minAge }));

export const GENDER_SPLIT_THRESHOLD = 20;

// 系列賽積分：依各場名次給分（第 21 名之後皆得 PARTICIPATION_POINTS）
export const SERIES_POINTS = [100, 80, 65, 55, 50, 45, 40, 36, 32, 29, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8];
export const PARTICIPATION_POINTS = 5;

// 成績公布狀態
export const RESULT_STATUS = { hidden: "未公布", live: "比賽進行中", review: "成績確認中", final: "正式成績" };

// 匯款資訊（請改成實際帳戶）
export const PAYMENT_INFO = {
  bank: "○○銀行（代碼 000）",
  account: "0000-0000-0000",
  holder: "○○○",
  deadlineDays: 3,
};

export const ageInSeason = (birthday) => SEASON_YEAR - Number(String(birthday).slice(0, 4));

export function divisionForBirthday(birthday) {
  const age = ageInSeason(birthday);
  return DIVISIONS.find((d) => age >= d.minAge && age <= d.maxAge) || null;
}

export function priceFor(eventIds) {
  const n = eventIds.length;
  if (n === EVENTS.length) return PRICE_ALL_EVENTS;
  return n * PRICE_PER_EVENT;
}

export function publicConfig() {
  return {
    seriesName: SERIES_NAME,
    events: EVENTS,
    pricePerEvent: PRICE_PER_EVENT,
    priceAllEvents: PRICE_ALL_EVENTS,
    seasonYear: SEASON_YEAR,
    divisions: DIVISIONS,
    genderSplitThreshold: GENDER_SPLIT_THRESHOLD,
    payment: PAYMENT_INFO,
    seriesPoints: SERIES_POINTS,
    participationPoints: PARTICIPATION_POINTS,
    resultStatus: RESULT_STATUS,
  };
}
