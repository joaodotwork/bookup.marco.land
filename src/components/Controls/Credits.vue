<template>
  <div class="control-box textbox-control" :class="{ 'open': isOpen, 'closed': !isOpen }">
    <h2 @click="isOpen = !isOpen">Credits / About</h2>
    <span class="triangle">
      <svg width="4px" height="6px" viewBox="0 0 4 6" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <g id="MacBook-Pro-15in-Copy" transform="translate(-1275.000000, -8.000000)" fill="#D0021B">
                  <polygon id="triangle" transform="translate(1275.828427, 10.828427) rotate(-45.000000) translate(-1275.828427, -10.828427) " points="1277.37896 8.82842712 1277.82843 12.8284271 1273.82843 12.3789634"></polygon>
              </g>
          </g>
      </svg>
    </span>
    <div class="credits">
      <p>This tool was built for <a class="external" href="http://nodeberlin.com/" target="_blank">NODE Berlin Oslo</a> to present book cover designs, now available for public use.</p>
      <p>Book: <br><em>Public Space? Lost and Found</em> (MIT Press) designed by <a class="external" href="http://nodeberlin.com/" target="_blank">NODE Berlin Oslo</a></p>
      <p>Development: <br><a class="external" href="http://marco.land" target="_blank">Marco Land</a></p>
      <p><a href="http://marco.land/imprint" target="_blank">Imprint</a></p>
    </div>
  </div>
</template>

<script>
import { EventBus } from '../../event-bus.js';

export default {
  name: 'Credits',
  data() {
    return {
      isOpen: false,
    }
  }
}
</script>
