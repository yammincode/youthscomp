# youthscomp 青少年攀岩系列賽

報名網站（Netlify）＋賽事規劃文件。

- [比賽規劃](docs/01-比賽規劃.md)
- [網站與賽事系統規劃](docs/02-網站規劃.md)

## 網站頁面

| 網址 | 用途 |
|---|---|
| `/` | 賽事資訊、費用、組別、規則 |
| `/register.html` | 報名：勾選要參加的場次（單場 1,500，四場套票 5,000），依年級自動分組 |
| `/lookup.html` | 報名名單：各場各組選手（姓名碼掉，如 黃Ｘ語）、繳費狀態、「登錄繳費資訊」按鈕；以報名編號查詢 |
| `/results.html` | 比賽成績：各場成績（進行中每 15 秒更新）、系列賽總排名、正式賽出場序 |
| `/admin.html` | 管理後台：報名名單／待確認繳費（確認或退回）／路線設定／成績登錄 |

### 繳費流程
待繳費 →（家長登錄匯款資訊，需手機末 4 碼驗證）→ 待確認 →（後台確認）→ 已繳費；後台退回時回到待繳費並附原因。

### 成績與排名
- 後台「路線設定」：每場的路線編號、分數、適用組別（可一鍵套用預設 24 條，相鄰組別共 4 條）。
- 後台「成績登錄」：勾選完攀路線＋嘗試次數，自動儲存；公布狀態可設 未公布／比賽進行中／成績確認中／正式成績。
- 排名：總分 → 完攀條數多 → 嘗試次數少。
- 系列賽總排名：四場都有報名的選手，依各場名次給分（100、80、65…），第四場 ×1.5，只計入「正式成績」場次。
- 正式賽出場序：第 1–3 場（正式成績）路線積分加總，低分先出場、最高分最後出場，同分固定抽籤。

報名資料存在 **Netlify Blobs**，不需要另外的資料庫。

## 部署到 Netlify

1. Netlify → **Add new site → Import an existing project** → 選 GitHub `youthscomp` repo。
2. Build 設定會自動讀取 `netlify.toml`（publish：`public`，functions：`netlify/functions`），直接 Deploy。
3. **Site configuration → Environment variables** 新增 `ADMIN_PASSWORD`（後台密碼），然後重新部署一次。
4. 打開 `https://<你的網站>.netlify.app/admin.html` 用密碼登入。

## 要改的設定

全部集中在 [`shared/config.mjs`](shared/config.mjs)：

- `EVENTS`：各場日期（`date`）、是否開放報名（`open: false` 即截止）
- `PRICE_PER_EVENT` / `PRICE_ALL_EVENTS`：費用
- `DIVISIONS`、`GENDER_SPLIT_THRESHOLD`：組別與拆組門檻
- `PAYMENT_INFO`：**匯款銀行帳號（目前是假資料，上線前一定要改）**

## 本機測試

```bash
npm install
```

```bash
node dev-server.mjs
```

打開 http://localhost:8888 ，後台密碼預設 `test123`。（也可以用 `npx netlify dev`。）
