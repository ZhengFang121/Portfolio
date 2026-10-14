import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
// Aura 保留元件結構；預設色階改為五色色盤，不產生深淺衍生色。
const colorSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
const colorFamilies = [
  'emerald',
  'green',
  'lime',
  'red',
  'orange',
  'amber',
  'yellow',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
] as const

const primitiveColors = Object.fromEntries(
  colorFamilies.map((family) => [
    family,
    Object.fromEntries(
      colorSteps.map((step) => {
        const lightColor = ['orange', 'amber', 'yellow'].includes(family)
          ? 'var(--palette-yellow)'
          : 'var(--palette-blue)'
        const darkColor = ['red', 'pink', 'rose'].includes(family)
          ? 'var(--palette-red)'
          : 'var(--palette-black)'
        return [step, step < 500 ? lightColor : darkColor]
      }),
    ),
  ]),
)

const surfaceColors = Object.fromEntries(
  [0, ...colorSteps].map((step) => [
    step,
    step === 0
      ? 'var(--color-surface)'
      : step < 200
        ? 'var(--color-surface-subtle)'
        : 'var(--palette-black)',
  ]),
)

export const portfolioPreset = definePreset(Aura, {
  primitive: primitiveColors,
  semantic: {
    disabledOpacity: '1',
    primary: Object.fromEntries(
      colorSteps.map((step) => [
        step,
        step === 50
          ? 'var(--palette-blue)'
          : step === 100
            ? 'var(--palette-yellow)'
            : 'var(--palette-red)',
      ]),
    ),
    overlay: {
      select: { shadow: 'none' },
      popover: { shadow: 'none' },
      modal: { shadow: 'none' },
      navigation: { shadow: 'none' },
    },
    colorScheme: {
      light: {
        surface: surfaceColors,
        mask: { background: 'var(--palette-black)', color: 'var(--palette-white)' },
        formField: {
          invalidBorderColor: 'var(--palette-red)',
          invalidPlaceholderColor: 'var(--palette-red)',
          shadow: 'none',
        },
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
