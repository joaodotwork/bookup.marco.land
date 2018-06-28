<template>
  <div class="control-box textbox-control closed">
    <h2 @click="exportHTML">Export</h2>
  </div>
</template>

<script>
import { EventBus } from '../../event-bus.js';
import { saveAs } from 'file-saver';

export default {
  name: 'Export',
  props: ['width', 'height', 'depth', 'scale', 'cover', 'back', 'spine', 'top', 'background', 'animation', 'axis'],
  data() {
    return {
      html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Awesome book</title>
  <meta name="description" content="Awesome book generated with boockup.marco.land">
  <meta name="author" content="boockup.marco.land">
  <link rel="stylesheet" href="css/boockup.css">
</head>
<body>
  <div class="container">
    <div class="boockup">
      <div class="book-container">
        <div class="book-front"></div>
        <div class="book-side-left"></div>
        <div class="book-side-right"></div>
        <div class="book-top"></div>
        <div class="book-bottom"></div>
        <div class="book-back"></div>
      </div>
    </div>
  </div>
</body>
</html>`
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
      return 'rotateX(' + this.axis.x + 'deg) ' + 'rotateY(' + this.axis.y + 'deg) ' + 'rotateZ(' + this.axis.z + 'deg)'
    },
    animationStyleObject: function() {
      return this.animation.duration + 's rotatingAnimation' + this.animation.axis +' ' + this.animation.timing + ' infinite'
    },
    css: function(){
      return `
/* Created with http://boockup.marco.land */
@-webkit-keyframes rotatingAnimationX {
  0%{
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
  }
  100% {
    -webkit-transform: rotateX(360deg);
            transform: rotateX(360deg);
  }
}
@keyframes rotatingAnimationX {
  0%{
    -webkit-transform: rotateX(0deg);
            transform: rotateX(0deg);
  }
  100% {
    -webkit-transform: rotateX(360deg);
            transform: rotateX(360deg);
  }
}
@-webkit-keyframes rotatingAnimationY {
  0%{
    -webkit-transform: rotateY(0deg);
            transform: rotateY(0deg);
  }
  100% {
    -webkit-transform: rotateY(360deg);
            transform: rotateY(360deg);
  }
}
@keyframes rotatingAnimationY {
  0%{
    -webkit-transform: rotateY(0deg);
            transform: rotateY(0deg);
  }
  100% {
    -webkit-transform: rotateY(360deg);
            transform: rotateY(360deg);
  }
}
@-webkit-keyframes rotatingAnimationZ {
  0%{
    -webkit-transform: rotateZ(0deg);
            transform: rotateZ(0deg);
  }
  100% {
    -webkit-transform: rotateZ(360deg);
            transform: rotateZ(360deg);
  }
}
@keyframes rotatingAnimationZ {
  0%{
    -webkit-transform: rotateZ(0deg);
            transform: rotateZ(0deg);
  }
  100% {
    -webkit-transform: rotateZ(360deg);
            transform: rotateZ(360deg);
  }
}
html, body {
  margin: 0;
  padding: 0;
  background-color: blue;
  background-color: rgba(`+ this.background.r +`, `+ this.background.g +`, `+ this.background.b +`, `+ this.background.a +`);
}
.container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  -webkit-perspective: 1200px;
  perspective: 1200px;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
}
.container > div {
  -webkit-transform-style: preserve-3d;
  transform-style: preserve-3d;
}
.boockup {
  -webkit-transform: `+ this.axisStyleObject +`;
  transform: `+ this.axisStyleObject +`;
}
.book-container {
  -webkit-transform-style: preserve-3d;
  transform-style: preserve-3d;
  -webkitanimation: ` + this.animationStyleObject + `;
  animation: ` + this.animationStyleObject + `;
}
.book-container > div {
  position: absolute;
  top: 0;
  left: 0;
  background-size: cover;
  background-position: center center;
  -webkit-backface-visibility: visible;
  backface-visibility: visible;
}
.book-top, .book-bottom, .book-side-right {
  background-size: auto auto;
  background-repeat: repeat;
  background-position: top left;
}
.book-front {
  background-image: url('../images/book-cover.jpg');
  width: ` + this.boxWidth + `px;
  height: ` + this.boxHeight + `px;
  -webkit-transform: translate3d(` + this.boxWidth * -0.5 + `px ,` + this.boxHeight * -0.5 + `px ,` + this.boxDepth/2 + `px) translate3d(0,0,0) rotateY(0deg);
  transform: translate3d(` + this.boxWidth * -0.5 + `px ,` + this.boxHeight * -0.5 + `px ,` + this.boxDepth/2 + `px) translate3d(0,0,0) rotateY(0deg);
}
.book-side-left {
  background-image: url('../images/book-spine.jpg');
  width: `+this.boxDepth + `px;
  height: `+this.boxHeight + `px;
  -webkit-transform: translate3d(` + this.boxWidth * -0.5 + `px ,` + this.boxHeight * -0.5 + `px ,`+this.boxDepth/2+`px) translate3d(` + this.boxDepth*-0.5 + `px, 0, ` + this.boxDepth*-0.5 + `px) rotateY(-90deg);
  transform: translate3d(` + this.boxWidth * -0.5 + `px ,` + this.boxHeight * -0.5 + `px ,`+this.boxDepth/2+`px) translate3d(` + this.boxDepth*-0.5 + `px, 0, ` + this.boxDepth*-0.5 + `px) rotateY(-90deg);
}
.book-side-right {
  background-image: url('../images/book-side.jpg');
  width: `+this.boxDepth + `px;
  height: `+this.boxHeight + `px;
  -webkit-transform: translate3d(` + this.boxWidth * -0.5 + `px ,` + this.boxHeight * -0.5 + `px ,`+this.boxDepth/2+`px) translate3d(` + (this.boxWidth-(this.boxDepth*0.5)) + `px, 0px,` + this.boxDepth*-0.5 + `px) rotateY(90deg);
  transform: translate3d(` + this.boxWidth * -0.5 + `px ,` + this.boxHeight * -0.5 + `px ,`+this.boxDepth/2+`px) translate3d(` + (this.boxWidth-(this.boxDepth*0.5)) + `px, 0px,` + this.boxDepth*-0.5 + `px) rotateY(90deg);
}
.book-top {
  background-image: url('../images/book-top.jpg');
  background-position: bottom right;
  width: `+this.boxWidth + `px;
  height: `+this.boxDepth + `px;
  -webkit-transform: translate3d(` + this.boxWidth * -0.5 + `px, ` + this.boxHeight * -0.5 + `px ,`+this.boxDepth/2+`px) translate3d(0px, ` + this.boxDepth*-0.5 + `px, `+ -this.boxDepth*0.5 + `px) rotateX(90deg);
  transform: translate3d(` + this.boxWidth * -0.5 + `px, ` + this.boxHeight * -0.5 + `px ,`+this.boxDepth/2+`px) translate3d(0px, ` + this.boxDepth*-0.5 + `px, `+ -this.boxDepth*0.5 + `px) rotateX(90deg);
}
.book-bottom {
  background-image: url('../images/book-top.jpg');
  width: `+ this.boxWidth + `px;
  height: ` + this.boxDepth + `px;
  -webkit-transform: translate3d(` + this.boxWidth * -0.5 + `px ,` + this.boxHeight * -0.5 + `px ,`+this.boxDepth/2+`px) translate3d(0px, ` + (this.boxHeight - (this.boxDepth*0.5)) + `px, ` + this.boxDepth*-0.5 + `px) rotateX(-90deg);
  transform: translate3d(` + this.boxWidth * -0.5 + `px ,` + this.boxHeight * -0.5 + `px ,`+this.boxDepth/2+`px) translate3d(0px, ` + (this.boxHeight - (this.boxDepth*0.5)) + `px, ` + this.boxDepth*-0.5 + `px) rotateX(-90deg);
}
.book-back {
  background-image: url('../images/book-back.jpg');
  width: `+this.boxWidth + `px;
  height: `+this.boxHeight + `px;
  -webkit-transform: translate3d(` + this.boxWidth * -0.5 + `px ,` + this.boxHeight * -0.5 + `px ,`+this.boxDepth/2+`px) translate3d(0,0, -` + this.boxDepth + `px) rotateY(180deg);
  transform: translate3d(` + this.boxWidth * -0.5 + `px ,` + this.boxHeight * -0.5 + `px ,`+this.boxDepth/2+`px) translate3d(0,0, -` + this.boxDepth + `px) rotateY(180deg);
}
      `;
    }
  },
  methods: {
    toDataUrl: function (url) {
      return new JSZip.external.Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = function() {
        // you should handle non "200 OK" responses as a failure with reject
        resolve(xhr.response);
      };
      // you should handle failures too
      xhr.open('GET', url);
      xhr.send();
    });
    },
    exportHTML: function(){
      var zip = new JSZip();
      zip.file("index.html", this.html);
      zip.file("css/boockup.css", this.css);
      zip.file("images/book-spine.jpg", this.toDataUrl(this.spine));
      zip.file("images/book-cover.jpg", this.toDataUrl(this.cover));
      zip.file("images/book-back.jpg", this.toDataUrl(this.back));
      zip.file("images/book-top.jpg", this.toDataUrl(this.top));
      zip.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, "Boockup.zip");
      }, function (e) {
        console.error("an error occurred", e);
      });
    }
  }
}
</script>
