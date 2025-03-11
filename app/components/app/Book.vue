<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// Simple states - defined before use
const error = ref(null)
const isLoading = ref(true)
const canvasRef = ref(null)
const rendererContainer = ref(null)

const { design, dimensions, rotation, animation } = storeToRefs(useBookStore())

let renderer = null
let scene = null
let camera = null
let book = null
let controls = null
let animationFrameId = null
const textures = {
  cover: null,
  back: null,
  spine: null,
  side: null,
  top: null,
}

// Animation function
function animate() {
  if (!renderer || !scene || !camera || !book)
    return

  // Apply manual rotation values (these will be the base rotation)
  book.rotation.x = THREE.MathUtils.degToRad(rotation.value.x)
  book.rotation.y = THREE.MathUtils.degToRad(rotation.value.y)
  book.rotation.z = THREE.MathUtils.degToRad(rotation.value.z)

  // Apply additional rotation if animation is enabled
  if (book && animation.value.enabled) {
    // We directly use animation.value.speed in the calculations below
    const axis = animation.value.axis || 'Y'

    // Store the current manual rotation
    const currentRotation = {
      x: rotation.value.x,
      y: rotation.value.y,
      z: rotation.value.z,
    }

    // Apply the animation rotation to the appropriate axis
    if (axis === 'Y') {
      // Get current animated rotation in degrees (speed increments every frame)
      const animatedDegrees = (Date.now() / 10) * (animation.value.speed / 10) % 360
      // Set the final rotation (manual rotation + animation)
      book.rotation.y = THREE.MathUtils.degToRad(currentRotation.y + animatedDegrees)
    }
    else if (axis === 'X') {
      const animatedDegrees = (Date.now() / 10) * (animation.value.speed / 10) % 360
      book.rotation.x = THREE.MathUtils.degToRad(currentRotation.x + animatedDegrees)
    }
    else if (axis === 'Z') {
      const animatedDegrees = (Date.now() / 10) * (animation.value.speed / 10) % 360
      book.rotation.z = THREE.MathUtils.degToRad(currentRotation.z + animatedDegrees)
    }
  }

  // Render the scene
  renderer.render(scene, camera)

  // Request next frame
  animationFrameId = requestAnimationFrame(animate)
}

// Load texture with error handling
function loadTexture(url) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader()
    loader.load(
      url,
      texture => resolve(texture),
      undefined,
      _err => reject(new Error(`Failed to load texture: ${url}`)),
    )
  })
}

// Load all required textures
async function loadTextures() {
  try {
    textures.cover = await loadTexture('/images/book-cover.jpg')
    textures.back = await loadTexture('/images/book-back.jpg')
    textures.spine = await loadTexture('/images/book-spine.jpg')
    textures.side = await loadTexture('/images/book-side.jpg')
    textures.top = await loadTexture('/images/book-top.jpg')

    // Override with user-provided textures if available
    if (design.value.cover) {
      textures.cover = await loadTexture(design.value.cover)
    }
    if (design.value.back) {
      textures.back = await loadTexture(design.value.back)
    }
    if (design.value.spine) {
      textures.spine = await loadTexture(design.value.spine)
    }

    return true
  }
  catch (error) {
    console.error('Error loading textures:', error)
    throw error
  }
}

// Create book geometry with textures
function createBook() {
  const width = dimensions.value.width / 100
  const height = dimensions.value.height / 100
  const depth = dimensions.value.depth / 100
  const scale = dimensions.value.scale || 1

  // Create a group to hold all book parts
  const bookGroup = new THREE.Group()

  // Set initial rotation to show front cover facing camera
  bookGroup.rotation.set(
    THREE.MathUtils.degToRad(rotation.value.x),
    THREE.MathUtils.degToRad(rotation.value.y),
    THREE.MathUtils.degToRad(rotation.value.z),
  )

  // Create materials using loaded textures - with spine texture on the left side
  const materials = [
    new THREE.MeshStandardMaterial({ map: textures.side }), // right side
    new THREE.MeshStandardMaterial({ map: textures.spine }), // left side (spine)
    new THREE.MeshStandardMaterial({ map: textures.top }), // top
    new THREE.MeshStandardMaterial({ map: textures.top }), // bottom
    new THREE.MeshStandardMaterial({ map: textures.cover }), // front (cover)
    new THREE.MeshStandardMaterial({ map: textures.back }), // back
  ]

  // Create a single book mesh with all textures applied
  const bookGeometry = new THREE.BoxGeometry(width, height, depth)
  const bookMesh = new THREE.Mesh(bookGeometry, materials)

  // Add book to the group
  bookGroup.add(bookMesh)

  // Scale the whole book
  bookGroup.scale.set(scale, scale, scale)

  return bookGroup
}

// Initialize the 3D scene with the book
async function initBookScene() {
  if (!canvasRef.value || !rendererContainer.value)
    return

  isLoading.value = true

  try {
    // Get dimensions
    const width = rendererContainer.value.clientWidth
    const height = rendererContainer.value.clientHeight

    // Create renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: true,
      alpha: true,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)

    // Create scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(design.value.background || '#0072FF')

    // Create camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0, 4) // Position camera for a flat view of the cover
    camera.lookAt(0, 0, 0)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7)
    scene.add(ambientLight)

    // Main light from directly in front for flat view
    const directionalLight1 = new THREE.DirectionalLight(0xFFFFFF, 0.9)
    directionalLight1.position.set(0, 0, 10)
    scene.add(directionalLight1)

    // Additional lights for when book is rotated
    const directionalLight2 = new THREE.DirectionalLight(0xFFFFFF, 0.5)
    directionalLight2.position.set(-5, 3, 2)
    scene.add(directionalLight2)

    const directionalLight3 = new THREE.DirectionalLight(0xFFFFFF, 0.4)
    directionalLight3.position.set(5, -2, -3)
    scene.add(directionalLight3)

    // Load textures
    await loadTextures()

    // Create and add book
    book = createBook()
    scene.add(book)

    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // Start animation
    animate()

    // Handle resize
    window.addEventListener('resize', () => {
      if (!rendererContainer.value || !camera || !renderer)
        return

      const width = rendererContainer.value.clientWidth
      const height = rendererContainer.value.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      renderer.setSize(width, height)
    })

    isLoading.value = false
  }
  catch (e) {
    console.error('Error initializing Three.js scene:', e)
    error.value = e instanceof Error ? e.message : 'Failed to initialize 3D view'
    isLoading.value = false
    throw e
  }
}

// Handle texture updates when design changes
watch(() => [design.value.cover, design.value.back, design.value.spine], async () => {
  if (!book || !scene)
    return

  try {
    // Update textures
    const updatedTextures = {
      cover: design.value.cover ? await loadTexture(design.value.cover) : textures.cover,
      back: design.value.back ? await loadTexture(design.value.back) : textures.back,
      spine: design.value.spine ? await loadTexture(design.value.spine) : textures.spine,
    }

    // Update the material maps
    if (book && book.children && book.children[0]?.material) {
      const materials = book.children[0].material
      if (Array.isArray(materials)) {
        // Update spine (left side - index 1)
        if (updatedTextures.spine) {
          materials[1].map = updatedTextures.spine
          materials[1].needsUpdate = true
          textures.spine = updatedTextures.spine
        }

        // Update cover (front - index 4)
        if (updatedTextures.cover) {
          materials[4].map = updatedTextures.cover
          materials[4].needsUpdate = true
          textures.cover = updatedTextures.cover
        }

        // Update back (back - index 5)
        if (updatedTextures.back) {
          materials[5].map = updatedTextures.back
          materials[5].needsUpdate = true
          textures.back = updatedTextures.back
        }
      }
    }
  }
  catch (e) {
    console.error('Error updating textures:', e)
  }
}, { deep: true })

// Watch for background color changes
watch(() => design.value.background, (newColor) => {
  if (scene) {
    scene.background = new THREE.Color(newColor || '#0072FF')
  }
})

// Watch for dimension changes
watch(() => dimensions.value, async (_newDimensions) => {
  if (!book || !scene)
    return

  try {
    // Remove the old book from the scene
    scene.remove(book)

    // Create a new book with updated dimensions
    book = createBook()
    scene.add(book)

    // Note: we don't need to reload textures since they're already in memory
    // and createBook() will reuse them from the textures object
  }
  catch (e) {
    console.error('Error updating book dimensions:', e)
  }
}, { deep: true })

// Watch for animation setting changes
watch(() => animation.value, (_newAnimation) => {
  // The animation function already uses the latest values from animation.value,
  // so we don't need to do anything specific here.
  // No action needed as the animate function uses reactive animation values
}, { deep: true })

// Function to reset camera position and zoom
function resetCameraView() {
  if (!camera || !controls)
    return

  // Reset camera position
  camera.position.set(0, 0, 4)
  camera.lookAt(0, 0, 0)

  // Reset controls
  controls.reset()

  // For OrbitControls, you may also want to set specific properties
  controls.target.set(0, 0, 0)
  controls.update()
}

// Watch for rotation changes and apply them to the book model
watch(() => rotation.value, (newRotation) => {
  if (!book)
    return

  // Convert from degrees to radians
  book.rotation.x = THREE.MathUtils.degToRad(newRotation.x)
  book.rotation.y = THREE.MathUtils.degToRad(newRotation.y)
  book.rotation.z = THREE.MathUtils.degToRad(newRotation.z)

  // If all rotation values are 0, also reset the camera position and zoom
  if (newRotation.x === 0 && newRotation.y === 0 && newRotation.z === 0) {
    resetCameraView()
  }
}, { deep: true })

// Mount the scene
onMounted(async () => {
  try {
    // Initialize Three.js with book geometry
    await initBookScene()
  }
  catch (e) {
    console.error('Error initializing Three.js:', e)
    error.value = e instanceof Error ? e.message : 'Failed to initialize 3D view'
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

  // Dispose of all geometries and materials
  if (book) {
    book.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry)
          object.geometry.dispose()

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose())
          }
          else {
            object.material.dispose()
          }
        }
      }
    })
  }

  // Dispose of textures
  Object.values(textures).forEach((texture) => {
    if (texture)
      texture.dispose()
  })

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
      <div class="error-message">
        {{ error }}
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner">
        Loading...
      </div>
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
