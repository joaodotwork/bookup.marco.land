<script setup lang="ts">
const { showSidebar } = storeToRefs(useAppStore())
const { dimensions, rotation, animation, lighting } = storeToRefs(useBookStore())

const showLicense = ref(false)
const showInfo = ref(false)

const { data: licenseData } = await useAsyncData('license-data', () => queryContent('/license').findOne())
const { data: infoData } = await useAsyncData('info-data', () => queryContent('/').findOne())

const timings = ref([
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
])
const axes = ref([
  'X',
  'Y',
  'Z',
])

const lightingPresets = ref([
  { label: 'Studio', value: 'studio', icon: 'i-mdi-camera' },
  { label: 'Soft', value: 'soft', icon: 'i-mdi-lightbulb-outline' },
  { label: 'Display', value: 'display', icon: 'i-mdi-spotlight' },
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

// Function to reset the rotation to its initial state (0, 0, 0)
const resetRotation = () => {
  // Use direct assignment for better reactivity
  rotation.value.x = 0
  rotation.value.y = 0
  rotation.value.z = 0
  
  // Log to confirm function is being called
  console.log('Camera reset triggered')
}
</script>

<template>
  <aside class="h-[100svh] border-l border-[var(--ui-border)] overflow-auto bg-white dark:bg-[var(--color-gray-950)]">
    <BSection>
      <UButton
        size="sm"
        :icon="showSidebar ? 'i-mdi-chevron-double-right' : 'i-mdi-chevron-double-left'"
        variant="soft"
        color="neutral"
        class="w-7"
        @click="showSidebar = !showSidebar"
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
      <USlider v-model="rotation.x" :min="-180" :max="180" :step="1" size="xs" color="neutral" />
      <UInput v-model="rotation.x" :required="true" :min="-180" :max="180" :step="1" type="number" size="sm" icon="i-mdi-horizontal-rotate-counterclockwise" variant="soft" />
      <USlider v-model="rotation.y" :min="-180" :max="180" :step="1" size="xs" color="neutral" />
      <UInput v-model="rotation.y" type="number" size="sm" icon="i-mdi-axis-z-rotate-clockwise" variant="soft" />
      <USlider v-model="rotation.z" :min="-180" :max="180" :step="1" size="xs" color="neutral" />
      <UInput v-model="rotation.z" type="number" size="sm" icon="i-mdi-axis-y-rotate-clockwise" variant="soft" />
      
      <UButton 
        icon="i-mdi-camera-retake-outline" 
        size="sm" 
        color="blue" 
        variant="solid" 
        label="Camera Reset" 
        class="mt-3 w-full col-span-2"
        :ui="{ 
          rounded: 'rounded-md',
          padding: { sm: 'px-4 py-2' },
          font: { weight: 'font-medium' },
          ring: { focus: 'ring-2 ring-offset-2 ring-blue-500 ring-offset-white dark:ring-offset-gray-900' }
        }"
        @click="resetRotation()"
      />
    </BSection>
    <USeparator />
    <BSection label="Animation">
      <USwitch v-model="animation.enabled" label="enabled" size="sm" variant="soft" color="neutral" class="col-span-2" />
      <UInput v-model="animation.speed" type="number" size="sm" icon="i-mdi-camera-timer" variant="soft" :disabled="!animation.enabled" />
      <USelect v-model="animation.timing" :items="timings" icon="i-mdi-animation" class="w-full" size="sm" variant="soft" :disabled="!animation.enabled" />
      <USelect v-model="animation.axis" :items="axes" icon="i-mdi-axis" class="w-full" size="sm" variant="soft" :disabled="!animation.enabled" />
    </BSection>
    <USeparator />
    <BSection label="Lighting">
      <div class="grid grid-cols-3 gap-2 col-span-2">
        <UButton
          v-for="preset in lightingPresets"
          :key="preset.value"
          :icon="preset.icon"
          size="sm"
          :color="lighting.preset === preset.value ? 'primary' : 'gray'"
          variant="soft"
          class="w-full"
          @click="lighting.preset = preset.value"
        >
          {{ preset.label }}
        </UButton>
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
