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
    </ClientOnly>
    <UButton
      v-if="!showSidebar"
      size="sm" icon="i-mdi-chevron-double-left" variant="soft" color="neutral" class="w-7 fixed z-9 top-2.5 right-3"
      @click="showSidebar = true"
    />
    <Sidebar v-else />
  </div>
</template>
