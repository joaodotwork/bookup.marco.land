<template>
  <aside class="marquee"><slot /></aside>
</template>
<style lang="scss">
aside.marquee {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  font-size: 10px;
  letter-spacing: 0.05em;
  color: black;
  height: 24px;
  z-index: 99;
  color: white;
  background: black;
  display: flex;
  justify-content: center;
  align-items: center;
  text-transform: uppercase;
  a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.2em;
    &:hover {
      text-decoration: none;
    }
  }
  .close {
    user-select: none;
    cursor: pointer;
    display: inline-block;
    padding: 2px 5px;
    font-size: 1.75em;
    // line-height: 0;
    transform: translateY(-0.05em);
  }
}
</style>
