<script lang="ts" setup>
const props = defineProps<{
  label?: string
}>()
</script>

<template>
  <section class="py-2.5 px-3 flex flex-col gap-2.5">
    <div v-if="props.label" class="flex justify-between items-center">
      <h2 class="text-xs font-bold">
        {{ props.label }}
      </h2>
      <slot name="header-right"></slot>
    </div>
    <div class="grid grid-cols-2 gap-2.5">
      <slot />
    </div>
  </section>
</template>
