# youthscomp 青少年攀岩系列賽

報名網站（Netlify）＋賽事規劃文件。

- [比賽規劃](docs/01-比賽規劃.md)
- [網站與賽事系統規劃](docs/02-網站規劃.md)

## 網站頁面

| 網址 | 用途 |
|---|---|
| `/` | 賽事資訊、費用、組別、規則 |
| `/register.html` | 報名：勾選要參加的場次（單場 1,500，四場套票 5,000），依年級自動分組 |
| `/lookup.html` | 家長以「報名編號＋手機」查詢狀態、回報匯款末五碼 |
| `/admin.html` | 管理後台：各場各組人數（超過 20 人自動標示需拆男女組）、改繳費狀態、匯出 CSV |

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
