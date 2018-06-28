<template>
  <div id="controls" :class="{ 'hide': !controlsShow}">
    <Dimensions :width="width" :height="height" :depth="depth" :scale="scale" />
    <Textures :cover="cover" :back="back" :spine="spine" />
    <Background :background="background" />
    <Animation :animation="animation" :axis="axis" />
    <Credits />
    <Export :width="width" :height="height" :depth="depth" :scale="scale" :cover="cover" :back="back" :spine="spine" :top="top" :side="side" :background="background" :animation="animation" :axis="axis" />
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
import Export from './Controls/Export'

export default {
  name: 'Controls',
  components: {
    Dimensions, Textures, Background, Animation, Credits, Export
  },
  props: ['width', 'height', 'depth', 'scale', 'cover', 'back', 'spine', 'top', 'side', 'background', 'animation', 'axis'],
  data() {
    return {
      controlsShow: true
    };
  }
}
</script>
