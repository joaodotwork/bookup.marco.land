<template>
  <div id="app" :style="{'background-color': 'rgba('+ background.r + ', '+ background.g +', '+ background.b +', '+ background.a +' )'}">
    <transition name="fade">
    <div v-if="!hasLoaded" id="preloader" :style="{'background-color': 'rgba('+ background.r + ', '+ background.g +', '+ background.b +', '+ background.a +' )'}">
      <h1><span>·</span><span>·</span><span>·</span></h1>
    </div>
    </transition>
    <Controls v-if="hasLoaded" :width="width" :height="height" :depth="depth" :scale="scale" :cover="cover" :back="back" :spine="spine" :top="top" :side="side" :background="background" :animation="animation" :axis="axis" />
    <Book v-if="hasLoaded" :width="width" :height="height" :depth="depth" :scale="scale" :cover="cover" :back="back" :spine="spine" :animation="animation" :axis="axis" />
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
      hasLoaded: false,
      background: {
        r: '0',
        g: '114',
        b: '255',
        a: '1'
      },
      width: 200,
      height: 270,
      depth: 29,
      scale: 2,
      cover: '/static/images/book-cover.jpg',
      back: '/static/images/book-back.jpg',
      spine: '/static/images/book-spine.jpg',
      top: '/static/images/book-top.jpg',
      side: '/static/images/book-side.jpg',
      animation: {
        duration: 10,
        timing: 'linear',
        axis: 'Y'
      },
      axis: {
        x: 0,
        y: 0,
        z: 0
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
    onAnimChange(duration, timing, axis) {
      this.animation.duration = duration;
      this.animation.timing = timing;
      this.animation.axis = axis;
    },
    onAxisChange(x, y, z) {
      this.axis.x = x;
      this.axis.y = y;
      this.axis.z = z;
    }
  },
  created() {
    const vm = this;
    window.addEventListener('DOMContentLoaded', function() {
      setTimeout(function(){ vm.hasLoaded = true }, 2000)
    }, true);
    EventBus.$on('dimension-changed', this.updateDimensions);
    EventBus.$on('texture-changed', this.processFile);
    EventBus.$on('background-changed', this.onBgChange);
    EventBus.$on('animation-changed', this.onAnimChange);
    EventBus.$on('axis-changed', this.onAxisChange);
  }
}
</script>

<style lang="scss">
#preloader {
  position: fixed;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  h1 {
    font-size: 5vw;
    color: white;
    transform: translateY(-0.25em);
    letter-spacing: -0.025em;
    span {
        animation-name: blink;
        animation-duration: 1.4s;
        animation-iteration-count: infinite;
        animation-fill-mode: both;
    }
    span:nth-child(2) {
        animation-delay: .2s;
    }
    span:nth-child(3) {
        animation-delay: .4s;
    }
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
@keyframes blink {
    0% {
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
}
</style>
