<script setup lang="ts">
const { showSidebar } = storeToRefs(useAppStore())
</script>

<template>
  <div
    class="grid"
    :class="{ 'grid-cols-[1fr_300px]': showSidebar }"
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
    <UButton
      v-if="!showSidebar"
      size="sm" icon="i-mdi-chevron-double-left" variant="soft" color="neutral" class="w-7 fixed z-9 top-2.5 right-3"
      @click="showSidebar = true"
    />
    <Sidebar v-else />
  </div>
</template>
