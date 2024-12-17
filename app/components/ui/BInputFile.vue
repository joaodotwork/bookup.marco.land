<script lang="ts" setup>
const props = defineProps<{
  file: string
  label?: string
}>()
const { design } = storeToRefs(useBookStore())
const fileInput = ref<HTMLInputElement | null>(null)

function handleFileChange() {
  if (!fileInput.value) {
    return
  }
  const file = fileInput.value.files
  if (file?.[0]) {
    const fileReader = new FileReader()
    fileReader.onload = function (event) {
      switch (props.file) {
        case 'cover':
          design.value.cover = event.target?.result as string
          break
        case 'back':
          design.value.back = event.target?.result as string
          break
        case 'spine':
          design.value.spine = event.target?.result as string
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
