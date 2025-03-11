<script setup lang="ts">
const appStore = useAppStore()
const { showSidebar } = storeToRefs(appStore)
</script>

<template>
  <div class="flex h-screen">
    <!-- Main content -->
    <div class="flex-grow transition-all duration-300 relative">
      <ClientOnly>
        <Book />
        <template #fallback>
          <div class="flex items-center justify-center h-screen bg-gray-100">
            <div class="text-center p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
              <div class="text-xl font-medium text-black mb-2">
                Loading 3D View...
              </div>
              <p class="text-gray-500">
                Please wait while we prepare the book visualization.
              </p>
            </div>
          </div>
        </template>
      </ClientOnly>

      <!-- Toggle button - always present but only visible when sidebar is hidden -->
      <div
        class="fixed z-10 top-4 right-4 transition-opacity duration-300"
        :class="{ 'opacity-0': showSidebar, 'opacity-100': !showSidebar }"
      >
        <UButton
          size="sm"
          icon="i-mdi-chevron-double-left"
          variant="soft"
          color="neutral"
          class="w-7 opacity-80 hover:opacity-100"
          @click="appStore.showSidebarPanel()"
        />
      </div>
    </div>

    <!-- Sidebar - use transition for smoother effect -->
    <transition name="slide">
      <Sidebar v-if="showSidebar" class="w-[300px] flex-shrink-0" />
    </transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
