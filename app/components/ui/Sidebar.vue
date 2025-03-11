<script setup lang="ts">
const appStore = useAppStore()
const { dimensions, rotation, animation, lighting, surface } = storeToRefs(useBookStore())

const showLicense = ref(false)
const showInfo = ref(false)

const { data: licenseData } = await useAsyncData('license-data', () => queryContent('/license').findOne())
const { data: infoData } = await useAsyncData('info-data', () => queryContent('/').findOne())

const timings = ref([
  { label: 'Linear', value: 'linear' },
  { label: 'Ease', value: 'ease' },
  { label: 'Ease-in', value: 'ease-in' },
  { label: 'Ease-out', value: 'ease-out' },
  { label: 'Ease-in-out', value: 'ease-in-out' },
])
const axes = ref([
  { label: 'X Axis', value: 'X' },
  { label: 'Y Axis', value: 'Y' },
  { label: 'Z Axis', value: 'Z' },
])

const lightingPresets = ref([
  { label: 'Ambient', value: 'ambient', icon: 'i-mdi-white-balance-sunny', description: 'Even, all-around illumination' },
  { label: 'Studio', value: 'studio', icon: 'i-mdi-camera', description: 'Balanced three-point lighting' },
  { label: 'Soft', value: 'soft', icon: 'i-mdi-lightbulb-outline', description: 'Gentle, diffused illumination' },
])

const surfaceTypes = ref([
  { label: 'Uncoated', value: 'uncoated', icon: 'i-mdi-texture-box', description: 'Natural paper texture' },
  { label: 'Matte', value: 'matte', icon: 'i-mdi-spray', description: 'Non-reflective, smooth finish' },
  { label: 'Glossy', value: 'glossy', icon: 'i-mdi-shimmer', description: 'Reflective, polished finish' },
])
const SCALE_MAX = 500
const SCALE_MIN = 1
const scale = computed({
  get() {
    return dimensions.value.scale * 100
  },
  set(newValue) {
    if (newValue < SCALE_MIN) {
      newValue = SCALE_MIN
    }
    else if (newValue > SCALE_MAX) {
      newValue = SCALE_MAX
    }
    dimensions.value.scale = newValue / 100
  },
})

// Function to reset the rotation to its initial state and camera view
function resetRotation() {
  // Reset rotation values in the store
  rotation.value.x = 0
  rotation.value.y = 0
  rotation.value.z = 0

  // Call the global reset function if it exists
  if (window.resetBookCamera) {
    window.resetBookCamera()
  }

  // Function is triggered when the Camera Reset button is clicked
}
</script>

<template>
  <aside class="h-[100svh] border-l border-[var(--ui-border)] overflow-auto bg-white dark:bg-[var(--color-gray-950)]">
    <BSection>
      <UButton
        size="sm"
        icon="i-mdi-chevron-double-right"
        variant="soft"
        color="neutral"
        class="w-7"
        @click="appStore.hideSidebarPanel()"
      />
    </BSection>
    <USeparator />
    <BSection label="Design">
      <BInputFile file="cover" label="Cover" />
      <BInputFile file="spine" label="Spine" />
      <BInputFile file="back" label="Back" />
      <BColorPicker />
    </BSection>
    <USeparator />
    <BSection label="Dimensions">
      <UInput v-model="dimensions.width" type="number" size="sm" icon="i-mdi-arrow-left-right" variant="soft" />
      <UInput v-model="dimensions.height" type="number" size="sm" icon="i-mdi-arrow-up-down" variant="soft" />
      <UInput v-model="dimensions.depth" type="number" size="sm" icon="i-mdi-arrow-top-left-bottom-right" variant="soft" />
      <UInput v-model="scale" :min="SCALE_MIN" :max="SCALE_MAX" :step="1" type="number" size="sm" icon="i-mdi-percent-outline" variant="soft" />
    </BSection>
    <USeparator />
    <BSection label="Rotation">
      <template #header-right>
        <UTooltip text="Reset camera and rotation">
          <UButton
            icon="i-mdi-camera-retake-outline"
            size="xs"
            color="blue"
            variant="soft"
            @click="resetRotation()"
          />
        </UTooltip>
      </template>
      
      <USlider v-model="rotation.x" :min="-180" :max="180" :step="1" size="xs" color="neutral" />
      <UInput v-model="rotation.x" :required="true" :min="-180" :max="180" :step="1" type="number" size="sm" icon="i-mdi-horizontal-rotate-counterclockwise" variant="soft" />
      <USlider v-model="rotation.y" :min="-180" :max="180" :step="1" size="xs" color="neutral" />
      <UInput v-model="rotation.y" type="number" size="sm" icon="i-mdi-axis-z-rotate-clockwise" variant="soft" />
      <USlider v-model="rotation.z" :min="-180" :max="180" :step="1" size="xs" color="neutral" />
      <UInput v-model="rotation.z" type="number" size="sm" icon="i-mdi-axis-y-rotate-clockwise" variant="soft" />
    </BSection>
    <USeparator />
    <BSection label="Animation">
      <USwitch v-model="animation.enabled" label="Enable rotation animation" size="sm" variant="soft" color="neutral" class="col-span-2" />
      
      <!-- Animation controls with smooth transition effect -->
      <transition
        name="expand"
        mode="out-in"
        @before-enter="el => el.style.height = '0'"
        @enter="el => el.style.height = el.scrollHeight + 'px'"
        @before-leave="el => el.style.height = el.scrollHeight + 'px'"
        @leave="el => el.style.height = '0'"
      >
        <div v-if="animation.enabled" class="animation-controls col-span-2 overflow-hidden" key="animation-controls">
          <!-- Speed control, full width row -->
          <UInput v-model="animation.speed" type="number" :min="1" :step="1" size="sm" icon="i-mdi-camera-timer" variant="soft" label="Speed (1=fast, 10=normal)" class="mt-3 w-full" />
          
          <!-- Timing and Axis on same row, 50/50 split -->
          <div class="grid grid-cols-2 gap-2 mt-3">
            <USelect v-model="animation.timing" :items="timings" icon="i-mdi-animation" placeholder="Timing" size="sm" variant="soft" class="col-span-1" />
            <USelect v-model="animation.axis" :items="axes" icon="i-mdi-axis" placeholder="Axis" size="sm" variant="soft" class="col-span-1" />
          </div>
        </div>
      </transition>
    </BSection>
    <USeparator />
    <BSection label="Lighting">
      <div class="grid grid-cols-3 gap-2 col-span-2">
        <UTooltip v-for="preset in lightingPresets" :key="preset.value" :text="preset.description">
          <UButton
            :icon="preset.icon"
            size="sm"
            :color="lighting.preset === preset.value ? 'primary' : 'gray'"
            variant="soft"
            class="w-full"
            @click="lighting.preset = preset.value"
          >
            {{ preset.label }}
          </UButton>
        </UTooltip>
      </div>
    </BSection>
    <USeparator />
    <BSection label="Surface">
      <div class="grid grid-cols-3 gap-2 col-span-2">
        <UTooltip v-for="type in surfaceTypes" :key="type.value" :text="type.description">
          <UButton
            :icon="type.icon"
            size="sm"
            :color="surface.type === type.value ? 'primary' : 'gray'"
            variant="soft"
            class="w-full"
            @click="surface.type = type.value"
          >
            {{ type.label }}
          </UButton>
        </UTooltip>
      </div>
    </BSection>
    <USeparator />
    <!-- <BSection label="Export">
      <UButton size="sm" icon="i-mdi-download" variant="soft" label="Export HTML" color="neutral" />
    </BSection> -->
    <BSection>
      <UCollapsible v-model:open="showInfo" class="col-span-2">
        <UButton color="neutral" variant="link" class="text-xs font-bold p-0 color-inherit cursor-pointer text-[var(--ui-text)]">
          Info
        </UButton>
        <template #content>
          <div v-if="infoData" class="text-xs">
            <ContentRenderer :value="infoData">
              <ContentRendererMarkdown :value="infoData" />
            </ContentRenderer>
          </div>
        </template>
      </UCollapsible>
    </BSection>
    <USeparator />
    <BSection>
      <UCollapsible v-model:open="showLicense" class="col-span-2">
        <UButton color="neutral" variant="link" class="text-xs font-bold p-0 color-inherit cursor-pointer text-[var(--ui-text)]">
          License
        </UButton>
        <template #content>
          <div v-if="licenseData" class="text-xs">
            <ContentRenderer :value="licenseData">
              <ContentRendererMarkdown :value="licenseData" />
            </ContentRenderer>
          </div>
        </template>
      </UCollapsible>
    </BSection>
    <USeparator />
  </aside>
</template>

<style scoped>
/* Animation expansion effect for animation controls */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.animation-controls {
  transition: all 0.3s ease;
}

/* Optional fade effect combined with height change */
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
}
</style>
