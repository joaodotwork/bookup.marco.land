<script lang="ts" setup>
const props = defineProps<{
  label?: string;
}>()
</script>

<template>
  <section class="px-3 py-1.5 flex flex-col gap-2.5">
    <div class="flex justify-between items-center">
      <slot name="header">
        <h2 v-if="props.label" class="text-xs font-bold">
          {{ props.label }}
        </h2>
      </slot>
      <slot name="header-right" />
    </div>
    <div class="grid grid-cols-2 gap-2.5">
      <slot />
    </div>
  </section>
</template>
