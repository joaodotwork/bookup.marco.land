<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const { design } = storeToRefs(useBookStore())

const canvasRef = ref(null)
const rendererContainer = ref(null)
let renderer = null
let scene = null
let camera = null
let mesh = null
let controls = null
let animationFrameId = null

// Simple animation function
function animate() {
  if (!renderer || !scene || !camera || !mesh) return
  
  // Rotate the cube
  if (mesh) {
    mesh.rotation.x += 0.01
    mesh.rotation.y += 0.01
  }
  
  // Render the scene
  renderer.render(scene, camera)
  
  // Request next frame
  animationFrameId = requestAnimationFrame(animate)
}

// Initialize a simple Three.js scene with just a cube
function initThreeCube() {
  if (!canvasRef.value || !rendererContainer.value) return
  
  // Get dimensions
  const width = rendererContainer.value.clientWidth
  const height = rendererContainer.value.clientHeight
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  })
  renderer.setSize(width, height)
  
  // Create scene
  scene = new THREE.Scene()
  scene.background = new THREE.Color(design.value.background || '#0072FF')
  
  // Create camera
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  camera.position.z = 5
  
  // Create a simple cube
  const geometry = new THREE.BoxGeometry(2, 2, 2)
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
  mesh = new THREE.Mesh(geometry, material)
  
  // Add to scene
  scene.add(mesh)
  
  // Add orbit controls
  controls = new OrbitControls(camera, renderer.domElement)
  
  // Start animation
  animate()
  
  // Handle resize
  window.addEventListener('resize', () => {
    if (!rendererContainer.value || !camera || !renderer) return
    
    const width = rendererContainer.value.clientWidth
    const height = rendererContainer.value.clientHeight
    
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    
    renderer.setSize(width, height)
  })
}

// Simple states
const error = ref(null)
const isLoading = ref(true)

// Mount the scene
onMounted(() => {
  try {
    // Initialize Three.js
    initThreeCube()
    isLoading.value = false
  } catch (e) {
    console.error('Error initializing Three.js:', e)
    error.value = e instanceof Error ? e.message : 'Failed to initialize 3D view'
    isLoading.value = false
  }
})

// Clean up
onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  
  if (renderer) {
    renderer.dispose()
  }
  
  if (mesh && mesh.geometry) {
    mesh.geometry.dispose()
  }
  
  window.removeEventListener('resize', () => {})
})
</script>

<template>
  <div
    id="book"
    ref="rendererContainer"
    :style="{ backgroundColor: design.background }"
  >
    <!-- Error message -->
    <div v-if="error" class="error-container">
      <div class="error-message">{{ error }}</div>
    </div>
    
    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner">Loading...</div>
    </div>
    
    <!-- Three.js canvas -->
    <canvas ref="canvasRef" />
  </div>
</template>

<style>
#book {
  width: 100%;
  height: 100vh;
  position: relative;
}

canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.error-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  text-align: center;
  z-index: 10;
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  color: #333;
  z-index: 5;
}
</style>