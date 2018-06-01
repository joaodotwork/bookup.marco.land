<template>
  <div id="controls" :class="{ 'hide': !controlsShow}">
    <Dimensions :width="width" :height="height" :depth="depth" :scale="scale" />
    <Textures :cover="cover" :back="back" :spine="spine" :paper="paper" />
    <Background :background="background" />
    <Animation :animation="animation" />
    <Credits />
    <div class="control-box hide-button" @click="controlsShow = !controlsShow">
      <span v-if="controlsShow">Hide settings</span>
      <span v-else>Show settings</span>
    </div>
  </div>
</template>

<script>
import Dimensions from './Controls/Dimensions'
import Textures from './Controls/Textures'
import Background from './Controls/Background'
import Animation from './Controls/Animation'
import Credits from './Controls/Credits'

export default {
  name: 'Controls',
  components: {
    Dimensions, Textures, Background, Animation, Credits
  },
  props: ['width', 'height', 'depth', 'scale', 'cover', 'back', 'spine', 'paper', 'background', 'animation'],
  data() {
    return {
      controlsShow: true
    };
  }
}
</script>
