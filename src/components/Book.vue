<template>
  <div class="container">
    <div class="box-holder" style="animation-play-state: running !important;">
        <div  class="box--front"
              :style="{
                'width': boxWidth + 'px',
                'height': boxHeight + 'px',
                'background-image': 'url(' + cover + ')',
                'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,0) translate3d(0,0,0) rotateY(0deg)'
                }"
        ></div>
        <div  class="box--side-left"
              :style="{
                'width': boxDepth + 'px',
                'height': boxHeight + 'px',
                'background': 'url(' + spine + ')',
                'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,0) translate3d(' + boxDepth*-0.5 + 'px, 0, ' + boxDepth*-0.5 + 'px) rotateY(-90deg)'
                }"
        ></div>
        <div  class="box--side-right"
              :style="{
                'width': boxDepth + 'px',
                'height': boxHeight + 'px',
                'background': 'url(' + side + ') no-repeat center center',
                'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,0) translate3d(' + (boxWidth-(boxDepth*0.5)) + 'px, 0px,' + boxDepth*-0.5 + 'px) rotateY(90deg)'
                }"
        ></div>
        <div  class="box--top"
              :style="{
                'width': boxWidth + 'px',
                'height': boxDepth + 'px',
                'background': '#00f',
                'background': 'url(' + top + ') no-repeat center center',
                'transform': 'translate3d(' + boxWidth * -0.5 + 'px, ' + boxHeight * -0.5 + 'px ,0) translate3d(0px, ' + boxDepth*-0.5 + 'px, '+ boxDepth*0.5 + 'px) rotateX(90deg)'
                }"
        ></div>
        <div  class="box--bottom"
              :style="{
                'width': boxWidth + 'px',
                'height': boxDepth + 'px',
                'background': '#000',
                'background': 'url(' + top + ') no-repeat center center',
                'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,0) translate3d(0px, ' + (boxHeight - (boxDepth*0.5)) + 'px, ' + boxDepth*-0.5 + 'px) rotateX(-90deg)'
                }"
        ></div>
        <div  class="box--back"
              :style="{
                'width': boxWidth + 'px',
                'height': boxHeight + 'px',
                'background': 'url(' + back + ')',
                'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,0) translate3d(0,0, -' + boxDepth + 'px) rotateY(180deg)'
                }"
        ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Book',
  props: ['width', 'height', 'depth', 'cover', 'back', 'spine', 'paper'],
  data () {
    return {
      size: 'cover',
      scale: 2,
      side: '/static/images/book-side.jpg',
      top: '/static/images/book-top.jpg'
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
    }
  }
}
</script>

<style lang="scss" >
@keyframes rotatingAnimation {
  0%{
    transform: rotateX(0) translate3d(0,0,0px) rotateY(0deg)
  }
  100% {
    transform: rotateX(0) translate3d(0,0,0px) rotateY(360deg);
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
}
.box-holder{
  transform: rotateY(10deg);
  animation: 10000ms rotatingAnimation linear infinite;
  transform-style: preserve-3d;
  > div {
    position: absolute;
    top: 0;
    left: 0;
    background-size: cover !important;
    backface-visibility: hidden;
  }
}

</style>
