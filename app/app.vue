<script setup lang="ts">
useHead({
  link: [
    {
      rel: 'icon',
      href: 'favicon.svg',
      type: 'image/svg+xml',
    },
  ],
})

useSeoMeta({
  title: 'Bookup',
  description: 'Boockup is a web-based tool for creating digital book mockups.',
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
