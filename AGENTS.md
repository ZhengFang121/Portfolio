# ZhengFang's Portfolio 專案規範

## 溝通與範圍

- 使用繁體中文與台灣用語，修改時簡要說明原因，讓前端初學者能理解。
- 先閱讀相關檔案；保留既有修改，不做無關重構。資訊不足時先詢問，不猜測作品事實。
- 本專案目前只有環境與骨架。正式視覺方向、六個作品名稱與內容尚未確認。
- 未經授權不要發布、建立遠端儲存庫、commit 或 push；不加入 Pinia、後端、資料庫或登入。
- 不沿用跑者菲迪的品牌色彩、角色或遊戲化介面。

## 技術與責任分工

- Vue 3 Composition API，使用 `<script setup lang="ts">` 與 TypeScript；避免 `any`。
- 使用 Vite、Vue Router、PrimeVue styled mode、Tailwind CSS v4 與 `@lucide/vue`。
- `src/data/projects.ts` 是主要作品資料來源；`ProjectDetail.vue` 是六個作品共用的介紹版型。
- 作品路由由資料產生。維持穩定網址；更改 slug 前確認並規劃舊網址轉址。
- 不捏造作品成果、客戶、年份、個人經歷或聯絡資料；缺資料使用 null 與明確占位。

## 設計與樣式

- 優先順序：使用者當次需求 → 本 AGENTS.md → 專案 Design Token 與既有架構 → 選用 Skills 的通用原則。
- 改 UI 前先讀 `src/styles/tokens.css`、`src/styles/index.css`、`src/theme/primevue.ts`。
- 色彩、字體、間距與圓角集中於 Token。PrimeVue 主題沿用語意 Token，不另建品牌系統。
- 重視字體一致性、字距、行距、留白、閱讀寬度與響應式一致性。
- 行動版優先；控制保留足夠點擊區域、可見鍵盤焦點、正確標題階層與替代文字。
- 目前中性色與系統字體僅為暫定骨架，不視為已批准的視覺方向。
- PrimeVue 元件按需匯入；Tailwind 用於版面與工具樣式，不安裝另一套 UI 元件庫。
- `@primevue/themes` 依使用者要求保留，但官方已停止維護；程式直接使用相容的 `@primeuix/themes`。

## Skills

- 按需求選用 Skills，不要求每次全部啟用。首次使用前讀對應 SKILL.md。
- 沿用全域設計 Skills，不重複安裝、不自動更新：frontend-design、design-system、impeccable、web-design-guidelines、brand、design、design-dna、ui-styling、ui-ux-pro-max。
- 全域來源位於 `/Users/zhengfang/.agents/skills/<name>/SKILL.md`；換電腦後先確認可讀性。
- 通用設計原則需轉成 Vue 3＋TypeScript＋PrimeVue＋Tailwind；忽略 React、shadcn、Radix 等不相容範例。
- 專案動畫 Skills 放在 `.agents/skills/`，由 skills CLI 管理，保留其產生的 `skills-lock.json`。
- GSAP：gsap-core 負責基礎、gsap-frameworks 負責 Vue 生命週期、gsap-performance 負責效能、gsap-scrolltrigger 負責捲動、gsap-timeline 負責時序。
- motion-design 負責動態目的、節奏與編排；不因安裝 Skill 就加入多餘動畫或 Lottie runtime。
- 本次未加入展示動畫；動畫方向待後續確認。

## 動畫與生命週期

- 必須支援 `prefers-reduced-motion`；不可讓動畫阻擋閱讀、操作或保留不可見的主要內容。
- GSAP 在 `onMounted` 後建立，選擇器限縮於元件根節點；以 `gsap.matchMedia()` 管理偏好，在 `onUnmounted` 執行 `revert()`。
- 正確清理 timelines、ScrollTriggers、事件監聽器與 observer；只清理元件擁有的資源。
- 優先動畫 transform／opacity，避免每幀觸發 layout。

## 驗證與交付

- 執行 `npm run type-check`、`npm run lint`、`npm run build`，修正本次變更造成的錯誤。
- 不格式化第三方 `.agents/skills/`、package-lock.json 或 skills-lock.json。
- 檢查首頁、六個作品頁、未知作品與 404。瀏覽器可用時檢查桌機與手機，無法使用時明確標示未驗證。
- 保留 package-lock.json。部署前處理 history fallback、正式網站網址與 SEO；占位階段維持 noindex。
- 回報固定包含「完成事項」、「修改檔案與原因」、「驗證結果」、「注意事項」。
