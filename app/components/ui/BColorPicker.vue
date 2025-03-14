<script setup lang="ts">
const bookStore = useBookStore()
const { background } = storeToRefs(bookStore)
const chip = computed(() => ({ backgroundColor: background.value }))

const colorWithoutHashtag = computed({
  get() {
    return background.value.slice(1)
  },
  set(newValue) {
    background.value = `#${newValue}`
  },
})
</script>

<template>
  <UButtonGroup color="neutral" variant="soft" size="sm">
    <UPopover>
      <UButton color="neutral" variant="soft" size="xs">
        <span :style="chip" class="size-4 rounded-xs" />
      </UButton>
      <template #content>
        <div class="p-2">
          <UColorPicker v-model="background" class="p-2" />
        </div>
      </template>
    </UPopover>
    <UInput v-model="colorWithoutHashtag" type="text" size="sm" variant="soft" />
  </UButtonGroup>
</template>
