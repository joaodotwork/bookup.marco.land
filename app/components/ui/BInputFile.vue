<script lang="ts" setup>
const props = defineProps<{
  file: string
  label?: string
}>()
const bookStore = useBookStore()
const { currentDesign } = storeToRefs(bookStore)
const fileInput = ref<HTMLInputElement | null>(null)

function handleFileChange() {
  if (!fileInput.value) {
    return
  }
  const file = fileInput.value.files
  if (file?.[0]) {
    const fileReader = new FileReader()
    fileReader.onload = function (event) {
      const result = event.target?.result as string
      
      // We need to update the design property of the current design
      switch (props.file) {
        case 'cover':
          currentDesign.value.design.cover = result
          break
        case 'back':
          currentDesign.value.design.back = result
          break
        case 'spine':
          currentDesign.value.design.spine = result
          break
      }
    }
    fileReader.readAsDataURL(file[0])
  }
}

function handleClick() {
  fileInput.value?.click()
}
</script>

<template>
  <UButton class="w-full" size="sm" icon="i-mdi-image" variant="soft" :label="props.label" color="neutral" @click="handleClick" />
  <input ref="fileInput" type="file" class="invisible absolute left--100 right--100" accept="image/png, image/gif, image/jpeg" @change="handleFileChange">
</template>
