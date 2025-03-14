<script setup lang="ts">
// Simple script that redirects to index with query parameter
const route = useRoute()
const router = useRouter()
const id = route.params.id

// Check if the route came from direct navigation
// and not a refresh/reload
if (process.client) {
  onMounted(() => {
    // Redirect to index with design ID as query parameter
    router.replace({ path: '/', query: { design: id } })
  })
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <UIcon name="i-lucide-loader-2" class="text-4xl animate-spin" />
    <p class="mt-4">
      Loading design...
    </p>
  </div>
</template>