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
      include: ['color', 'three', 'three/examples/jsm/controls/OrbitControls']
    },
    ssr: {
      noExternal: ['three', 'three/examples/jsm/controls/OrbitControls']
    },
    resolve: {
      dedupe: ['three']
    }
  },

  build: {
    transpile: ['three', 'three/examples/jsm/controls/OrbitControls'],
  },
  
  // Ensure Three.js is only loaded client-side
  experimental: {
    clientFallback: {
      enabled: true
    }
  },
  
  hooks: {
    'nitro:config': (nitroConfig) => {
      // Add Three.js to external dependencies to prevent server-side bundling issues
      if (!nitroConfig.externals) nitroConfig.externals = {}
      if (!nitroConfig.externals.inline) nitroConfig.externals.inline = []
      nitroConfig.externals.inline.push('three', 'three/examples/jsm/controls/OrbitControls')
    }
  },
})
