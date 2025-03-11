<script setup lang="ts">
const appStore = useAppStore()
const bookStore = useBookStore()
const { showSidebar } = storeToRefs(appStore)
const { animation } = storeToRefs(bookStore)

// Toggle sidebar visibility
function toggleSidebar() {
  appStore.toggleSidebar()
}

// Toggle animation playback
function toggleAnimation() {
  animation.value.enabled = !animation.value.enabled
}
</script>

<template>
  <div class="flex h-screen relative">
    <!-- Main content area -->
    <div class="flex-grow">
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
    </div>

    <!-- Control buttons container - aligned to the right edge -->
    <div class="fixed z-20 top-1/2 transform -translate-y-1/2 right-[308px] transition-all duration-300 flex flex-col gap-2" 
         :style="{ right: showSidebar ? '308px' : '4px' }">
      <!-- Sidebar toggle button -->
      <UTooltip :text="showSidebar ? 'Hide sidebar' : 'Show sidebar'">
        <UButton
          size="sm"
          :icon="showSidebar ? 'i-mdi-dock-right' : 'i-mdi-dock-left'"
          variant="soft"
          color="neutral"
          class="w-7 opacity-80 hover:opacity-100"
          @click="toggleSidebar"
        />
      </UTooltip>
      
      <!-- Animation play/pause button with matching visual style -->
      <UTooltip :text="animation.enabled ? 'Pause animation' : 'Play animation'">
        <UButton
          size="sm"
          :icon="animation.enabled ? 'i-mdi-pause' : 'i-mdi-play'"
          variant="soft"
          color="neutral"
          class="w-7 opacity-80 hover:opacity-100"
          @click="toggleAnimation"
        />
      </UTooltip>
    </div>

    <!-- Sidebar with slide transition -->
    <div
      class="absolute top-0 right-0 h-full transition-transform duration-300 ease-in-out"
      :class="{ 'translate-x-0': showSidebar, 'translate-x-full': !showSidebar }"
    >
      <Sidebar class="w-[300px]" />
    </div>
  </div>
</template>
