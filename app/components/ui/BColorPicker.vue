<script setup lang="ts">
const { design } = storeToRefs(useBookStore())
const chip = computed(() => ({ backgroundColor: design.value.background }))

const colorWithoutHashtag = computed({
  get() {
    return design.value.background.slice(1)
  },
  set(newValue) {
    design.value.background = `#${newValue}`
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
          <UColorPicker v-model="design.background" class="p-2" />
        </div>
      </template>
    </UPopover>
    <UInput v-model="colorWithoutHashtag" type="text" size="sm" variant="soft" />
  </UButtonGroup>
</template>
