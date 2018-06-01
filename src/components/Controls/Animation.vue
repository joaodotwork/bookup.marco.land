<template>
  <div class="control-box" :class="{ 'open': isOpen, 'closed': !isOpen }">
    <h2 @click="isOpen = !isOpen">Animation</h2>
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
      <label for="width">timing</label>
      <input class="slider" name="width" type="range" min="1" max="30" step="1" v-model="sliderDuration">
      <input class="type-input" type="number" name="width-input" v-model="sliderDuration">
      <ul class="dropdown">
        <li
          v-for="option, id in timingOptions"
          :key="id"
          :class="{ 'active': option == timing }"
          @click="timing = option"
        >{{ option }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { EventBus } from '../../event-bus.js';

export default {
  name: 'Animation',
  props: ['animation'],
  data() {
    return {
      isOpen: false,
      sliderDuration: this.animation.duration,
      timing: this.animation.timing,
      timingOptions: [
        'linear',
        'ease',
        'ease-in',
        'ease-out',
        'ease-in-out',
      ]
    }
  },
  watch: {
    sliderDuration: function() {
      this.updateAnimation(this.sliderDuration, this.timing)
    },
    timing: function() {
      this.updateAnimation(this.sliderDuration, this.timing)
    },
  },
  methods: {
    updateAnimation(duration, timing) {
      EventBus.$emit('animation-changed', duration, timing)
    }
  }
}
</script>
