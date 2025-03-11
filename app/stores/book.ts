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
      speed: 1, // Higher values = slower animation: 1 = fast (60 deg/sec), 10 = normal (6 deg/sec), 100 = very slow (0.6 deg/sec)
      timing: 'linear',
      axis: 'Y',
    },
    lighting: {
      preset: 'ambient',
    },
    surface: {
      type: 'uncoated', // Options: 'uncoated', 'matte', 'glossy'
    },
  }),
  persist: true,
})
