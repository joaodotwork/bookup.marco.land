<template>
  <div class="control-box" :class="{ 'open': isOpen, 'closed': !isOpen }">
    <h2 @click="isOpen = !isOpen">Rotation</h2>
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
      <label for="width">x-axis</label>
      <input class="slider" name="width" type="range" min="-180" max="180" step="1" v-model="xAxis">
      <input class="type-input" type="number" name="width-input" tabindex="5" v-model="xAxis">
      <span>deg</span>
      <label for="width">y-axis</label>
      <input class="slider" name="width" type="range" min="-180" max="180" step="1" v-model="yAxis">
      <input class="type-input" type="number" name="width-input" tabindex="6" v-model="yAxis">
      <span>deg</span>
      <label for="width">z-axis</label>
      <input class="slider" name="width" type="range" min="-180" max="180" step="1" v-model="zAxis">
      <input class="type-input" type="number" name="width-input" tabindex="7" v-model="zAxis">
      <span>deg</span>
      <label for="width">speed</label>
      <input class="slider" name="width" type="range" min="0" max="30" step="1" v-model="sliderDuration">
      <input class="type-input" type="number" name="width-input" tabindex="8" v-model="sliderDuration">
      <span>sec</span>
      <span class="subhead">spin</span>
      <ul class="dropdown">
        <li
          class="small"
          v-for="option, id in axisOptions"
          :key="id"
          :class="{ 'active': option == currentAxis }"
          @click="currentAxis = option"
        >{{ option }}</li>
      </ul>
      <span class="subhead">animation timing</span>
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
  props: ['animation', 'axis'],
  data() {
    return {
      isOpen: false,
      xAxis: this.axis.x,
      yAxis: this.axis.y,
      zAxis: this.axis.z,
      sliderDuration: this.animation.duration,
      timing: this.animation.timing,
      timingOptions: [
        'linear',
        'ease',
        'ease-in',
        'ease-out',
        'ease-in-out',
      ],
      currentAxis: this.animation.axis,
      axisOptions: ['X', 'Y', 'Z']
    }
  },
  watch: {
    sliderDuration: function() {
      this.updateAnimation(this.sliderDuration, this.timing, this.currentAxis)
    },
    timing: function() {
      this.updateAnimation(this.sliderDuration, this.timing, this.currentAxis)
    },
    currentAxis: function() {
      this.updateAnimation(this.sliderDuration, this.timing, this.currentAxis)
    },
    xAxis: function() {
      this.updateAxis(this.xAxis, this.yAxis, this.zAxis)
    },
    yAxis: function() {
      this.updateAxis(this.xAxis, this.yAxis, this.zAxis)
    },
    zAxis: function() {
      this.updateAxis(this.xAxis, this.yAxis, this.zAxis)
    }
  },
  methods: {
    updateAnimation(duration, timing, axis) {
      EventBus.$emit('animation-changed', duration, timing, axis)
    },
    updateAxis(x, y, z) {
      EventBus.$emit('axis-changed', x, y, z)
    }
  }
}
</script>
