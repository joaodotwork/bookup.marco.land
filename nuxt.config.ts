// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/content',
    '@nuxt/scripts',
  ],

  css: ['~/assets/css/main.css'],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-11-27',

  content: {
    markdown: {
      anchorLinks: false,
    },
  },

  scripts: {
    registry: {
      plausibleAnalytics: {
        domain: process.env.NUXT_PLAUSIBLE_DOMAIN!,
        scriptInput: {
          src: process.env.NUXT_PLAUSIBLE_SCRIPT_INPUT!,
        },
      },
    },
  },

  /**
   * ! TODO: Remove this when its fixed: https://github.com/nuxt/ui/issues/2922
   */
  vite: {
    optimizeDeps: {
      include: ['color'],
    },
  },
})
