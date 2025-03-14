<script setup lang="ts">
import { useBookStore } from '~/stores/book'

const route = useRoute()
const bookStore = useBookStore()
const isLoading = ref(true)
const loadError = ref<string | null>(null)

// Get the share ID from the route
const shareId = route.params.id as string

// Initialize the store
bookStore.init()

// Load the shared design
onMounted(async () => {
  try {
    isLoading.value = true
    const success = await bookStore.loadSharedDesign(shareId)

    if (!success) {
      loadError.value = 'Could not load the shared design. It may have expired or been deleted.'
    }
  }
  catch (error) {
    console.error('Error loading shared design:', error)
    loadError.value = 'An error occurred while loading the shared design.'
  }
  finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-screen">
      <UIcon name="i-lucide-loader-2" class="text-4xl animate-spin" />
      <p class="mt-4">
        Loading shared design...
      </p>
    </div>

    <div v-else-if="loadError" class="flex flex-col items-center justify-center min-h-screen">
      <UIcon name="i-lucide-alert-circle" class="text-4xl text-red-500" />
      <p class="mt-4 text-red-500">
        {{ loadError }}
      </p>
      <UButton
        to="/"
        color="primary"
        class="mt-4"
      >
        Create your own design
      </UButton>
    </div>

    <div v-else>
      <!-- Book view only mode for shared designs -->
      <div class="relative w-full h-screen">
        <Book />

        <!-- Info overlay with "Create your own" button -->
        <div class="absolute bottom-6 right-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h3 class="font-medium">
            Shared Design
          </h3>
          <p class="text-sm mb-2">
            This is a view-only shared design
          </p>
          <UButton
            to="/"
            color="primary"
            block
          >
            Create your own
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
