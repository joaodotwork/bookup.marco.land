<script setup lang="ts">
const appStore = useAppStore()
const { showSidebar } = storeToRefs(appStore)
</script>

<template>
  <div
    class="grid transition-[grid-template-columns] duration-300 ease-in-out"
    :style="{ 
      gridTemplateColumns: showSidebar ? '1fr 300px' : '1fr' 
    }"
  >
    <ClientOnly>
      <Book />
      <template #fallback>
        <div class="flex items-center justify-center h-screen bg-gray-100">
          <div class="text-center p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
            <div class="text-xl font-medium text-black mb-2">Loading 3D View...</div>
            <p class="text-gray-500">Please wait while we prepare the book visualization.</p>
          </div>
        </div>
      </template>
    </ClientOnly>
    <!-- Only show this button when sidebar is hidden -->
    <div 
      v-if="!showSidebar" 
      class="fixed z-10 top-4 right-4 transition-opacity duration-300"
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
    
    <!-- The v-if is crucial here - we need to fully mount/unmount the component -->
    <div v-if="showSidebar" class="contents">
      <Sidebar />
    </div>
  </div>
</template>

