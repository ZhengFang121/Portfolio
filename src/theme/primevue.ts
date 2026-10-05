import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
// PrimeVue 的互動色沿用 CSS 語意 Token，不另建品牌色。
export const portfolioPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        primary: {
          color: 'var(--color-action)',
          contrastColor: 'var(--color-on-action)',
          hoverColor: 'var(--color-action-hover)',
          activeColor: 'var(--color-action-active)',
        },
        highlight: {
          background: 'var(--color-surface-subtle)',
          focusBackground: 'var(--color-surface-subtle)',
          color: 'var(--color-text)',
          focusColor: 'var(--color-text)',
        },
      },
    },
    focusRing: { color: 'var(--color-focus)', width: '2px', offset: '3px' },
  },
  components: {
    button: {
      root: {
        borderRadius: 'var(--radius-control)',
        transitionDuration: 'var(--motion-duration-feedback)',
      },
    },
  },
})
