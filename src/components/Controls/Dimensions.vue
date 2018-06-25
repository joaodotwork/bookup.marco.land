<template>
  <div class="control-box textbox-control" :class="{ 'open': isOpen, 'closed': !isOpen }">
    <h2 @click="isOpen = !isOpen">Dimensions</h2>
    <span class="triangle">
      <svg width="4px" height="6px" viewBox="0 0 4 6" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <g id="MacBook-Pro-15in-Copy" transform="translate(-1275.000000, -8.000000)" fill="#D0021B">
                  <polygon id="triangle" transform="translate(1275.828427, 10.828427) rotate(-45.000000) translate(-1275.828427, -10.828427) " points="1277.37896 8.82842712 1277.82843 12.8284271 1273.82843 12.3789634"></polygon>
              </g>
          </g>
      </svg>
    </span>
    <div class="dimension-input">
      <label for="width">width</label>
      <input class="slider" name="width" type="range" min="10" max="500" v-model="sliderWidth">
      <input class="type-input" type="number" name="width-input" tabindex="1" v-model="sliderWidth">
    </div>
    <div class="dimension-input">
      <label for="width">height</label>
      <input class="slider" name="width" type="range" min="10" max="500" v-model="sliderHeight">
      <input class="type-input" type="number" name="height-input" tabindex="2" v-model="sliderHeight">
    </div>
    <div class="dimension-input">
      <label for="width">depth</label>
      <input class="slider" name="width" type="range" min="1" max="500" v-model="sliderDepth">
      <input class="type-input" type="number" name="depth-input" tabindex="3" v-model="sliderDepth">
    </div>
    <div class="dimension-input">
      <label for="width">scale</label>
      <input class="slider" name="width" type="range" min="0.5" max="5" step="0.01" v-model="sliderScale">
      <input class="type-input" type="number" name="scale-input" tabindex="4" v-model="sliderScale">
    </div>
  </div>
</template>

<script>
import { EventBus } from '../../event-bus.js';

export default {
  name: 'Dimensions',
  props: ['width', 'height', 'depth', 'scale'],
  data() {
    return {
      isOpen: false,
      sliderWidth: this.width,
      sliderHeight: this.height,
      sliderDepth: this.depth,
      sliderScale: this.scale
    }
  },
  watch: {
    sliderWidth: function(){
      EventBus.$emit('dimension-changed', this.sliderWidth, this.sliderHeight, this.sliderDepth, this.sliderScale);
    },
    sliderHeight: function(){
      EventBus.$emit('dimension-changed', this.sliderWidth, this.sliderHeight, this.sliderDepth, this.sliderScale);
    },
    sliderDepth: function(){
      EventBus.$emit('dimension-changed', this.sliderWidth, this.sliderHeight, this.sliderDepth, this.sliderScale);
    },
    sliderScale: function(){
      EventBus.$emit('dimension-changed', this.sliderWidth, this.sliderHeight, this.sliderDepth, this.sliderScale);
    }
  }
}
</script>
