<script setup lang="ts">
const appStore = useAppStore()
const bookStore = useBookStore()
const { showSidebar } = storeToRefs(appStore)
const { animation } = storeToRefs(bookStore)
const { designOptions, currentDesignId } = storeToRefs(bookStore)
const isFullscreen = ref(false)
const isSharing = ref(false)
const shareMessage = ref('')
const showShareMessage = ref(false)

// Toggle sidebar visibility
function toggleSidebar() {
  appStore.toggleSidebar()
}

// Toggle animation playback
function toggleAnimation() {
  animation.value.enabled = !animation.value.enabled
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

// Add appropriate fullscreen meta tags for different browsers
useHead({
  meta: [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'mobile-web-app-capable', content: 'yes' },
  ],
})

// Create a named handler for fullscreen change events
function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// Update fullscreen state when changed from browser controls
// Function to load a design by its ID
async function loadDesignById(designId) {
  try {
    // Call the API to get the shared design
    const response = await fetch(`/api/designs/${designId}`)

    if (!response.ok) {
      console.error('Failed to load design by ID:', await response.text())
      return false
    }

    // Import the design
    const success = await bookStore.loadSharedDesign(designId)
    if (success) {
      console.log('Successfully loaded design:', designId)
    }
    return success
  } catch (error) {
    console.error('Error loading design by ID:', error)
    return false
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  
  // Initialize the store
  bookStore.init()
  
  // Check if there's a design ID in the query parameter
  const route = useRoute()
  const designId = route.query.design
  
  if (designId && typeof designId === 'string') {
    console.log('Found design ID in query parameter:', designId)
    
    // Try to load the design
    loadDesignById(designId)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// Function to select a design option
function selectDesign(designId) {
  bookStore.selectDesign(designId)
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

// Share button handler
async function handleShare() {
  // Show loading state
  isSharing.value = true

  try {
    // Call the store method to share the design
    const shareUrl = await bookStore.shareDesign()

    if (shareUrl) {
      // Extract the design ID from the shareUrl
      const designId = bookStore.shareId
      
      // Construct a URL to the share view
      const fullUrl = `${window.location.origin}/share/${designId}`

      // Copy to clipboard
      await navigator.clipboard.writeText(fullUrl)

      // Show success message
      shareMessage.value = `✓ Link copied`
      showShareMessage.value = true
      
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        showShareMessage.value = false
      }, 3000)
    } 
    else {
      // Show error message
      shareMessage.value = 'Failed to generate link'
      showShareMessage.value = true
      
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        showShareMessage.value = false
      }, 3000)
    }
  }
  catch (err) {
    console.error('Failed to share design:', err)
    
    // Show error message
    shareMessage.value = 'Error sharing design'
    showShareMessage.value = true
    
    // Auto-hide message after 3 seconds
    setTimeout(() => {
      showShareMessage.value = false
    }, 3000)
  }
  finally {
    isSharing.value = false
  }
}
</script>

<template>
  <div class="flex h-screen relative">
    <!-- Main content area -->
    <div class="flex-grow">
      <ClientOnly>
        <Book />
        <template #fallback>
          <div class="flex items-center justify-center h-screen bg-gray-100">
            <div class="text-center p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
              <div class="text-xl font-medium text-black mb-2">
                Loading 3D View...
              </div>
              <p class="text-gray-500">
                Please wait while we prepare the book visualization.
              </p>
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Control buttons container - aligned to the right edge -->
    <div
      class="fixed z-20 top-1/2 transform -translate-y-1/2 right-[308px] transition-all duration-300 flex flex-col gap-2 items-center"
      :style="{ right: showSidebar ? '308px' : '4px' }"
    >
      <!-- Sidebar toggle button -->
      <UTooltip :text="showSidebar ? 'Hide sidebar' : 'Show sidebar'" placement="left" :popper="{ offset: 12 }">
        <UButton
          size="sm"
          :icon="showSidebar ? 'i-mdi-dock-right' : 'i-mdi-dock-left'"
          variant="soft"
          color="neutral"
          class="w-7 opacity-80 hover:opacity-100"
          @click="toggleSidebar"
        />
      </UTooltip>

      <!-- Animation play/pause button with matching visual style -->
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
      
      <!-- Divider -->
      <div class="border-t border-gray-200 dark:border-gray-700 mx-1 my-1"></div>
      
      <!-- Share button -->
      <div class="relative">
        <UTooltip text="Share design" placement="left" :popper="{ offset: 12 }">
          <UButton
            size="sm"
            icon="i-lucide-share"
            variant="soft"
            color="neutral"
            class="w-7 opacity-80 hover:opacity-100"
            :loading="isSharing"
            @click="handleShare"
          />
        </UTooltip>
        
        <!-- Share message popup -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-1 opacity-0"
          enter-to-class="translate-y-0 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 opacity-100"
          leave-to-class="translate-y-1 opacity-0"
        >
          <div v-if="showShareMessage" class="absolute top-0 right-full mr-2 z-50 p-2 bg-white dark:bg-gray-800 text-xs rounded shadow-lg border border-gray-200 dark:border-gray-700 whitespace-nowrap">
            {{ shareMessage }}
          </div>
        </Transition>
      </div>
      
      <!-- Design Options -->
      <template v-if="designOptions.length > 0">
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

    <!-- Sidebar with slide transition -->
    <div
      class="absolute top-0 right-0 h-full transition-transform duration-300 ease-in-out"
      :class="{ 'translate-x-0': showSidebar, 'translate-x-full': !showSidebar }"
    >
      <Sidebar class="w-[300px]" />
    </div>
  </div>
</template>
