<script setup lang="ts">
// Import Three.js directly - we'll ensure it only runs on client side
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// Simple states - defined before use
const error = ref(null)
const isLoading = ref(true)
const canvasRef = ref(null)
const rendererContainer = ref(null)

const { design, dimensions, rotation, animation, lighting } = storeToRefs(useBookStore())

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

// Store light references so we can adjust them based on presets
const lights = {
  ambient: null,
  main: null,
  fill: null,
  rim: null,
}

// Store animation offset to track continuous rotation
const animationOffset = {
  x: 0,
  y: 0,
  z: 0,
}

// Store animation progress for easing functions (0-1)
const animationProgress = {
  x: 0,
  y: 0,
  z: 0,
}

// We'll use continuous rotation with easing instead of keyframes

// Last timestamp for smooth animation
let lastAnimationTime = Date.now()

// Smoother easing functions with no hard stops
const easingFunctions = {
  // Linear is consistent speed
  'linear': t => 0.5,
  
  // Ease with smooth curve (no sudden stops)
  'ease': t => {
    // Sine wave oscillation (0.5-1.0)
    return 0.75 + Math.sin(t * Math.PI * 2) * 0.25
  },
  
  // Ease-in starts slower, gradually speeds up
  'ease-in': t => {
    // Smoother sine-based variation (0.3-0.7)
    return 0.5 + Math.sin(t * Math.PI * 2 - Math.PI/2) * 0.2
  },
  
  // Ease-out starts faster, gradually slows down
  'ease-out': t => {
    // Inverse of ease-in
    return 0.5 - Math.sin(t * Math.PI * 2 - Math.PI/2) * 0.2
  },
  
  // Ease-in-out combines both patterns
  'ease-in-out': t => {
    // More pronounced sine wave (0.25-0.75)
    return 0.5 + Math.sin(t * Math.PI * 2) * 0.25
  }
}

// Animation function
function animate() {
  if (!renderer || !scene || !camera || !book)
    return

  const currentTime = Date.now()
  const deltaTime = (currentTime - lastAnimationTime) / 1000 // seconds
  lastAnimationTime = currentTime

  // Apply manual rotation values (these will be the base rotation)
  book.rotation.x = THREE.MathUtils.degToRad(rotation.value.x)
  book.rotation.y = THREE.MathUtils.degToRad(rotation.value.y)
  book.rotation.z = THREE.MathUtils.degToRad(rotation.value.z)

  // Apply additional rotation if animation is enabled
  if (book && animation.value.enabled) {
    // Use animation.value.speed as the base rate
    const axis = animation.value.axis || 'Y'
    // Ensure speed value is at least 1 to avoid division by zero
    const speedValue = Math.max(1, animation.value.speed)
    // Calibrate speed: 10 = normal (60 deg/sec), 1 = fast (600 deg/sec), 100 = slow (6 deg/sec)
    const baseSpeed = 600 // degrees per second when speed is 1
    const speed = baseSpeed / speedValue // inverse relationship: higher number = slower speed

    // Get the easing function or default to linear
    const timingFunction = animation.value.timing || 'linear'
    const ease = easingFunctions[timingFunction] || easingFunctions.linear

    // Update the continuous animation offset based on speed and easing
    if (axis === 'Y') {
      // Update progress for easing (0-1 range, loops every 3 seconds regardless of speed)
      // This creates a gentle easing cycle that's independent of rotation speed
      animationProgress.y = (animationProgress.y + deltaTime / 3) % 1
      
      // Get easing multiplier (value between ~0.3-0.7 based on easing function)
      const easingValue = ease(animationProgress.y)
      
      // Apply rotation with easing multiplier
      // For linear, this will be a consistent speed (using 0.5 multiplier)
      // For other easing types, speed will vary smoothly based on the easing pattern
      animationOffset.y += speed * deltaTime * easingValue * 2
    }
    else if (axis === 'X') {
      // Update progress for easing
      animationProgress.x = (animationProgress.x + deltaTime / 3) % 1
      
      // Get easing multiplier
      const easingValue = ease(animationProgress.x)
      
      // Apply eased rotation
      animationOffset.x += speed * deltaTime * easingValue * 2
    }
    else if (axis === 'Z') {
      // Update progress for easing
      animationProgress.z = (animationProgress.z + deltaTime / 3) % 1
      
      // Get easing multiplier
      const easingValue = ease(animationProgress.z)
      
      // Apply eased rotation
      animationOffset.z += speed * deltaTime * easingValue * 2
    }

    // Apply the animation offsets to the book rotation
    book.rotation.x += THREE.MathUtils.degToRad(animationOffset.x)
    book.rotation.y += THREE.MathUtils.degToRad(animationOffset.y)
    book.rotation.z += THREE.MathUtils.degToRad(animationOffset.z)

    // Reset the offsets after applying them
    animationOffset.x = axis === 'X' ? animationOffset.x % 360 : 0
    animationOffset.y = axis === 'Y' ? animationOffset.y % 360 : 0
    animationOffset.z = axis === 'Z' ? animationOffset.z % 360 : 0
  }

  // Render the scene
  renderer.render(scene, camera)

  // Request next frame
  animationFrameId = requestAnimationFrame(animate)
}

// Load texture with error handling
function loadTexture(url) {
  return new Promise((resolve, reject) => {
    console.log(`Starting texture load: ${url}`)

    // Make sure THREE is defined
    if (!THREE || !THREE.TextureLoader) {
      console.error('THREE.js is not properly initialized')
      return reject(new Error('THREE.js not initialized'))
    }

    const loader = new THREE.TextureLoader()

    loader.load(
      url,
      (texture) => {
        console.log(`Successfully loaded texture: ${url}`)
        resolve(texture)
      },
      (event) => {
        console.log(`Loading texture progress: ${url} - ${event ? Math.round(event.loaded / event.total * 100) : 'unknown'}%`)
      },
      (err) => {
        console.error(`Failed to load texture: ${url}`, err)
        reject(new Error(`Failed to load texture: ${url}`))
      },
    )
  })
}

// Load all required textures
async function loadTextures() {
  try {
    console.log('Starting texture loading...')

    console.log('Loading cover texture...')
    textures.cover = await loadTexture('/images/book-cover.jpg')

    console.log('Loading back texture...')
    textures.back = await loadTexture('/images/book-back.jpg')

    console.log('Loading spine texture...')
    textures.spine = await loadTexture('/images/book-spine.jpg')

    console.log('Loading side texture...')
    textures.side = await loadTexture('/images/book-side.jpg')

    console.log('Loading top texture...')
    textures.top = await loadTexture('/images/book-top.jpg')

    // Override with user-provided textures if available
    if (design.value.cover) {
      console.log('Loading custom cover texture...')
      textures.cover = await loadTexture(design.value.cover)
    }
    if (design.value.back) {
      console.log('Loading custom back texture...')
      textures.back = await loadTexture(design.value.back)
    }
    if (design.value.spine) {
      console.log('Loading custom spine texture...')
      textures.spine = await loadTexture(design.value.spine)
    }

    console.log('All textures loaded successfully')
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
  
  // Enable shadows for the book
  bookMesh.receiveShadow = true
  bookMesh.castShadow = true

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
    
    // Configure shadow properties (will be enabled/disabled per preset)
    renderer.shadowMap.enabled = false 
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Create scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(design.value.background || '#0072FF')

    // Create camera
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 0, 4) // Position camera for a flat view of the cover
    camera.lookAt(0, 0, 0)

    // Set up initial lighting based on preset
    setupLighting(lighting.value.preset)

    // Load textures
    await loadTextures()

    // Create and add book
    book = createBook()
    scene.add(book)

    // Add orbit controls
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    // Add event listener for control changes
    controls.addEventListener('change', () => {
      // This function will be called whenever the controls change the camera
      // But we don't update rotation values here to avoid feedback loops
    })

    // Add event listener for control end events
    controls.addEventListener('end', () => {
      // This is called when the user finishes interacting with the controls
      // We could update the UI state here if needed
    })

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

// Watch for lighting preset changes
watch(() => lighting.value.preset, (newPreset) => {
  setupLighting(newPreset)
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
watch(() => animation.value, (newAnimation, oldAnimation) => {
  // When animation is turned on, set the last time to now to avoid jumps
  // and ensure animation starts from the current position
  if (newAnimation.enabled && !oldAnimation.enabled) {
    lastAnimationTime = Date.now()
    
    // Reset animation offsets and progress counters
    animationOffset.x = 0
    animationOffset.y = 0
    animationOffset.z = 0
    animationProgress.x = 0
    animationProgress.y = 0
    animationProgress.z = 0
    
    // Because we're resetting offsets, we need to update rotation values 
    // to match the current visual position of the book
    if (book) {
      // Convert from radians to degrees and update the store
      rotation.value.x = THREE.MathUtils.radToDeg(book.rotation.x)
      rotation.value.y = THREE.MathUtils.radToDeg(book.rotation.y)
      rotation.value.z = THREE.MathUtils.radToDeg(book.rotation.z)
    }
  }

  // When animation is turned off, update rotation to match current visual position
  if (!newAnimation.enabled && oldAnimation.enabled) {
    // Update the rotation store values to match the current visual position
    if (book) {
      // Convert from radians to degrees and update the store
      rotation.value.x = THREE.MathUtils.radToDeg(book.rotation.x)
      rotation.value.y = THREE.MathUtils.radToDeg(book.rotation.y)
      rotation.value.z = THREE.MathUtils.radToDeg(book.rotation.z)
    }
    
    // Reset accumulated offsets since we've stored the position in rotation values
    animationOffset.x = 0
    animationOffset.y = 0
    animationOffset.z = 0
    
    // Reset progress values
    animationProgress.x = 0
    animationProgress.y = 0
    animationProgress.z = 0
  }

  // When axis changes while animation is enabled, update rotation and reset offsets
  if (newAnimation.enabled && oldAnimation.enabled && newAnimation.axis !== oldAnimation.axis) {
    // First capture the current visual rotation
    if (book) {
      // Convert from radians to degrees and update the store
      rotation.value.x = THREE.MathUtils.radToDeg(book.rotation.x)
      rotation.value.y = THREE.MathUtils.radToDeg(book.rotation.y)
      rotation.value.z = THREE.MathUtils.radToDeg(book.rotation.z)
    }
    
    // Reset all offsets and progress values
    animationOffset.x = 0
    animationOffset.y = 0
    animationOffset.z = 0
    animationProgress.x = 0
    animationProgress.y = 0
    animationProgress.z = 0
  }

  // When timing changes, update rotation and reset progress
  if (newAnimation.enabled && oldAnimation.enabled && newAnimation.timing !== oldAnimation.timing) {
    // First capture the current visual rotation
    if (book) {
      // Convert from radians to degrees and update the store
      rotation.value.x = THREE.MathUtils.radToDeg(book.rotation.x)
      rotation.value.y = THREE.MathUtils.radToDeg(book.rotation.y)
      rotation.value.z = THREE.MathUtils.radToDeg(book.rotation.z)
    }
    
    // Reset all progress values
    animationProgress.x = 0
    animationProgress.y = 0
    animationProgress.z = 0
  }
}, { deep: true })

// Configure lighting based on selected preset
function setupLighting(preset = 'studio') {
  if (!scene || !renderer) return
  
  // Clear existing lights before adding new ones
  if (lights.ambient) scene.remove(lights.ambient)
  if (lights.main) scene.remove(lights.main)
  if (lights.fill) scene.remove(lights.fill)
  if (lights.rim) scene.remove(lights.rim)
  
  // Reset shadow settings
  renderer.shadowMap.enabled = false
  
  // Create lighting setups based on preset
  switch (preset) {
    case 'studio':
      // Studio lighting - balanced, professional setup with three-point lighting
      lights.ambient = new THREE.AmbientLight(0xFFFFFF, 0.5)
      lights.main = new THREE.DirectionalLight(0xFFFFFF, 1.0) // Key light
      lights.main.position.set(0, 0, 10)
      lights.fill = new THREE.DirectionalLight(0xFFFFFF, 0.6) // Fill light
      lights.fill.position.set(-6, 3, 3)
      lights.rim = new THREE.DirectionalLight(0xFFFFFF, 0.5) // Rim/back light
      lights.rim.position.set(5, -2, -4)
      break
    
    case 'soft':
      // Soft lighting - diffused, gentle lighting with less contrast
      lights.ambient = new THREE.AmbientLight(0xFFFFFF, 0.8)
      lights.main = new THREE.DirectionalLight(0xFFFAF0, 0.7) // Soft warm main light
      lights.main.position.set(2, 1, 8)
      lights.fill = new THREE.DirectionalLight(0xF0F8FF, 0.4) // Soft cool fill light
      lights.fill.position.set(-3, 2, 5)
      // No harsh rim light for soft lighting
      lights.rim = new THREE.DirectionalLight(0xF8F8FF, 0.2)
      lights.rim.position.set(3, -1, -2)
      break
    
    case 'display':
      // Display lighting - dramatic, showroom-style with focused lights
      
      // Enable shadows for dramatic effect
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      
      lights.ambient = new THREE.AmbientLight(0x333333, 0.3) // Dark ambient
      
      // Main spotlight with shadows
      lights.main = new THREE.SpotLight(0xFFFFFF, 1.5, 30, Math.PI/4, 0.3)
      lights.main.position.set(0, 5, 10)
      lights.main.castShadow = true
      lights.main.shadow.mapSize.width = 1024
      lights.main.shadow.mapSize.height = 1024
      lights.main.shadow.camera.near = 1
      lights.main.shadow.camera.far = 30
      
      // Cool fill light
      lights.fill = new THREE.DirectionalLight(0xCCE0FF, 0.4)
      lights.fill.position.set(-5, 3, 0)
      
      // Strong rim light
      lights.rim = new THREE.DirectionalLight(0xFFD700, 0.5) // Slightly golden rim light
      lights.rim.position.set(7, -3, -5)
      break
      
    default:
      // Fallback to studio lighting if preset is unknown
      setupLighting('studio')
      return
  }
  
  // Add all lights to the scene
  scene.add(lights.ambient)
  scene.add(lights.main)
  scene.add(lights.fill)
  scene.add(lights.rim)
}

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

  // Disable any auto-rotation
  if (controls.autoRotate) {
    controls.autoRotate = false
  }

  controls.update()
}

// Create a global reset function that can be called from outside components
window.resetBookCamera = () => {
  resetCameraView()

  // Reset the rotation values in the store
  rotation.value.x = 0
  rotation.value.y = 0
  rotation.value.z = 0

  // Reset animation offsets to avoid jumps
  animationOffset.x = 0
  animationOffset.y = 0
  animationOffset.z = 0

  // Reset animation progress
  animationProgress.x = 0
  animationProgress.y = 0
  animationProgress.z = 0

  // Reset animation timer
  lastAnimationTime = Date.now()
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
    console.log('Initializing Three.js scene...')
    await initBookScene()
    console.log('Three.js scene initialized successfully')
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
