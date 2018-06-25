<template>
  <div class="container">
    <div :style="axisStyleObject">
      <div class="box-holder" :style="animationStyleObject">
          <div  class="box--front"
                :style="{
                  'width': boxWidth + 'px',
                  'height': boxHeight + 'px',
                  'background-image': 'url(' + cover + ')',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(0,0,0) rotateY(0deg)'
                  }"
          ></div>
          <div  class="box--side-left"
                :style="{
                  'width': boxDepth+2 + 'px',
                  'height': boxHeight + 'px',
                  'background': 'url(' + spine + ')',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(' + boxDepth*-0.5 + 'px, 0, ' + boxDepth*-0.5 + 'px) rotateY(-90deg)'
                  }"
          ></div>
          <div  class="box--side-right"
                :style="{
                  'width': boxDepth+2 + 'px',
                  'height': boxHeight + 'px',
                  'background': 'url(' + side + ') no-repeat center center',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(' + (boxWidth-(boxDepth*0.5)) + 'px, 0px,' + boxDepth*-0.5 + 'px) rotateY(90deg)'
                  }"
          ></div>
          <div  class="box--top"
                :style="{
                  'width': boxWidth + 'px',
                  'height': boxDepth + 'px',
                  'background': '#00f',
                  'background': 'url(' + top + ') no-repeat center center',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px, ' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(0px, ' + boxDepth*-0.5 + 'px, '+ -boxDepth*0.5 + 'px) rotateX(90deg)'
                  }"
          ></div>
          <div  class="box--bottom"
                :style="{
                  'width': boxWidth + 'px',
                  'height': boxDepth + 'px',
                  'background': '#000',
                  'background': 'url(' + top + ') no-repeat center center',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(0px, ' + (boxHeight - (boxDepth*0.5)) + 'px, ' + boxDepth*-0.5 + 'px) rotateX(-90deg)'
                  }"
          ></div>
          <div  class="box--back"
                :style="{
                  'width': boxWidth + 'px',
                  'height': boxHeight + 'px',
                  'background': 'url(' + back + ')',
                  'transform': 'translate3d(' + boxWidth * -0.5 + 'px ,' + boxHeight * -0.5 + 'px ,'+boxDepth/2+'px) translate3d(0,0, -' + boxDepth + 'px) rotateY(180deg)'
                  }"
          ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Book',
  props: ['width', 'height', 'depth', 'scale', 'cover', 'back', 'spine', 'paper', 'animation', 'axis'],
  data () {
    return {
      size: 'cover',
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
    },
    axisStyleObject: function() {
      return 'transform: rotateX(' + this.axis.x + 'deg) ' + 'rotateY(' + this.axis.y + 'deg) ' + 'rotateZ(' + this.axis.z + 'deg)'
    },
    animationStyleObject: function() {
      return 'animation: ' + this.animation.duration + 's rotatingAnimation' + this.animation.axis +' ' + this.animation.timing + ' infinite'
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
.box-holder{
  transform-style: preserve-3d;
  > div {
    position: absolute;
    top: 0;
    left: 0;
    background-size: cover !important;
    background-position: center center;
    backface-visibility: hidden;
  }
}

</style>
