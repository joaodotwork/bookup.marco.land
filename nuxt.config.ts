// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    // 'pinia-plugin-persistedstate/nuxt', // Disabled to prevent state persistence between sessions
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
      include: ['color', 'three', 'three/examples/jsm/controls/OrbitControls'],
    },
    ssr: {
      noExternal: ['three', 'three/examples/jsm/controls/OrbitControls'],
    },
    resolve: {
      dedupe: ['three'],
    },
  },

  build: {
    transpile: ['three', 'three/examples/jsm/controls/OrbitControls'],
  },
})
