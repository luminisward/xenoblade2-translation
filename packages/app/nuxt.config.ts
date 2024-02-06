import fs from 'node:fs'
import path from 'node:path'
import { defineNuxtConfig } from 'nuxt/config'

const langDir = 'locales'
const locales = fs.readdirSync(langDir).map((file) => ({
  code: path.basename(file, '.ts'),
  file,
}))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig: {
    dbPath: '../bdat/dist/data.db', // dev path
  },
  modules: ['@nuxtjs/i18n', 'nuxt-primevue', '@nuxtjs/tailwindcss', '@vueuse/nuxt'],
  css: ['primevue/resources/themes/aura-dark-green/theme.css', 'primeicons/primeicons.css'],
  i18n: {
    langDir,
    locales,
    detectBrowserLanguage: { useCookie: false },
  },
  primevue: {
    cssLayerOrder: 'tailwind-base, primevue, tailwind-utilities',
  },
})
