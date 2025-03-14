<script setup lang="ts">
import { useBookStore } from '~/stores/book'

const route = useRoute()
const bookStore = useBookStore()
const { animation, designOptions, currentDesignId } = storeToRefs(bookStore)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isFullscreen = ref(false)

// Get the share ID from the route
const shareId = route.params.id as string

// Initialize the store
bookStore.init()

// Load the shared design
// Toggle animation playback
function toggleAnimation() {
  animation.value.enabled = !animation.value.enabled
}

// Function to select a design option
function selectDesign(designId) {
  bookStore.selectDesign(designId)
}

// Reset camera to default view
function resetCamera() {
  if (window.resetBookCamera) {
    window.resetBookCamera()
  }
}

// Toggle fullscreen mode
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      await document.documentElement.requestFullscreen()
      isFullscreen.value = true
    }
    else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        await document.exitFullscreen()
        isFullscreen.value = false
      }
    }
  }
  catch (err) {
    console.error('Error toggling fullscreen:', err)
  }
}

// Handle image loading errors for thumbnails
function handleThumbnailError(event, designId) {
  // Hide the broken image
  event.target.style.display = 'none';
  
  // Find the parent element to show fallback
  const parent = event.target.closest('div');
  if (parent) {
    // Create a fallback element
    const fallback = document.createElement('div');
    fallback.className = 'w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800';
    
    // Find the design to get its name
    const design = designOptions.value.find(d => d.id === designId);
    const letter = design?.name?.charAt(0).toUpperCase() || 'D';
    
    // Add the letter
    fallback.innerHTML = `<span class="text-xs font-medium">${letter}</span>`;
    
    // Add to parent
    parent.appendChild(fallback);
  }
}

// Create a named handler for fullscreen change events
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// Add appropriate fullscreen meta tags for different browsers
useHead({
  meta: [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'mobile-web-app-capable', content: 'yes' },
  ],
})

onMounted(async () => {
  try {
    isLoading.value = true
    const success = await bookStore.loadSharedDesign(shareId)

    if (!success) {
      loadError.value = 'Could not load the shared design. It may have expired or been deleted.'
    }
    
    // Add fullscreen change listener
    document.addEventListener('fullscreenchange', handleFullscreenChange)
  }
  catch (error) {
    console.error('Error loading shared design:', error)
    loadError.value = 'An error occurred while loading the shared design.'
  }
  finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
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
        
        <!-- Control buttons container - aligned to the right edge -->
        <div class="fixed z-20 top-1/2 transform -translate-y-1/2 right-4 flex flex-col gap-2 items-center">
          <!-- Reset camera button -->
          <UTooltip text="Reset camera view" placement="left" :popper="{ offset: 12 }">
            <UButton
              size="sm"
              icon="i-mdi-camera-retake-outline"
              variant="soft"
              color="neutral"
              class="w-7 opacity-80 hover:opacity-100"
              @click="resetCamera"
            />
          </UTooltip>

          <!-- Animation play/pause button -->
          <UTooltip :text="animation.enabled ? 'Pause animation' : 'Play animation'" placement="left" :popper="{ offset: 12 }">
            <UButton
              size="sm"
              :icon="animation.enabled ? 'i-mdi-pause' : 'i-mdi-play'"
              variant="soft"
              color="neutral"
              class="w-7 opacity-80 hover:opacity-100"
              @click="toggleAnimation"
            />
          </UTooltip>

          <!-- Fullscreen toggle button -->
          <UTooltip :text="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'" placement="left" :popper="{ offset: 12 }">
            <UButton
              size="sm"
              :icon="isFullscreen ? 'i-mdi-fullscreen-exit' : 'i-mdi-fullscreen'"
              variant="soft"
              color="neutral"
              class="w-7 opacity-80 hover:opacity-100"
              @click="toggleFullscreen"
            />
          </UTooltip>
          
          <!-- Design Options -->
          <template v-if="designOptions.length > 1">
            <!-- Divider -->
            <div class="border-t border-gray-200 dark:border-gray-700 mx-1 my-1"></div>
            
            <UTooltip v-for="option in designOptions" :key="option.id" :text="option.name" placement="left" :popper="{ offset: 14 }">
              <div 
                class="w-10 h-10 mb-2 rounded-md overflow-hidden cursor-pointer transition-all duration-200"
                :class="[
                  currentDesignId === option.id 
                    ? 'ring-2 ring-primary-500 shadow-md scale-105' 
                    : 'ring-1 ring-gray-300 dark:ring-gray-700 opacity-70 hover:opacity-100'
                ]"
                @click="selectDesign(option.id)"
              >
                <!-- Show thumbnail if available -->
                <div v-if="option.design.cover" class="w-full h-full">
                  <img 
                    :src="option.design.cover" 
                    :alt="option.name"
                    class="w-full h-full object-cover"
                    @error="handleThumbnailError($event, option.id)" 
                  />
                </div>
                <!-- Fallback when no image is available -->
                <div v-else class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <span class="text-xs font-medium">{{ option.name.charAt(0).toUpperCase() }}</span>
                </div>
                
                <!-- Selection indicator -->
                <div 
                  v-if="currentDesignId === option.id" 
                  class="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 rounded-full transform translate-x-1/4 translate-y-1/4"
                >
                  <span class="text-white text-[8px] flex items-center justify-center h-full">
                    ✓
                  </span>
                </div>
              </div>
            </UTooltip>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
