# ZhengFang's Portfolio

Fang 的作品集專案。目前完成環境與頁面骨架，正式視覺方向與作品內容待確認。
`package.json` 名稱為 `zhengfang-portfolio`；Vue 3＋TypeScript＋Vite，無 Pinia、後端、資料庫或登入。

## 啟動

本次驗證環境：Node.js **24.14.1**、npm **11.11.0**。`.nvmrc` 記錄此 Node 版本。
專案支援 Node `^22.20.0 || >=24.0.0`、npm `>=10`；建議使用 Node 24 LTS。
Vite／Vue 插件需要 Node `^20.19.0 || >=22.12.0`，ESLint 10 需要 `^20.19.0 || ^22.13.0 || >=24`；Skills CLI 1.7.0 需要 `>=22.20.0`。
本次已核對 lockfile 中 162 個宣告 Node engines 的項目，皆與目前 Node 相容。

```bash
cd "/Users/zhengfang/Documents/Portfolio/ZhengFang's Portfolio"
npm run dev
```

依終端機顯示網址開啟網站，預設為 `http://localhost:5173`。路徑外層雙引號可正確處理空白與單引號。
本次已安裝完成，不必再安裝；換電腦或重新取得專案時執行 `npm ci`，沿用 `package-lock.json`。

```bash
npm run type-check
npm run lint
npm run build
npm run verify:routes
npm run format:check
npm run preview
```

`build` 先檢查型別，再輸出至 `dist/`。`preview` 僅供本機預覽建置結果。
`lint` 不自動修改檔案，且不允許 warning；需要格式化時執行 `npm run format`。
已設定 ESLint flat config、Vue／TypeScript parser 與 Prettier 衝突規則停用。
TypeScript 使用相容的 6.0 系列，因目前 typescript-eslint 要求 TypeScript `<6.1.0`，不直接升級至 7。

## 網址與頁面

| 網址                     | 用途                         |
| ------------------------ | ---------------------------- |
| `/`                      | 首頁與主要作品入口           |
| `/about`                 | 個人介紹、經歷與聯絡資訊占位 |
| `/works`                 | 六個主要作品列表             |
| `/works/project-01`      | 主要作品 01                  |
| `/works/project-02`      | 主要作品 02                  |
| `/works/project-03`      | 主要作品 03                  |
| `/works/project-04`      | 主要作品 04                  |
| `/works/project-05`      | 主要作品 05                  |
| `/works/project-06`      | 主要作品 06                  |
| `/graphic-works`         | 其他平面作品骨架             |
| 其他網址（包含未知作品） | 404 與返回首頁連結           |

`project-01` 等為暫定 slug，未猜測實際作品名稱。確認正式名稱後再決定是否更改網址。

## 結構與維護

```text
src/
  data/projects.ts          # 六個作品的型別與資料
  router/                  # 路由、頁面標題與捲動恢復
  components/              # 導覽、頁尾、作品列表、共用介紹版型
  views/                   # 首頁、介紹、作品、平面作品與 404
  styles/tokens.css        # 基礎 → 語意 → 元件 Token
  styles/index.css         # Tailwind、基本樣式與響應式版面
  theme/primevue.ts        # Aura preset 與語意 Token 對應
scripts/verify-routes.mjs   # 不需瀏覽器的路由與 HTML 渲染檢查
.agents/skills/             # 六個專案動畫 Skills
skills-lock.json           # skills CLI 產生的來源與 hash
```

六個作品共用 `ProjectDetail.vue`，修改版型會同步套用至全部作品。作品內容放在 `src/data/projects.ts`，
尚未提供的欄位保持 `null`，畫面以明確占位呈現，不捏造成果、年份或角色。
共用導覽與頁尾由 `App.vue` 管理；頁面採 lazy import。路由切換更新標題、移動主要內容焦點並恢復捲動位置。

Token 定義色彩、字體、字距、行距、間距、閱讀寬度、圓角與互動時間。現在使用中性色與系統字體，僅供骨架閱讀，
正式品牌設計尚未批准。Tailwind Vite 插件已啟用，以 `@theme inline` 對應專案語意 Token。
PrimeVue 4 使用 Aura，主色與控制圓角直接參照同一套 Token，CSS layers 保持工具樣式可覆寫。
`@lucide/vue` 已用於作品導覽圖示；GSAP 已安裝，尚未加入展示動畫，後續須尊重 reduced motion 並清理生命週期資源。

依原始要求保留 `@primevue/themes`；該套件官方標示 deprecated，程式直接匯入相容的 `@primeuix/themes` 2 系列。
[PrimeVue 主題官方文件](https://primevue.dev/theming/styled/)。不使用舊版主題入口。

## 套件版本

以下為本次實際安裝版本；可用 `npm ls --depth=0` 查閱，完整相依性鎖在 `package-lock.json`。

### 執行依賴

| 套件               | 實際安裝版本 |
| ------------------ | ------------ |
| `@lucide/vue`      | 1.52.0       |
| `@primeuix/themes` | 2.0.3        |
| `@primevue/themes` | 4.5.4        |
| `gsap`             | 3.15.0       |
| `primevue`         | 4.5.5        |
| `vue`              | 3.5.43       |
| `vue-router`       | 5.3.1        |

### 開發依賴

| 套件                     | 實際安裝版本 |
| ------------------------ | ------------ |
| `@eslint/js`             | 10.0.1       |
| `@tailwindcss/vite`      | 4.3.3        |
| `@types/node`            | 24.19.1      |
| `@vitejs/plugin-vue`     | 6.0.9        |
| `@vue/tsconfig`          | 0.9.1        |
| `eslint`                 | 10.12.0      |
| `eslint-config-prettier` | 10.1.8       |
| `eslint-plugin-vue`      | 10.11.1      |
| `globals`                | 17.13.0      |
| `prettier`               | 3.9.9        |
| `tailwindcss`            | 4.3.3        |
| `typescript`             | 6.0.3        |
| `typescript-eslint`      | 8.71.0       |
| `vite`                   | 8.3.2        |
| `vue-eslint-parser`      | 10.4.1       |
| `vue-tsc`                | 3.3.12       |

## Skills 分工

專案規範與 Token 優先於 Skill 預設。按需求選用，不必每次全部啟用；不相容的框架範例只取通用原則，
轉成 Vue 3＋TypeScript＋PrimeVue＋Tailwind，不新增 React、shadcn 或 Radix。

### 全域設計 Skills（沿用，未重新安裝或更新）

本次已確認下列九個 `SKILL.md` 可由本機讀取，位置為 `/Users/zhengfang/.agents/skills/<name>/SKILL.md`。

| Skill                 | 使用時機                     |
| --------------------- | ---------------------------- |
| frontend-design       | 確認視覺方向後的介面設計     |
| design-system         | Token 架構與共用元件規格     |
| impeccable            | 介面品質與細節調整           |
| web-design-guidelines | 可用性與無障礙檢查           |
| brand                 | 品牌識別與語氣               |
| design                | 跨設計任務的選用入口         |
| design-dna            | 分析參考設計與結構化風格     |
| ui-styling            | 樣式、響應式與可及性通用原則 |
| ui-ux-pro-max         | 字體、間距、導覽與 UX 原則   |

### Project Skills（Codex，專案範圍）

先以 Skills CLI `--list` 驗證來源與名稱、讀取 SKILL.md，再以 `--skill` 指定安裝；未使用 `--global`。
六個 Skills 實際位於 `.agents/skills/`，供 Codex 探索；請於下次任務／重新開啟此專案時使用。
來源與雜湊由 CLI 寫入 `skills-lock.json`，沒有自行編造。不要用格式化工具修改第三方 Skills。

| 來源                            | Skill              | 分工                                          |
| ------------------------------- | ------------------ | --------------------------------------------- |
| greensock/gsap-skills           | gsap-core          | Tween、easing 與 reduced motion               |
| greensock/gsap-skills           | gsap-frameworks    | Vue mounted／unmounted、selector scope 與清理 |
| greensock/gsap-skills           | gsap-performance   | Transform／opacity、減少重排與資源管理        |
| greensock/gsap-skills           | gsap-scrolltrigger | 捲動觸發、pin、scrub 與 refresh               |
| greensock/gsap-skills           | gsap-timeline      | 動畫時序、label 與播放控制                    |
| LottieFiles/motion-design-skill | motion-design      | 動態目的、節奏與編排                          |

Skills 是開發指引，不是網站執行依賴。安裝 motion-design 不代表需要安裝 Lottie player。
若要重新安裝，先檢查現有項目，來源與名稱失效時停止並回報，不換成其他 Skills。

## 驗證範圍

- 2026-10-05 實際執行：`type-check`、`lint`、`build`、`verify:routes` 與 `format:check` 全部通過；`npm ls --depth=0` 無相依性錯誤，安裝檢查回報 0 vulnerabilities。
- 本機 Vite 成功啟動；11 個頁面網址與 5 個入口／Vue／CSS 模組的 HTTP 回應通過。頁面 HTTP 200 僅代表 SPA fallback 正常，404 畫面由下列路由渲染檢查確認，未把 HTTP 200 當成真實 404 狀態碼。
- `type-check`、`lint`、`build`：程式、型別與正式建置驗證。
- `verify:routes`：Vue Memory Router＋HTML render，檢查 13 個網址，包括六個作品、未知作品、巢狀未知網址、主要導覽、h1 與返回首頁連結。
- 路由腳本供開發驗證，網站仍是 client SPA，並未啟用 SSR 部署。
- 本次瀏覽器工具回報 `No browser is available`；桌機／手機真實畫面、點擊、鍵盤流程與螢幕閱讀器尚未驗證。

## 後續內容與部署待辦

- 確認正式視覺方向、字體與品牌 Token，再規劃動畫；不沿用跑者菲迪品牌或遊戲化介面。
- 提供六個作品的名稱、分類、年份、角色、背景、過程、成果與圖片，以及其他平面作品與公開聯絡資料。
- 補上圖片尺寸、替代文字與適合的格式，非首屏圖片採 lazy loading。
- 使用 HTML5 history；部署平台須把應用路由導回 `/index.html`，否則直接開啟或重新整理作品頁會失敗。
  靜態資產遺失應回傳 404，不把所有資產請求一律改成 HTML。
- 部署子目錄時調整 Vite `base`，Router 已使用 `import.meta.env.BASE_URL`。
- 正式上線前確認網域、每頁 description、canonical、Open Graph／分享圖片、sitemap、robots.txt 與正式 favicon。
- 目前占位階段使用 `noindex, nofollow`；內容確認後才移除。當前頁面 title 在瀏覽器更新，
  正式 SEO 與分享爬蟲需要評估預渲染／SSR，並處理真正 HTTP 404（SPA fallback 預設可能回傳 200）。
- 正式上線前補做桌機／手機瀏覽器檢查、鍵盤導覽與效能驗證。

本次沒有發布網站、建立遠端儲存庫或 push。
