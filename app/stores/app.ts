import { defineStore } from 'pinia'

export const useAppStore = defineStore('@bookup/app', {
  state: () => ({
    showSidebar: true,
  }),
})
