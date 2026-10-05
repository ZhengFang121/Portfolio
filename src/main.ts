import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import App from './App.vue'
import { router } from './router'
import { portfolioPreset } from './theme/primevue'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/chiron-goround-tc'
import './styles/index.css'
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
