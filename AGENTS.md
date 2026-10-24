# ZhengFang's Portfolio 專案規範

## 溝通與範圍

- 使用繁體中文與台灣用語，修改時簡要說明原因，讓前端初學者能理解。
- 先閱讀相關檔案；保留既有修改，不做無關重構。資訊不足時先詢問，不猜測作品事實。
- 已有固定品牌圖、圖片導覽、原生頁面捲動、首頁兩階段 GSAP 進場及共用作品介紹 Modal；維持目前視覺與互動。六個作品的名稱、設計年份、簡介、分類、封面與介紹內容已建立，以 `src/data/projects.ts` 中已確認的資料為準，未提供的資訊不得自行補寫。
- 未經授權不要發布、建立遠端儲存庫、commit 或 push；不加入 Pinia、後端、資料庫或登入。
- 不沿用跑者菲迪的品牌色彩、角色或遊戲化介面。

## 技術與責任分工

- Vue 3 Composition API，使用 `<script setup lang="ts">` 與 TypeScript；避免 `any`。
- 使用 Vite、Vue Router、PrimeVue styled mode、Tailwind CSS v4 與 `@lucide/vue`。
- `src/data/projects.ts` 是主要作品資料來源；`ProjectDetail.vue` 是六個作品共用的介紹版型；作品類型使用 `categories: string[]`。
- 六個作品的頂部基本順序統一為設計年份、作品名稱、作品簡介、作品類型標籤、作品封面，使用同一組元件與樣式；不同內容章節不得改變頂部版型。似顏繪使用 `cover.jpg` 作為封面，展示區使用 `imageLayout: 'stack'` 依序呈現 `01.jpg`～`06.jpg`，避免重複封面素材。
- 作品路由由 `projects.ts` 產生；`slug` 保留作品識別碼，`routeSlug` 提供語意網址，舊 `/works/project-01`～`project-06` 必須轉址。未知作品走 404。
- 作品僅由共用 Modal 呈現，不新增獨立作品頁。`App.vue` 與 `useProjectModal.ts` 統一管理作品路由、背景與歷史；Home／Works 使用共用卡片及原生連結語意。一般開啟保留背景與捲動，直接網址／重新整理／新分頁以 Works 為背景；關閉須同步網址，有本次來源紀錄才返回，否則 replace 至 Works。
- 不捏造作品成果、客戶、年份、個人經歷或聯絡資料；缺資料使用 null 與明確占位。

## 設計與樣式

- 優先順序：使用者當次需求 → 本 AGENTS.md → 專案 Design Token 與既有架構 → 選用 Skills 的通用原則。
- 改 UI 前先讀 `src/styles/tokens.css`、`src/styles/index.css`、`src/theme/primevue.ts`。
- 全站共用色彩、字體、間距與圓角集中於 `tokens.css`；元件／頁面專用設定放回所屬 Vue。PrimeVue 主題沿用語意 Token，不另建品牌系統。
- 重視字體一致性、字距、行距、留白、閱讀寬度與響應式一致性。
- 行動版優先；控制保留足夠點擊區域、可見鍵盤焦點、正確標題階層與替代文字。
- 全站介面限用五色：`#A71F24`、`#B9DAE8`、`#FBEDB3`、`#000000`、`#FFFFFF`。作品圖片保留原始色彩。
- 色彩集中於 `tokens.css`，不另加灰階、衍生色、半透明混色或其他色盤；互動狀態使用這五色搭配底線、外框區分。
- 字型已確認；五色色盤已確認，完整視覺版型仍待確認。
- PrimeVue 元件按需匯入；Tailwind 用於版面與工具樣式，不安裝另一套 UI 元件庫。
- `@primevue/themes` 依使用者要求保留，但官方已停止維護；程式直接使用相容的 `@primeuix/themes`。

## Design Token 與 CSS 責任分工

- 採三層架構：基礎值（Palette、字級、間距、圓角）→ 用途語意（文字、連結、控制項等）→ 元件契約。不同用途即使目前同色，也保留必要的語意區分。
- `tokens.css` 保持單檔，依 Colors、Typography、Spacing、Radius、Layout、Motion、Components 七區排序；`@theme inline` 只映射同一套五色色盤與共用字型，不恢復 Tailwind 預設色盤。
- CSS 自訂屬性使用英文小寫 kebab-case。全域使用 `--palette-*`、`--color-*`、`--font-family-*`、`--font-size-*`、`--font-weight-*`、`--line-height-*`、`--letter-spacing-*`、`--space-*`、`--radius-*`、`--layout-*`、`--motion-*` 等前綴；局部契約以元件用途命名，如 `--button-*`、`--card-*`、`--nav-image-*`。
- 中英文、數字與標點統一優先使用 Chiron GoRound TC Variable，保留系統 fallback；內文與標題共用 `--font-family-portfolio`。字級依序使用 `sm`（0.875rem）、`md`（1rem）、`lg`（1.25rem）、`xl`（既有 clamp）、`2xl`（既有 clamp）；字重、行距與字距優先沿用現有 Token，保留頁面特殊字級與響應式公式。
- 基礎間距使用 `--space-1/2/3/4/6/8/12/16`，依序對應 0.25/0.5/0.75/1/1.5/2/3/4rem。共用頁面留白使用 `--layout-gutter`；特殊尺寸與 `clamp()` 可留在所屬樣式，不為符合尺度而改變距離。
- 圓角使用 `--radius-sm/md/lg/xl/full`：6/12/18/24px 與 9999px。控制項及卡片依 `--radius-control`、`--radius-panel` 選用；主要紅、黃內容區塊與藍色頁尾共用 `--content-section-radius`，桌機 24px，899px 以下 18px；BaseButton 保留膠囊形狀。
- `index.css` 負責 Tailwind 入口、全域基礎、固定外框、原生文件捲動、跨頁內容區塊、共用文字／占位樣式及 RWD；元件私有樣式放在自身 style，優先 scoped，搬移時保留 CSS layer 優先順序。ProjectGrid 只管理自身 `.project-grid` class，使用非 scoped style，避免 scope id 穿過 WorkCard 的 custom RouterLink 根節點造成 Vue 警告。
- 新增元件先引用現有基礎與語意 Token；單純只用一次的高度、比例、邊框等可直接寫在元件。只有狀態切換、繼承或跨元件協作需要時才建立局部變數；BaseCard 的局部 `--card-*` 供 WorkCard 使用，並覆寫內部文字、連結與焦點語意。
- 新增頁面的特殊字級、顏色、最小高度與排版放在頁面 scoped style；跨頁共用規則優先重用既有 class／元件，不複製規則或擴充無用途的全域 Token。
- 同一概念只維護一個權威來源，不任意建立重複 Token、無用途別名或舊名相容層；色碼只宣告在 Palette，其他樣式引用 Token。PrimeVue 的內建色階映射仍由既有 preset 管理。
- `main.ts` 必須先匯入 `styles/index.css` 再匯入 App，先註冊 `theme, base, primevue, components, utilities` 的 layer 順序；否則元件 CSS 先建立 components layer，可能讓後載入的 base 重設覆蓋元件內距與顏色。
- Token 變更必須掃描所有原始碼、設定與文件，同步更新 CSS、Vue、inline style、TypeScript、GSAP、PrimeVue 與 Tailwind；檢查未定義／未使用變數、循環、局部覆寫、RWD 與動態來源，不能只依搜尋次數刪除。
- 保留 `--shell-*`、`--intro-*` 的全域定位契約；GSAP 透過實際定位點量測，不任意縮小作用域或改變公式。CSS 變數在宣告元素解析相依值，窄版在 `.app-shell` 重新綁定 `--content-section-padding-inline` 有其用途，不當成重複刪除。
- 維持 899px 與 480px 的既有斷點、safe-area 計算、動畫起終點與時序。內容使用全頁原生捲動，不改回內部捲動容器。

## Skills

- 按需求選用 Skills，不要求每次全部啟用。首次使用前讀對應 SKILL.md。
- 沿用全域設計 Skills，不重複安裝、不自動更新：frontend-design、design-system、impeccable、web-design-guidelines、brand、design、design-dna、ui-styling、ui-ux-pro-max。
- 全域來源位於 `/Users/zhengfang/.agents/skills/<name>/SKILL.md`；換電腦後先確認可讀性。
- 通用設計原則需轉成 Vue 3＋TypeScript＋PrimeVue＋Tailwind；忽略 React、shadcn、Radix 等不相容範例。
- 專案動畫 Skills 放在 `.agents/skills/`，由 skills CLI 管理，保留其產生的 `skills-lock.json`。
- GSAP：gsap-core 負責基礎、gsap-frameworks 負責 Vue 生命週期、gsap-performance 負責效能、gsap-scrolltrigger 負責捲動、gsap-timeline 負責時序。
- motion-design 負責動態目的、節奏與編排；不因安裝 Skill 就加入多餘動畫或 Lottie runtime。
- 首頁已有兩階段 GSAP／APNG 進場；保留獨立手勢階段，觸控板慣性與按鍵連發不可跳過階段。不因整理 Token 新增或改寫動畫。

## 動畫與生命週期

- 必須支援 `prefers-reduced-motion`；不可讓動畫阻擋閱讀、操作或保留不可見的主要內容。
- GSAP 在 `onMounted` 後建立，選擇器限縮於元件根節點；以 `gsap.matchMedia()` 管理偏好，在 `onUnmounted` 執行 `revert()`。
- 正確清理 timelines、ScrollTriggers、事件監聽器與 observer；只清理元件擁有的資源。
- 優先動畫 transform／opacity，避免每幀觸發 layout。

## 驗證與交付

- 執行 `npm run type-check`、`npm run lint`、`npm run build`，修正本次變更造成的錯誤。
- 執行 `npm run verify`，包含主要路由／HTML、六作品新網址與舊網址轉址，以及兩階段進場邏輯；靜態檢查不等於瀏覽器 QA。Token 遷移需提供前後對照並檢查全專案引用；瀏覽器可用時比對 1440、768、390px、899px 斷點前後及矮螢幕。
- 不格式化第三方 `.agents/skills/`、package-lock.json 或 skills-lock.json。
- 檢查首頁、Works 列表、六個作品 Modal（包含似顏繪）、新舊網址、已移除的 `/graphic-works`、未知作品與 404。瀏覽器可用時執行 `npm run verify:modal`，檢查桌機／平板／手機版面、另開分頁、直接網址、重新整理、上一頁／下一頁、X／Esc／遮罩關閉、焦點及背景捲動還原，無法使用時明確標示未驗證。
- 保留 package-lock.json。部署前處理 history fallback、正式網站網址與 SEO；占位階段維持 noindex。
- 回報固定包含「完成事項」、「修改檔案與原因」、「驗證結果」、「注意事項」。
