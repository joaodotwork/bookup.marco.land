<script lang="ts" setup>
const props = defineProps<{
  label?: string
}>()
</script>

<template>
  <section class="py-2.5 px-3 flex flex-col gap-2.5">
    <h2 v-if="props.label" class="text-xs font-bold">
      {{ props.label }}
    </h2>
    <div class="grid grid-cols-2 gap-2.5">
      <slot />
    </div>
  </section>
</template>
