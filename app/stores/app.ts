import { defineStore } from 'pinia'

export const useAppStore = defineStore('@bookup/app', {
  state: () => ({
    showSidebar: true,
  }),
  actions: {
    toggleSidebar() {
      this.showSidebar = !this.showSidebar
    },
    showSidebarPanel() {
      this.showSidebar = true
    },
    hideSidebarPanel() {
      this.showSidebar = false
    }
  }
})
