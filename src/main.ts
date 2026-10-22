// 先註冊全站 CSS layer 順序，再載入含元件樣式的 App，避免 base 蓋過 components。
import './styles/index.css'
import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import { router } from './router'
import { portfolioPreset } from './theme/primevue'
import '@fontsource-variable/chiron-goround-tc'
createApp(App)
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: portfolioPreset,
      options: {
        darkModeSelector: false,
        cssLayer: { name: 'primevue', order: 'theme, base, primevue, components, utilities' },
      },
    },
  })
  .mount('#app')
