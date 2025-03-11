<script setup lang="ts">
const appStore = useAppStore()
const { showSidebar } = storeToRefs(appStore)

// Toggle sidebar visibility
function toggleSidebar() {
  appStore.toggleSidebar()
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

    <!-- Sidebar toggle button - vertically centered at the right edge -->
    <div class="fixed z-20 top-1/2 transform -translate-y-1/2 right-[308px] transition-all duration-300" :style="{ right: showSidebar ? '308px' : '4px' }">
      <UButton
        size="sm"
        :icon="showSidebar ? 'i-mdi-chevron-double-right' : 'i-mdi-chevron-double-left'"
        variant="soft"
        color="neutral"
        class="w-7 opacity-80 hover:opacity-100"
        @click="toggleSidebar"
      />
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
