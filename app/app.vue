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
  description: 'Bookup is a social media platform for book lovers. Share your favorite books and discover new ones.',
})
</script>

<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
