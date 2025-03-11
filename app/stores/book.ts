import { defineStore } from 'pinia'

export const useBookStore = defineStore('@bookup/book', {
  state: () => ({
    design: {
      cover: '',
      back: '',
      spine: '',
      background: '#0072FF',
    },
    dimensions: {
      width: 200,
      height: 270,
      depth: 29,
      scale: 1,
    },
    rotation: {
      x: 0,
      y: 0,
      z: 0, // These values give a flat view of the cover
    },
    animation: {
      enabled: false, // Animation is disabled by default, user can enable it manually
      speed: 10, // Higher values = slower animation: 1 = very fast (600 deg/sec), 10 = normal (60 deg/sec), 100 = very slow (6 deg/sec)
      timing: 'linear',
      axis: 'Y',
    },
    lighting: {
      preset: 'ambient',
    },
  }),
  persist: true,
})
