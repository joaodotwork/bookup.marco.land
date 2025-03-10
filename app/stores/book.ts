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
    animation: {
      enabled: true,
      speed: 10,
      timing: 'linear',
      axis: 'Y',
    },
  }),
  persist: true,
})
