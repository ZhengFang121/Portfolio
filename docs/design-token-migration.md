# Design Token 遷移紀錄（2026-10-14）

這次整理保留既有五色、字型、字級、間距、RWD、路由、作品資料與進場動畫。全域 Token 依七個分類排列；基礎值供語意設定引用，真正跨頁共用的元件契約才保留全域。單一元件的數值直接放回元件，只有狀態切換或跨元件繼承才保留局部變數。

## 數量與計算範圍

| 範圍                               | 修改前 | 修改後 |
| ---------------------------------- | -----: | -----: |
| `tokens.css` 的 `:root` 全域 Token |    102 |     73 |
| `@theme inline` 具名映射           |     10 |      6 |
| 元件局部／動態獨立名稱             |      5 |     10 |
| 全專案自有 CSS 變數獨立名稱合計    |    117 |     89 |

不重複計算語意局部覆寫、RWD 覆寫；不計 `--color-*` 的 Tailwind 重設指令、第三方 Tailwind／PrimeVue 自動產生的變數。全域數量變化為 102 − 31 個元件／頁面私有設定 − 3 個無實際用途設定 + 5 個共用尺度 = 73。全專案 18 個名稱完成遷移（16 個全域、2 個按鈕局部），沒有相容別名。

## 新增全域 Token

| 名稱                     | 值與用途                     |
| ------------------------ | ---------------------------- |
| `--font-weight-regular`  | 400，首頁標題與共用按鈕      |
| `--font-weight-semibold` | 600，全站標題                |
| `--radius-lg`            | 1.125rem，窄版主要區塊／頁尾 |
| `--radius-xl`            | 1.5rem，桌機主要區塊／頁尾   |
| `--radius-full`          | 9999px，共用按鈕膠囊         |

按鈕先前的 999px 改用指定的 9999px 尺度，現有尺寸下仍渲染成相同膠囊；這是預期的 computed style 差異，須另外以截圖確認外觀。

## 重新命名

下表舊名稱只作遷移紀錄，不是可用的 Token。

| 舊名稱                     | 新名稱                                   |
| -------------------------- | ---------------------------------------- |
| `--font-system`            | `--font-family-system`                   |
| `--font-portfolio`         | `--font-family-portfolio`                |
| `--font-body`              | `--font-family-body`                     |
| `--font-heading`           | `--font-family-heading`                  |
| `--font-size-small`        | `--font-size-sm`                         |
| `--font-size-body`         | `--font-size-md`                         |
| `--font-size-subtitle`     | `--font-size-lg`                         |
| `--font-size-section`      | `--font-size-xl`                         |
| `--font-size-title`        | `--font-size-2xl`                        |
| `--radius-small`           | `--radius-sm`                            |
| `--radius-medium`          | `--radius-md`                            |
| `--tracking-body`          | `--letter-spacing-body`                  |
| `--tracking-heading`       | `--letter-spacing-heading`               |
| `--spacing-gutter`         | `--layout-gutter`                        |
| `--content-section-red`    | `--content-section-background`           |
| `--content-section-yellow` | `--content-section-alternate-background` |
| `--view-more-background`   | `--button-background`                    |
| `--view-more-color`        | `--button-color`                         |

## 移回元件／頁面的 31 個全域設定

原本數值、公式與配色搬回各自擁有者。單純只用一次的設定改為 CSS 屬性或直接引用既有 Token，不再為每個屬性保留私有別名。

| 擁有者           | 原全域 Token                                                                                                             | 整理方式                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `AppFooter.vue`  | `--footer-background`、`--footer-color`、`--footer-min-height`                                                           | 原五色引用與 4.375rem 直接由頁尾管理；圓角仍共用內容區塊設定                              |
| `BaseCard.vue`   | `--card-color`、`--card-border-color`、`--card-action-color`、`--card-action-hover-color`、`--card-focus-color`          | 移為 `.base-card` 局部契約，仍供 WorkCard 與內部文字／連結繼承                            |
| `BaseCard.vue`   | `--card-surface-background`、`--card-subtle-background`                                                                  | 兩個 variant 直接引用 `--color-surface`、`--color-surface-subtle`                         |
| `BaseCard.vue`   | `--card-padding`、`--card-radius`、`--card-border-width`、`--card-shadow`                                                | 直接引用 `--space-6`、`--radius-panel`，保留 1px 邊框與 none 陰影                         |
| `BaseButton.vue` | `--view-more-min-height`、`--view-more-padding-block`、`--view-more-padding-inline`                                      | 元件保留 3.125rem、`--space-2`、`--space-12`                                              |
| `BaseButton.vue` | `--view-more-radius`、`--view-more-font-size`、`--view-more-font-weight`、`--view-more-line-height`                      | 改引用 `--radius-full`、`--font-size-lg`、`--font-weight-regular`，元件保留 1.5 行高      |
| `BaseButton.vue` | `--view-more-cream-background`、`--view-more-cream-color`、`--view-more-red-background`、`--view-more-red-color`         | 兩個 variant 直接設定局部 `--button-background`／`--button-color`，保留焦點與 active 引用 |
| `WorkCard.vue`   | `--work-card-cover-ratio`                                                                                                | 保留元件內 4 / 3                                                                          |
| `HomePage.vue`   | `--home-heading-font-size`、`--home-heading-color`、`--home-intro-color`、`--home-content-gap`、`--home-hero-min-height` | 原兩個 clamp()、藍色與 `--space-12` 回到首頁 scoped style                                 |

## 刪除的無用途設定

- `--motion-easing-feedback`：沒有消費者；不影響 GSAP 進場 easing。
- `--layout-max-width` 與 `--spacing-section`：只供全專案沒有使用的 `.container`、`.section-stack`；一併移除這兩個規則與窄版 spacing 覆寫。
- Tailwind 的 `--color-page`、`--color-ink`、`--color-muted`、`--color-panel`：沒有對應 utility class 使用；移除不必要的額外映射。五色色盤與 `font-sans` 對應保留。

## 刻意保留的契約與作用域

- `--shell-*`、`--intro-*`：固定品牌、導覽、內容區及 GSAP 量測定位點共用，保留原公式、比例、safe-area、899px／480px 斷點。`useIntro.ts` 使用實際 DOM 量測，沒有字串 CSS Token 動態讀取需要改名。
- `--content-section-*`：各頁及頁尾共用；背景名稱改為用途語意，保留紅黃交替。窄版 `--content-section-padding-inline` 必須在 `.app-shell` 重新引用局部 gutter，因自訂屬性相依值會在宣告元素解析，不能誤刪這個重綁定。
- `--color-*`：不同用途的同色語意保留。紅／黃內容區、占位區及 BaseCard 的局部覆寫是刻意的，讓文字、連結與焦點跟隨背景。
- 局部 `--card-*`、`--card-background`：BaseCard 與 WorkCard 的共用契約及兩個背景 variant；避免用已被卡片覆寫的同名語意回頭定義自身而形成循環。
- 局部 `--button-background`／`--button-color`：兩個 variant 與 hover／active／focus 共用。
- 動態 `--nav-image-ratio`／`--nav-image-weight`：AppHeader inline style 依既有圖片寬度產生，保留圖片比例與窄版 flex 分配。
- Tailwind 五色色盤映射及 `--font-sans`：明確限制可用介面色盤並整合字型，屬必要的框架入口，不能依 `var()` 次數判定無用。
- PrimeVue preset 仍使用原 Aura styled mode，所有引用均存在；原 primary／surface 動態色階映射保留，沒有新增品牌系統或依賴。

## CSS 檔案分工

`index.css` 保留基本樣式、固定外框、文件捲動、共用內容色塊與占位／文字規則。導覽、頁尾、列表及作品詳情的專有規則移回對應元件，保留 components layer。

`main.ts` 先匯入全域樣式再匯入 App，確保 layer 順序先被註冊。這是搬移元件樣式後必須維持的載入契約：CSS layer 依首次宣告決定順序，若先建立 components，再宣告 base，base 的重設可能蓋過元件內距與顏色。

ProjectGrid 的 style 只管理自身 `.project-grid`，採非 scoped 寫法，保留原有選擇器；避免 scope id 穿過 WorkCard 的 custom RouterLink 根節點造成 Vue 屬性繼承警告。

## 一致性檢查

使用暫存 PostCSS 分析腳本解析全部自有 CSS／Vue 宣告與 var()、TypeScript／PrimeVue 引用、inline 動態名稱、selector／media scope，並人工檢查跨元件繼承。沒有留下單次使用的工具、套件或測試依賴。

- 未定義引用、已移除舊名的執行時殘留：0。
- 未使用的全域／局部 Token：0（必要 Tailwind 入口依框架用途判定）。
- 同 selector／media scope 的重複宣告、循環引用：0。
- 非 Palette 的原始介面色碼、新增色彩：0。
- RWD 與局部語意覆寫均有使用者；未把刻意覆寫視為衝突。
- `App.vue`、`useIntro.ts`、Router 與作品資料維持原始內容；PrimeVue 原引用全部有效。

## 驗證結果

| 檢查                                       | 結果與範圍                                                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run type-check`                       | 通過                                                                                                                                     |
| `npm run lint`                             | 通過，0 warnings                                                                                                                         |
| `npm run build`                            | 通過，正式輸出成功                                                                                                                       |
| `npm run verify`                           | 通過，13 個路由／HTML 渲染案例與既有進場邏輯檢查；無 Vue 屬性繼承警告                                                                    |
| `npm run format:check`、`git diff --check` | 通過                                                                                                                                     |
| Token 靜態檢查                             | 通過，73 個全域 Token／89 個自有獨立名稱，無失效引用、舊名殘留或循環                                                                     |
| Chrome RWD 回歸                            | 通過，13 個網址 × 9 組視窗 = 117 組；所有元素位置與尺寸一致，無水平溢出                                                                  |
| 前後畫面比對                               | 通過，30 對 PNG 檔案逐位元組相同，亦檢視桌機與窄版代表畫面                                                                               |
| 正常動畫與互動                             | 通過，6 組視窗的兩次獨立按鍵／滾輪、慣性防跳階段、捲動固定定位、hover／active／focus、兩種按鈕與卡片配色、PrimeVue 按鈕及 Reduced Motion |
| 觸控模擬                                   | 通過，390 × 844、768 × 1024 的獨立滑動階段；同一次持續滑動不跳階段                                                                       |
| 執行時變數作用域                           | 通過，上述兩組觸控視窗的 73 個 root Token、卡片、按鈕及動態導覽變數均解析為有效值                                                        |
| 實體手機、Safari、螢幕閱讀器               | 未執行，Chrome 無頭模式不能取代這些環境                                                                                                  |

117 組視窗為 1440 × 1024、768 × 1024、390 × 844、898 × 800、899 × 800、900 × 800、1440 × 600、768 × 480、390 × 480。
涵蓋首頁、About、Works、GraphicWorks、六個作品、未知作品與兩種未知頁面路徑。

正常互動的 6 組視窗為 1440 × 1024、768 × 1024、390 × 844、899 × 800、900 × 800、390 × 480。確認內容與 Footer 在文件中捲動，品牌／導覽固定，主要區塊和 Footer 在原斷點切換 24px／18px 圓角。

Computed style 比對中只有兩類預期／非可見差異：首頁兩個按鈕的半徑數值由 999px 換為 9999px；主內容因載入時焦點狀態差異，有部分 outline-offset 為 0px／4px，但 `#main-content:focus` 仍是無輪廓，不影響畫面或元素尺寸。30 對截圖完全一致，互動焦點另行驗證。

測試腳本、原始碼基準、瀏覽器 JSON 與前後截圖位於本機 `/private/tmp/portfolio-token-refactor/`，沒有加入專案依賴或永久測試工具。此目錄為暫存資料，系統可能清除。

## 限制與注意事項

- 已完成 Chrome 無頭模式的真實瀏覽器檢查；沒有宣稱完成實體手機、Safari 或螢幕閱讀器 QA。
- 作品資料仍為占位，實際作品圖片、分類等未出現分支只作靜態樣式檢查，待真實內容提供後應補做視覺檢查。
- BaseCard 的 subtle variant 目前沒有頁面資料案例，以相同卡片元素切換 variant class 驗證配色；Props 與 RouterLink 模板維持原內容。
- 保留 `package-lock.json`、`skills-lock.json` 與第三方 Skills；未新增套件、變更路由／作品資料，亦未 commit、push 或發布。
