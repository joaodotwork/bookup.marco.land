<script setup lang="ts">
const { design, dimensions, rotation, animation } = storeToRefs(useBookStore())

const wrapperStyle = computed(() => ({
  transform: `rotateX(${rotation.value.x}deg) rotateY(${rotation.value.y}deg) rotateZ(${rotation.value.z}deg)`,
}))

const animationStyle = computed(() => (
  animation.value.enabled
    ? { animation: `rotatingAnimation${animation.value.axis || 'Y'} ${animation.value.speed}s ${animation.value.timing} infinite` }
    : undefined))

const BASE_SCALE = 1

const width = computed(() => dimensions.value.width * (dimensions.value.scale + BASE_SCALE))
const height = computed(() => dimensions.value.height * (dimensions.value.scale + BASE_SCALE))
const depth = computed(() => dimensions.value.depth * (dimensions.value.scale + BASE_SCALE))

const bookCoverStyle = computed(() => ({
  width: `${width.value}px`,
  height: `${height.value}px`,
  background: `url(${design.value.cover || '/images/book-cover.jpg'})`,
  transform: `translate3d(${width.value * -0.5}px ,${height.value * -0.5}px ,${depth.value / 2}px) translate3d(0, 0, 0) rotateY(0deg)`,
}))

const bookLeftStyle = computed(() => ({
  width: `${depth.value + 1}px`,
  height: `${height.value + 1}px`,
  background: `url(${design.value.spine || '/images/book-spine.jpg'})`,
  transform: `translate3d(${width.value * -0.5}px ,${height.value * -0.5}px ,${depth.value / 2}px) translate3d(${depth.value * -0.5}px, 0, ${depth.value * -0.5}px) rotateY(-90deg)`,
}))

const bookRightStyle = computed(() => ({
  width: `${depth.value + 1}px`,
  height: `${height.value + 1}px`,
  background: `url('/images/book-side.jpg')`,
  transform: `translate3d(${width.value * -0.5}px ,${height.value * -0.5}px ,${depth.value / 2}px) translate3d(${width.value - (depth.value * 0.5)}px, 0, ${depth.value * -0.5}px) rotateY(90deg)`,
}))

const bookTopStyle = computed(() => ({
  width: `${width.value + 1}px`,
  height: `${depth.value}px`,
  background: `url('/images/book-top.jpg')`,
  transform: `translate3d(${width.value * -0.5}px ,${height.value * -0.5}px ,${depth.value / 2}px) translate3d(0px, ${depth.value * -0.5}px, ${-depth.value * 0.5}px) rotateX(90deg)`,
}))

const bookBottomStyle = computed(() => ({
  width: `${width.value + 1}px`,
  height: `${depth.value}px`,
  background: `url('/images/book-top.jpg')`,
  transform: `translate3d(${width.value * -0.5}px ,${height.value * -0.5}px ,${depth.value / 2}px) translate3d(0px, ${height.value - (depth.value * 0.5)}px, ${depth.value * -0.5}px) rotateX(-90deg)`,
}))

const bookBackStyle = computed(() => ({
  width: `${width.value + 1}px`,
  height: `${height.value + 1}px`,
  background: `url(${design.value.back || '/images/book-back.jpg'})`,
  transform: `translate3d(${width.value * -0.5}px ,${height.value * -0.5}px ,${depth.value / 2}px) translate3d(0,0, -${depth.value}px) rotateY(180deg)`,
}))
</script>

<template>
  <div id="book" class="book-wrapper" :style="{ backgroundColor: design.background }">
    <div :style="wrapperStyle">
      <div
        class="book-container" :style="animationStyle"
      >
        <div
          class="book-front"
          :style="bookCoverStyle"
        />
        <div
          class="book-side-left"
          :style="bookLeftStyle"
        />
        <div
          class="book-side-right"
          :style="bookRightStyle"
        />
        <div
          class="book-top"
          :style="bookTopStyle"
        />
        <div
          class="book-bottom"
          :style="bookBottomStyle"
        />
        <div
          class="book-back"
          :style="bookBackStyle"
        />
      </div>
    </div>
  </div>
</template>

<style lang="css">
@keyframes rotatingAnimationX {
  0%{
    transform: rotateX(0deg);
  }
  100% {
    transform: rotateX(360deg);
  }
}
@keyframes rotatingAnimationY {
  0%{
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}
@keyframes rotatingAnimationZ {
  0%{
    transform: rotateZ(0deg);
  }
  100% {
    transform: rotateZ(360deg);
  }
}
.book-wrapper {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  perspective: 1200px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.book-wrapper > div {
  transform-style: preserve-3d;
}
.book-container {
  transform-style: preserve-3d;
}
.book-container > div {
  position: absolute;
  top: 0;
  left: 0;
  background-color: blue;
  background-size: cover !important;
  background-position: center center !important;
  backface-visibility: visible;
}
.book-container .book-top, .book-container .book-bottom, .book-container .book-side-right {
  background-size: auto  auto !important;
  background-repeat: repeat !important;
  background-position: top left !important;
}
.book-container .book-top {
  background-position: bottom right !important;
}
</style>
