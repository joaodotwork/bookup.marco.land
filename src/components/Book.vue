<template>
  <div class="container" @mousemove="onMouseMove" @mouseup="onMouseUp">
    <div :style="axisStyleObject">
      <div class="book-container" :style="animationStyleObject" @mousedown="onMouseDown" @mouseup="onMouseUp">
          <div  class="book-front"
                :style="{
                  'width': boxWidth + 'px',
                  'height': boxHeight + 'px',
                  'background-image': 'url(' + cover + ')',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(0,0,0) rotateY(0deg)'
                  }"
          ></div>
          <div  class="book-side-left"
                :style="{
                  'width': boxDepth+1 + 'px',
                  'height': boxHeight+1 + 'px',
                  'background': 'url(' + spine + ')',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(' + boxDepth*-0.5 + 'px, 0, ' + boxDepth*-0.5 + 'px) rotateY(-90deg)'
                  }"
          ></div>
          <div  class="book-side-right"
                :style="{
                  'width': boxDepth+1 + 'px',
                  'height': boxHeight+1 + 'px',
                  'background': 'url(' + side + ') no-repeat center center',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(' + (boxWidth-(boxDepth*0.5)) + 'px, 0px,' + boxDepth*-0.5 + 'px) rotateY(90deg)'
                  }"
          ></div>
          <div  class="book-top"
                :style="{
                  'width': boxWidth+1 + 'px',
                  'height': boxDepth + 'px',
                  'background': '#00f',
                  'background': 'url(' + top + ') no-repeat center center',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px, ' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(0px, ' + boxDepth*-0.5 + 'px, '+ -boxDepth*0.5 + 'px) rotateX(90deg)'
                  }"
          ></div>
          <div  class="book-bottom"
                :style="{
                  'width': boxWidth+1 + 'px',
                  'height': boxDepth + 'px',
                  'background': '#000',
                  'background': 'url(' + top + ') no-repeat center center',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(0px, ' + (boxHeight - (boxDepth*0.5)) + 'px, ' + boxDepth*-0.5 + 'px) rotateX(-90deg)'
                  }"
          ></div>
          <div  class="book-back"
                :style="{
                  'width': boxWidth+1 + 'px',
                  'height': boxHeight+1 + 'px',
                  'background': 'url(' + back + ')',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(0,0, -' + boxDepth + 'px) rotateY(180deg)'
                  }"
          ></div>
      </div>
    </div>
  </div>
</template>

<script>
import { EventBus } from '../event-bus.js';

export default {
  name: 'Book',
  props: ['width', 'height', 'depth', 'scale', 'cover', 'back', 'spine', 'paper', 'animation', 'axis'],
  data () {
    return {
      size: 'cover',
      side: '/static/images/book-side.jpg',
      top: '/static/images/book-top.jpg',
      mousedown: false,
      playState: 'running',
      dragStartCoordinates: {
        x: null,
        y: null
      },
      originalStartCoordinates: {
        x: null,
        y: null
      }
    }
  },
  computed: {
    boxWidth: function() {
      return this.width * this.scale
    },
    boxHeight: function() {
      return this.height * this.scale
    },
    boxDepth: function() {
      return this.depth * this.scale
    },
    axisStyleObject: function() {
      return 'transform: rotateX(' + this.axis.x + 'deg) ' + 'rotateY(' + this.axis.y + 'deg) ' + 'rotateZ(' + this.axis.z + 'deg)'
    },
    animationStyleObject: function() {
      return 'animation: ' + this.animation.duration + 's rotatingAnimation' + this.animation.axis +' ' + this.animation.timing + ' infinite ' + this.playState
    }
  },
  watch: {
    axis:{
      handler: function() {
        this.updateAxis(parseInt(this.axis.x), parseInt(this.axis.y), parseInt(this.axis.z));
      },
      deep: true
    },
    mousedown: function() {
      EventBus.$emit('mousedown', this.mousedown)
    }
  },
  methods: {
    onMouseDown: function(e) {
      this.mousedown = true;
      this.playState = 'paused';
      this.dragStartCoordinates.x = e.clientX;
      this.dragStartCoordinates.y = e.clientY;
      this.originalStartCoordinates.x = this.axis.y;
      this.originalStartCoordinates.y = this.axis.x;
    },
    onMouseUp: function(e) {
      this.mousedown = false;
      this.playState = 'running';
      while (this.axis.x < -180) { this.axis.x += 360 }
      while (this.axis.x > 180) { this.axis.x -= 360 }
      while (this.axis.y < -180) { this.axis.y += 360 }
      while (this.axis.y > 180) { this.axis.y -= 360 }
    },
    onMouseMove: function(e) {
      if (!this.mousedown) { return }
      this.axis.x = this.originalStartCoordinates.y + (this.dragStartCoordinates.y - e.clientY);
      this.axis.y = this.originalStartCoordinates.x - (this.dragStartCoordinates.x - e.clientX);
    },
    updateAxis(x, y, z) {
      EventBus.$emit('axis-changed', x, y, z)
    }
  }
}
</script>

<style lang="scss" >
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
.container{
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  perspective: 1200px;
  display: flex;
  justify-content: center;
  align-items: center;
  > div {
    transform-style: preserve-3d;
  }
}
.book-container{
  cursor: grab;
  transform-style: preserve-3d;
  > div {
    position: absolute;
    top: 0;
    left: 0;
    background-size: cover !important;
    background-position: center center !important;
    backface-visibility: visible;
  }
  .book-top, .book-bottom, .book-side-right {
    background-size: auto  auto !important;
    background-repeat: repeat !important;
    background-position: top left !important;
  }
  .book-top, {
    background-position: bottom right !important;
  }
}
.mousedown .book-container {
  cursor: grabbing;
}
</style>
