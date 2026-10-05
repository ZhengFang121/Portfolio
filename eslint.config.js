import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'
import prettier from 'eslint-config-prettier/flat'
export default defineConfig([
  globalIgnores(['dist/**', 'node_modules/**', '.agents/**', '.codex/**']),
  js.configs.recommended,
  tseslint.configs.recommended,
  vue.configs['flat/recommended'],
  { files: ['src/**/*.{ts,vue}'], languageOptions: { globals: globals.browser } },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
    },
  },
  { files: ['*.{js,ts}', 'scripts/**/*.mjs'], languageOptions: { globals: globals.node } },
  prettier,
])
