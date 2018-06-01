<template>
  <div id="app" :style="{'background-color': 'rgba('+ background.r + ', '+ background.g +', '+ background.b +', '+ background.a +' )'}">
    <Controls :width="width" :height="height" :depth="depth" :scale="scale" :cover="cover" :back="back" :spine="spine" :background="background" :animation="animation" />
    <Book :width="width" :height="height" :depth="depth" :scale="scale" :cover="cover" :back="back" :spine="spine" :animation="animation" />
  </div>
</template>

<script>
import { EventBus } from './event-bus.js';

import Book from './components/Book'
import Controls from './components/Controls'

export default {
  name: 'App',
  components: {
    Book, Controls
  },
  data () {
    return {
      background: {
        r: '248',
        g: '231',
        b: '28',
        a: '1'
      },
      width: 149,
      height: 200,
      depth: 20,
      scale: 2.5,
      cover: '/static/images/book-cover.jpg',
      back: '/static/images/book-back.jpg',
      spine: '/static/images/book-spine.jpg',
      animation: {
        duration: 10,
        timing: 'linear'
      }
    }
  },
  methods: {
    updateDimensions(width, height, depth, scale) {
      this.width = width;
      this.height = height;
      this.depth = depth;
      this.scale = scale;
    },
    processFile(event, param) {
      switch(param) {
          case 'cover':
              this.cover = URL.createObjectURL(event.target.files[0]);
              break;
          case 'back':
              this.back = URL.createObjectURL(event.target.files[0]);
              break;
          default:
              this.spine = URL.createObjectURL(event.target.files[0]);
      }
    },
    onBgChange(colors) {
      this.background = colors.rgba;
    },
    onAnimChange(duration, timing) {
      this.animation.duration = duration;
      this.animation.timing = timing;
    }
  },
  created() {
    EventBus.$on('dimension-changed', this.updateDimensions);
    EventBus.$on('texture-changed', this.processFile);
    EventBus.$on('background-changed', this.onBgChange);
    EventBus.$on('animation-changed', this.onAnimChange)
  }
}
</script>

<style lang="scss">

</style>
