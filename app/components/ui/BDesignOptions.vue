<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useBookStore } from '~/stores/book'

const bookStore = useBookStore()
const { designOptions, currentDesignId } = storeToRefs(bookStore)

const isRenaming = ref<string | null>(null)
const newName = ref('')
const isSharing = ref(false)
const shareMessage = ref('')
const showShareMessage = ref(false)

// Create a new design
function handleCreateDesign() {
  bookStore.createDesign(`Design ${new Date().toLocaleTimeString()}`)
}

// Duplicate the current design
function handleDuplicateDesign(designId = currentDesignId.value) {
  bookStore.duplicateDesign(designId)
}

// Delete a design
function handleDeleteDesign(designId = currentDesignId.value) {
  bookStore.deleteDesign(designId)
}

// Start renaming a design
function startRenaming(designId: string, currentName: string) {
  isRenaming.value = designId
  newName.value = currentName
}

// Save the new name
function saveRename() {
  if (isRenaming.value && newName.value.trim()) {
    bookStore.renameDesign(isRenaming.value, newName.value.trim())
    isRenaming.value = null
    newName.value = ''
  }
}

// Cancel renaming
function cancelRename() {
  isRenaming.value = null
  newName.value = ''
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
      shareMessage.value = `✓ Link copied to clipboard`
      showShareMessage.value = true
      
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        showShareMessage.value = false
      }, 3000)
      
      console.log('Share link copied to clipboard:', fullUrl)
    } 
    else {
      // Show error message
      shareMessage.value = 'Failed to generate share link'
      showShareMessage.value = true
      
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        showShareMessage.value = false
      }, 3000)
      
      console.error('Failed to generate share link')
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

// Before component is mounted, initialize the store
onBeforeMount(() => {
  bookStore.init()
})
</script>

<template>
  <BSection label="Design Options">
    <template #header-right>
      <div class="flex gap-1 items-center">
        <UTooltip text="Add design">
          <UButton
            icon="i-lucide-plus"
            color="gray"
            variant="ghost"
            size="xs"
            class="flex items-center justify-center"
            @click="handleCreateDesign"
          />
        </UTooltip>
        <div class="relative">
          <UTooltip text="Share current design">
            <UButton
              icon="i-lucide-share"
              color="gray"
              variant="ghost"
              size="xs"
              class="flex items-center justify-center"
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
            <div v-if="showShareMessage" class="absolute top-full mt-1 right-0 z-50 p-2 bg-white dark:bg-gray-800 text-xs rounded shadow-lg border border-gray-200 dark:border-gray-700 w-64 text-left">
              {{ shareMessage }}
            </div>
          </Transition>
        </div>
      </div>
    </template>

    <div class="design-options-list col-span-2">
      <div 
        v-for="option in designOptions"
        :key="option.id"
        class="design-option mb-1 last:mb-0"
      >
        <UButton
          v-if="isRenaming !== option.id"
          :color="currentDesignId === option.id ? 'primary' : 'gray'"
          :variant="currentDesignId === option.id ? 'solid' : 'ghost'"
          block
          size="xs"
          class="text-left justify-between"
          @click="bookStore.selectDesign(option.id)"
        >
          <span class="truncate max-w-[120px] flex items-center">
            <UIcon v-if="currentDesignId === option.id" name="i-lucide-check" class="mr-1 text-xs" />
            {{ option.name }}
          </span>
          <div class="flex gap-1" v-if="currentDesignId === option.id">
            <UTooltip text="Rename">
              <UButton
                icon="i-lucide-edit-3"
                color="white"
                variant="ghost"
                size="xs"
                @click.stop="startRenaming(option.id, option.name)"
              />
            </UTooltip>
            <UTooltip text="Duplicate">
              <UButton
                icon="i-lucide-copy"
                color="white"
                variant="ghost"
                size="xs"
                @click.stop="handleDuplicateDesign(option.id)"
              />
            </UTooltip>
            <UTooltip v-if="designOptions.length > 1" text="Delete">
              <UButton
                icon="i-lucide-trash-2"
                color="white"
                variant="ghost"
                size="xs"
                @click.stop="handleDeleteDesign(option.id)"
              />
            </UTooltip>
          </div>
        </UButton>
        
        <div v-else class="flex gap-1">
          <UInput
            v-model="newName"
            size="sm"
            placeholder="Design name"
            :autofocus="true"
            @keyup.enter="saveRename"
            @keyup.esc="cancelRename"
          />
          <UButton
            icon="i-lucide-check"
            color="green"
            variant="ghost"
            size="xs"
            @click="saveRename"
            title="Save name"
          />
          <UButton
            icon="i-lucide-x"
            color="red"
            variant="ghost"
            size="xs"
            @click="cancelRename"
            title="Cancel"
          />
        </div>
      </div>
    </div>
  </BSection>
</template>