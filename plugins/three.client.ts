// Three.js client-side plugin
// This ensures Three.js is only loaded in the browser
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      // Provide Three.js and useful components to the app
      THREE,
      OrbitControls,
    },
  }
})
