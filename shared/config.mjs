// 賽事設定：日期確定後修改這裡即可（前端與後端共用）
export const SERIES_NAME = "青少年攀岩系列賽";

export const EVENTS = [
  { id: "e1", order: 1, name: "第一場・A22", venue: "A22", date: "待公告", format: "大亂鬥", open: true },
  { id: "e2", order: 2, name: "第二場・明德", venue: "明德", date: "待公告", format: "大亂鬥", open: true },
  { id: "e3", order: 3, name: "第三場・大埔", venue: "大埔", date: "待公告", format: "大亂鬥", open: true },
  { id: "e4", order: 4, name: "第四場・A22 正式賽", venue: "A22", date: "待公告", format: "正式賽", open: true },
];

export const PRICE_PER_EVENT = 1500;
export const PRICE_ALL_EVENTS = 5000; // 四場套票

export const GRADES = [
  { id: "e1", label: "國小一年級" },
  { id: "e2", label: "國小二年級" },
  { id: "e3", label: "國小三年級" },
  { id: "e4", label: "國小四年級" },
  { id: "e5", label: "國小五年級" },
  { id: "e6", label: "國小六年級" },
  { id: "j1", label: "國中一年級" },
  { id: "j2", label: "國中二年級" },
  { id: "j3", label: "國中三年級" },
  { id: "h1", label: "高中一年級" },
  { id: "h2", label: "高中二年級" },
  { id: "h3", label: "高中三年級" },
];

// splitByGender: 單一性別超過 GENDER_SPLIT_THRESHOLD 人時拆男女組
export const DIVISIONS = [
  { id: "G1", label: "國小 1–3 年級組", grades: ["e1", "e2", "e3"], splitByGender: false },
  { id: "G2", label: "國小 4–5 年級組", grades: ["e4", "e5"], splitByGender: true },
  { id: "G3", label: "小六・國一組", grades: ["e6", "j1"], splitByGender: true },
  { id: "G4", label: "國二・國三組", grades: ["j2", "j3"], splitByGender: true },
  { id: "G5", label: "高中組", grades: ["h1", "h2", "h3"], splitByGender: true },
];

export const GENDER_SPLIT_THRESHOLD = 20;

// 匯款資訊（請改成實際帳戶）
export const PAYMENT_INFO = {
  bank: "○○銀行（代碼 000）",
  account: "0000-0000-0000",
  holder: "○○○",
  deadlineDays: 3,
};

export function divisionForGrade(gradeId) {
  return DIVISIONS.find((d) => d.grades.includes(gradeId)) || null;
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
    grades: GRADES,
    divisions: DIVISIONS,
    genderSplitThreshold: GENDER_SPLIT_THRESHOLD,
    payment: PAYMENT_INFO,
  };
}
