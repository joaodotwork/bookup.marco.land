// Three.js client-side plugin for Nuxt 3
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default defineNuxtPlugin(() => {
  // Provide THREE and OrbitControls to components
  return {
    provide: {
      THREE,
      OrbitControls,
    },
  }
})
