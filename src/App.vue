<template>
  <div id="app" :style="{'background-color': background}">
    <div class="controls">
      <h2>Dimensions</h2>
      <div class="dimension-input">
        <input type="number" v-model="width"> mm
      </div>
      <div class="dimension-input">
        <input type="number" v-model="height"> mm
      </div>
      <div class="dimension-input">
        <input type="number" v-model="depth"> mm
      </div>
      <h2>Textures</h2>
      <input class="textures" type="file" name="cover" id="cover" @change="processFile($event, 'cover')">
      <label for="cover" id="coverDrop">
        <div class="cover-texture">
          <span>Cover</span>
          <img :src="cover" alt="Cover Texture" class="texture">
        </div>
      </label>
      <input class="textures" type="file"  name="back" id="back" @change="processFile($event, 'back')">
      <label for="back">
        <div class="cover-texture">
          <span>Back</span>
          <img :src="back" alt="Cover Texture" class="texture">
        </div>
      </label>
      <input class="textures" type="file"  name="spine" id="spine" @change="processFile($event, 'spine')">
      <label for="spine">
        <div class="cover-texture">
          <span>Spine</span>
          <img :src="spine" alt="Cover Texture" class="texture">
        </div>
      </label>
      <h2>Background color</h2>
        <input class="background" type="text" v-model="background"> (Hex)
    </div>
    <Book :width="width" :height="height" :depth="depth" :cover="cover" :back="back" :spine="spine" />
  </div>
</template>

<script>
import Book from './components/Book'

export default {
  name: 'App',
  components: {
    Book
  },
  data () {
    return {
      background: '#333',
      width: 170,
      height: 240,
      depth: 30,
      cover: '/static/images/book-cover.jpg',
      back: '/static/images/book-back.jpg',
      spine: '/static/images/book-spine.jpg',
    }
  },
  methods: {
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
    }
  },
  created() {
    document.getElementById('coverDrop').addEventListener('drop', processFile($event, 'cover'), false);
  }
}
</script>

<style lang="scss">
html, body{
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  overflow: hidden;
  font-size: 12px;
}
#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
  text-align: center;
  color: #222;
}
.controls {
  position: fixed;
  right: 0;
  top: 0;
  z-index: 99;
  padding: 2em;
  height: 100vh;
  background-color: rgba(255,255,255,0.8);
  box-shadow: -5px 0px 5px rgba(0,0,0,0.3);
  h2 {
    font-weight: normal;
    padding: 2px 10px;
    box-sizing: border-box;
    font-size: 1rem;
    background-color: #222;
    color: #fff;
    width: 100%;
    border-radius: 10px;
    margin-top: 3em;
  }
  .dimension-input {
    text-align: left;
    input {
      display: inline-block;
      background: none;
      outline: none;
      border: none;
      border-bottom: 1px solid;
      width: 3em;
    }
  }
  input.background {
    display: inline-block;
    background: none;
    outline: none;
    border: none;
    border-bottom: 1px solid;
    width: 4.5em;
  }
  input.textures {
    display: block;
    width: 0.1px;
  	height: 0.1px;
  	opacity: 0;
  	overflow: hidden;
  	position: absolute;
  	z-index: -1;
  }
  .cover-texture {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    text-transform: uppercase;
    margin: 0 0 1em 0;
    span {
      opacity: 0;
      position: absolute;
      z-index: 99;
      mix-blend-mode: difference;
      color: white;
      transition: opacity 200ms;
    }
    img {
      cursor: pointer;
      max-height: 150px;
    }
    &:hover {
      span { opacity: 1}
    }
  }
}
</style>
