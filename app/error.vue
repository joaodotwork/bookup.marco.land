<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError,
})

useHead({
  title: 'Bookup',
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="p-4">
    <h2 v-if="props.error">
      Error: {{ props.error.statusCode }}
    </h2>
    <button class="link-style" @click="handleError">
      Go back home
    </button>
  </div>
</template>
