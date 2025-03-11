<script setup lang="ts">
// Use Nuxt's plugin system to get Three.js instances
const { $THREE, $OrbitControls, $isThreeReady } = useNuxtApp()
// Create aliases for consistency with existing code
const THREE = $THREE
const OrbitControls = $OrbitControls
const isThreeReady = $isThreeReady

// Log THREE.js availability status
console.log('THREE.js available in component:', { 
  hasThree: !!THREE, 
  hasOrbitControls: !!OrbitControls,
  isThreeReady
})

const { design, dimensions, animation, lighting } = storeToRefs(useBookStore())

const canvasRef = ref<HTMLCanvasElement | null>(null)
const rendererContainer = ref<HTMLDivElement | null>(null)
let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let book: THREE.Group
let animationFrameId: number
let lights: {
  ambient: THREE.AmbientLight
  main: THREE.DirectionalLight
  fill: THREE.DirectionalLight
  rim: THREE.DirectionalLight
}
// Create texture loader only when THREE is available
const textureLoader = ref<any>(null)
// Initialize texture loader once THREE is confirmed available
if (THREE && THREE.TextureLoader) {
  textureLoader.value = new THREE.TextureLoader()
}

const loadedTextures = ref<Record<string, any>>({})

// Computed properties for book dimensions
const width = computed(() => dimensions.value.width * (dimensions.value.scale + 1))
const height = computed(() => dimensions.value.height * (dimensions.value.scale + 1))
const depth = computed(() => dimensions.value.depth * (dimensions.value.scale + 1))

// Handle preloading textures
const loaded = ref(false)
const textureUrls = [
  { key: 'cover', url: '/images/book-cover.jpg' },
  { key: 'back', url: '/images/book-back.jpg' },
  { key: 'spine', url: '/images/book-spine.jpg' },
  { key: 'side', url: '/images/book-side.jpg' },
  { key: 'top', url: '/images/book-top.jpg' },
]

// Load all textures with color correction
async function loadTextures() {
  // Safety check
  if (!textureLoader.value) {
    console.error('TextureLoader not initialized')
    
    // Try to create a new one if THREE is available
    if (THREE && THREE.TextureLoader) {
      console.log('Creating new TextureLoader instance')
      textureLoader.value = new THREE.TextureLoader()
    } else {
      throw new Error('Cannot create TextureLoader - THREE not available')
    }
  }
  
  const promises = textureUrls.map(({ key, url }) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Get the texture source - either from design or default
        const designKey = key as keyof typeof design.value
        const textureSource = design.value[designKey] || url
        
        if (!textureLoader.value) {
          throw new Error('TextureLoader not available')
        }

        textureLoader.value.load(
          textureSource,
          (texture) => {
            try {
              // Apply texture settings for better color reproduction
              if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding // Use sRGB encoding for correct colors
              texture.anisotropy = 16 // Improve texture sharpness
              texture.generateMipmaps = true
              if (THREE.LinearMipmapLinearFilter) texture.minFilter = THREE.LinearMipmapLinearFilter
              if (THREE.LinearFilter) texture.magFilter = THREE.LinearFilter
              if (THREE.ClampToEdgeWrapping) {
                texture.wrapS = THREE.ClampToEdgeWrapping
                texture.wrapT = THREE.ClampToEdgeWrapping
              }

              // Store the texture
              loadedTextures.value[key] = texture
              resolve()
            } catch (settingsError) {
              console.error(`Error applying texture settings for ${key}:`, settingsError)
              // Still store the texture even if settings failed
              loadedTextures.value[key] = texture
              resolve()
            }
          },
          undefined,
          (error) => {
            console.error(`Failed to load texture for ${key}:`, error)
            resolve() // Resolve anyway to not block other textures
          }
        )
      } catch (loadError) {
        console.error(`Error in texture loading process for ${key}:`, loadError)
        resolve() // Resolve anyway to not block other textures
      }
    })
  })

  await Promise.all(promises)
  loaded.value = true
}

// Reload all textures when uploaded images change
async function reloadAllTextures() {
  // Safety check - similar to loadTextures
  if (!textureLoader.value) {
    console.error('TextureLoader not initialized during reload')
    
    // Try to create a new one if THREE is available
    if (THREE && THREE.TextureLoader) {
      console.log('Creating new TextureLoader instance for reload')
      textureLoader.value = new THREE.TextureLoader()
    } else {
      throw new Error('Cannot create TextureLoader for reload - THREE not available')
    }
  }
  
  // Force dispose existing textures to prevent memory leaks
  Object.values(loadedTextures.value).forEach((texture) => {
    try {
      if (texture && typeof texture.dispose === 'function')
        texture.dispose()
    } catch (disposeError) {
      console.error('Error disposing texture:', disposeError)
    }
  })

  // Clear loaded textures
  loadedTextures.value = {}

  // Reload all textures from current design state
  const promises = textureUrls.map(({ key, url }) => {
    return new Promise<void>((resolve) => {
      try {
        // Get the texture source - either from design or default
        const designKey = key as keyof typeof design.value
        const textureSource = design.value[designKey] || url
        
        if (!textureLoader.value) {
          throw new Error('TextureLoader not available during reload')
        }

        textureLoader.value.load(
          textureSource,
          (texture) => {
            try {
              // Apply texture settings for better color reproduction
              if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding
              texture.anisotropy = 16
              texture.generateMipmaps = true
              if (THREE.LinearMipmapLinearFilter) texture.minFilter = THREE.LinearMipmapLinearFilter
              if (THREE.LinearFilter) texture.magFilter = THREE.LinearFilter
              if (THREE.ClampToEdgeWrapping) {
                texture.wrapS = THREE.ClampToEdgeWrapping
                texture.wrapT = THREE.ClampToEdgeWrapping
              }

              // Store the texture
              loadedTextures.value[key] = texture
              resolve()
            } catch (settingsError) {
              console.error(`Error applying texture settings for ${key} during reload:`, settingsError)
              // Still store the texture even if settings failed
              loadedTextures.value[key] = texture
              resolve()
            }
          },
          undefined,
          (error) => {
            console.error(`Failed to reload texture for ${key}:`, error)
            resolve() // Resolve anyway to not block other textures
          }
        )
      } catch (loadError) {
        console.error(`Error in texture reloading process for ${key}:`, loadError)
        resolve() // Resolve anyway to not block other textures
      }
    })
  })

  return Promise.all(promises)
}

// Initialize Three.js scene with robust error handling
function initThree() {
  try {
    // Basic DOM element checks
    if (!canvasRef.value) {
      throw new Error('Canvas reference not available')
    }
    
    if (!rendererContainer.value) {
      throw new Error('Renderer container not available')
    }
    
    // Check THREE availability one more time
    if (!THREE || !THREE.WebGLRenderer) {
      throw new Error('THREE.WebGLRenderer not available')
    }

    // Setup renderer with try-catch for WebGL errors
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.value,
        antialias: true,
        alpha: true,
        precision: 'highp',
        powerPreference: 'high-performance',
        stencil: false,
      })
    } catch (webglError) {
      console.error('WebGL renderer creation failed:', webglError)
      throw new Error('Failed to initialize WebGL renderer. Your browser may not support WebGL.')
    }
    
    // Set renderer size and pixel ratio
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    renderer.setSize(rendererContainer.value.clientWidth, rendererContainer.value.clientHeight)

  // Enable correct color output
  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.gammaFactor = 2.2 // Standard gamma correction
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  // Enable shadow mapping for better edges
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // Create scene
  scene = new THREE.Scene()

  // Set background color
  updateSceneBackground()

  // Create lights
  lights = {
    ambient: new THREE.AmbientLight(0xFFFFFF, 0.6),
    main: new THREE.DirectionalLight(0xFFFFFF, 0.8),
    fill: new THREE.DirectionalLight(0xFFFFFF, 0.4),
    rim: new THREE.DirectionalLight(0xFFFFFF, 0.5),
  }

  // Configure shadows for directional lights
  Object.values(lights).forEach((light) => {
    scene.add(light)

    if (light instanceof THREE.DirectionalLight) {
      light.castShadow = true
      light.shadow.mapSize.width = 1024
      light.shadow.mapSize.height = 1024
      light.shadow.camera.near = 0.5
      light.shadow.camera.far = 2000
      light.shadow.bias = -0.001 // Reduce shadow acne

      // Adjust shadow camera size to fit the book
      const maxDimension = Math.max(width.value, height.value, depth.value) * 2
      light.shadow.camera.left = -maxDimension
      light.shadow.camera.right = maxDimension
      light.shadow.camera.top = maxDimension
      light.shadow.camera.bottom = -maxDimension
    }
  })

  // Apply initial lighting preset
  updateLighting(lighting.value.preset)

  // Create camera
  const aspect = rendererContainer.value.clientWidth / rendererContainer.value.clientHeight
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000)

  // Calculate camera position based on book dimensions for better framing
  const maxDimension = Math.max(width.value, height.value, depth.value)
  camera.position.z = maxDimension * 2.5

  // Add orbit controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.1
  controls.autoRotate = false
  controls.enableZoom = true
  controls.minDistance = maxDimension * 1.2
  controls.maxDistance = maxDimension * 5

  // Create book
  createBook()

  // Start animation loop
  animate()

  // Handle window resize
  window.addEventListener('resize', onWindowResize)
  
  } catch (initError) {
    console.error('Error in initThree:', initError)
    error.value = initError instanceof Error ? initError.message : 'Failed to initialize 3D scene'
    throw initError // Re-throw to be caught by the onMounted handler
  }
}

// Update the scene background color from design
function updateSceneBackground() {
  if (scene) {
    scene.background = new THREE.Color(design.value.background)
  }
}

// Create book geometry
function createBook() {
  // Remove existing book if any
  if (book) {
    scene.remove(book)
  }

  book = new THREE.Group()

  // Book dimensions
  const w = width.value
  const h = height.value
  const d = depth.value

  // Create more advanced materials with better edge handling and color accuracy
  // Physical material parameters (for cover, back, spine)
  const physicalMaterialParams = {
    cover: {
      map: loadedTextures.value.cover,
      roughness: 0.5, // Less roughness for better texture clarity
      metalness: 0.0, // No metalness to preserve colors
      clearcoat: 0.2, // Slight clearcoat for gloss
      clearcoatRoughness: 0.8, // More diffuse clearcoat
      reflectivity: 0.1, // Minimal reflectivity to keep colors true
    },
    back: {
      map: loadedTextures.value.back,
      roughness: 0.5,
      metalness: 0.0,
      clearcoat: 0.2,
      clearcoatRoughness: 0.8,
      reflectivity: 0.1,
    },
    spine: {
      map: loadedTextures.value.spine,
      roughness: 0.5,
      metalness: 0.0,
      clearcoat: 0.3, // Slightly more clearcoat for spine
      clearcoatRoughness: 0.7,
      reflectivity: 0.1,
    },
  }

  // Standard material parameters (for sides, top, bottom)
  const standardMaterialParams = {
    sides: {
      map: loadedTextures.value.side,
      roughness: 0.9, // Rougher for pages
      metalness: 0.0,
    },
    top: {
      map: loadedTextures.value.top,
      roughness: 0.9,
      metalness: 0.0,
    },
  }

  // Common settings for physical materials
  Object.values(physicalMaterialParams).forEach((params) => {
    // Add common settings to physical materials
    Object.assign(params, {
      flatShading: false,
      shadowSide: THREE.FrontSide,
      envMapIntensity: 0, // Disable environment map to preserve texture colors
      dithering: true, // Enable dithering for smoother gradients
      colorWrite: true,
      transparent: false,
      fog: false,
      color: new THREE.Color(0xFFFFFF), // Pure white base color to show texture as-is
      emissive: new THREE.Color(0x000000), // No emission
      emissiveIntensity: 0,
    })
  })

  // Common settings for standard materials
  Object.values(standardMaterialParams).forEach((params) => {
    // Add common settings to standard materials
    Object.assign(params, {
      flatShading: false,
      shadowSide: THREE.FrontSide,
      envMapIntensity: 0,
      dithering: true,
      colorWrite: true,
      transparent: false,
      fog: false,
      color: new THREE.Color(0xFFFFFF),
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
    })
  })

  // Create materials from parameters
  const materials = {
    cover: new THREE.MeshPhysicalMaterial(physicalMaterialParams.cover),
    back: new THREE.MeshPhysicalMaterial(physicalMaterialParams.back),
    spine: new THREE.MeshPhysicalMaterial(physicalMaterialParams.spine),
    right: new THREE.MeshStandardMaterial(standardMaterialParams.sides),
    top: new THREE.MeshStandardMaterial(standardMaterialParams.top),
    bottom: new THREE.MeshStandardMaterial(standardMaterialParams.top),
  }

  // Create a single box geometry for the main book structure
  const mainGeometry = new THREE.BoxGeometry(w, h, d)

  // Create materials array for each face of the box
  // Order: right (+x), left (-x), top (+y), bottom (-y), front (+z), back (-z)
  const mainMaterials = [
    materials.right, // right side (+x)
    materials.spine, // spine/left side (-x)
    materials.top, // top (+y)
    materials.bottom, // bottom (-y)
    materials.cover, // front/cover (+z)
    materials.back, // back (-z)
  ]

  // Create main book mesh with all faces
  const mainBook = new THREE.Mesh(mainGeometry, mainMaterials)

  // Enable shadows
  mainBook.castShadow = true
  mainBook.receiveShadow = true

  // Add to book group
  book.add(mainBook)

  // Center the book
  book.position.set(0, 0, 0)

  // Add to scene
  scene.add(book)
}

// Handle window resize
function onWindowResize() {
  if (!rendererContainer.value)
    return

  const width = rendererContainer.value.clientWidth
  const height = rendererContainer.value.clientHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  renderer.setSize(width, height)
}

// Animation loop with smoother motion
let lastTime = 0
function animate(time = 0) {
  animationFrameId = requestAnimationFrame(animate)

  // Calculate delta time for smoother animation regardless of frame rate
  const delta = time - lastTime
  lastTime = time

  // Apply animation if enabled (with time-based animation for consistent speed)
  if (animation.value.enabled && book) {
    // Convert to radians per second, normalize by expected 60fps
    const baseSpeed = (0.001 * animation.value.speed) * (delta / 16.6667)

    // Apply easing based on timing property
    let speed = baseSpeed
    const timing = animation.value.timing

    // Apply fluid easing based on timing property
    if (timing !== 'linear') {
      // Use a continuous sine wave modulation for smooth, non-stepped easing
      // This creates a continuous, fluid motion rather than discrete cycles
      const t = time * 0.001 // time in seconds

      // Common easing factor calculations
      const phase = (Math.sin(t) + 1) / 2 // Continuous 0-1-0 oscillation

      if (timing === 'ease') {
        // Smooth acceleration and deceleration with slight bias toward faster speeds
        speed = baseSpeed * (0.7 + 0.5 * phase)
      }
      else if (timing === 'ease-in') {
        // Gradually accelerates, never fully slows down
        speed = baseSpeed * (0.4 + 0.8 * phase * phase)
      }
      else if (timing === 'ease-out') {
        // Starts faster, gradually decelerates
        const easeOutFactor = 1 - (1 - phase) ** 2
        speed = baseSpeed * (0.4 + 0.8 * easeOutFactor)
      }
      else if (timing === 'ease-in-out') {
        // Smooth acceleration and deceleration, symmetrical
        speed = baseSpeed * (0.3 + 0.9 * (phase < 0.5
          ? 2 * phase ** 2
          : 1 - ((-2 * phase + 2) ** 2) / 2))
      }
    }
    // linear is the default (no modification to speed)

    switch (animation.value.axis) {
      case 'X':
        book.rotation.x += speed
        break
      case 'Y':
        book.rotation.y += speed
        break
      case 'Z':
        book.rotation.z += speed
        break
      default:
        book.rotation.y += speed
    }
  }

  // Update controls with damping for smoother motion
  controls.update()

  // Render the scene
  renderer.render(scene, camera)
}

// Update book when dimensions change
watch([width, height, depth], () => {
  if (scene && book) {
    createBook()
  }
})

// Watch for design property changes for textures
watch(() => [design.value.cover, design.value.back, design.value.spine], async () => {
  if (scene) {
    // Force reload of textures when design changes
    await reloadAllTextures()
    createBook() // Recreate book with new textures
  }
}, { deep: true })

// Watch specifically for background color changes
watch(() => design.value.background, () => {
  updateSceneBackground()
})

// Update lighting when preset changes
watch(() => lighting.value.preset, (newPreset) => {
  if (lights) {
    updateLighting(newPreset)
  }
})

// Function to update lighting based on preset
function updateLighting(preset: string) {
  if (!lights)
    return

  switch (preset) {
    case 'studio':
      // Studio Color-Accurate Lighting
      // Optimized for showing book textures with precise color fidelity

      // Strong flat ambient light for texture visibility
      lights.ambient.intensity = 0.7
      lights.ambient.color.set(0xFFFFFF) // Pure white for color accuracy

      // Main front light - neutral positioning and color for accurate texture
      lights.main.intensity = 0.6
      lights.main.color.set(0xFFFFFF) // Pure white
      lights.main.position.set(0, 0, 2) // Directly in front for even illumination

      // Minimal fill light - just enough to reduce harsh shadows
      lights.fill.intensity = 0.3
      lights.fill.color.set(0xFFFFFF) // Pure white
      lights.fill.position.set(-1, 0.3, 0.5)

      // Very subtle rim light for definition without affecting colors
      lights.rim.intensity = 0.15
      lights.rim.color.set(0xFFFFFF) // Pure white
      lights.rim.position.set(0, 0.5, -1)

      // Adjust renderer settings for maximum color accuracy
      renderer.toneMappingExposure = 1.0
      renderer.outputEncoding = THREE.sRGBEncoding
      break

    case 'soft':
      // Soft Neutral Lighting
      // Even, gentle illumination that shows details without shadows

      // Strong ambient light for reducing shadows
      lights.ambient.intensity = 0.9
      lights.ambient.color.set(0xFFFFFF)

      // Soft main light for minimal directional shadows
      lights.main.intensity = 0.4
      lights.main.color.set(0xFFFFFF)
      lights.main.position.set(0.5, 0.5, 1.5)

      // Even fill light from multiple angles
      lights.fill.intensity = 0.35
      lights.fill.color.set(0xFFFFFF)
      lights.fill.position.set(-0.7, 0.2, 0.7)

      // Subtle rim for separation
      lights.rim.intensity = 0.1
      lights.rim.color.set(0xFFFFFF)
      lights.rim.position.set(0, 0.3, -1)

      // Adjust renderer for slightly softer appearance
      renderer.toneMappingExposure = 1.05
      renderer.outputEncoding = THREE.sRGBEncoding
      break

    case 'display':
      // Premium Display Lighting
      // Highlights textures with neutral but attractive lighting

      // Medium ambient light
      lights.ambient.intensity = 0.4
      lights.ambient.color.set(0xFFFFFF)

      // Strong, slightly angled main light
      lights.main.intensity = 0.9
      lights.main.color.set(0xFFFFF8) // Very slightly warm
      lights.main.position.set(1, 0.7, 1.5)

      // Medium fill light for shadow definition without darkness
      lights.fill.intensity = 0.4
      lights.fill.color.set(0xFFFFFF)
      lights.fill.position.set(-1, 0.3, 0.7)

      // Medium back light for edge definition
      lights.rim.intensity = 0.3
      lights.rim.color.set(0xFFFFFA)
      lights.rim.position.set(0, 0.6, -1.2)

      // Adjust renderer for slightly more vibrant appearance
      renderer.toneMappingExposure = 1.1
      renderer.outputEncoding = THREE.sRGBEncoding
      break
    default:
      // Default to studio lighting for best texture rendering
      updateLighting('studio')
  }
}

// Error handling state
const error = ref<string | null>(null)
const isLoading = ref(true)

// Lifecycle hooks
onMounted(async () => {
  // Ensure we're in the browser environment
  if (process.client) {
    try {
      // Only proceed if THREE is properly loaded
      if (!isThreeReady) {
        throw new Error('THREE.js modules not ready')
      }
      
      // Additional validation
      if (!THREE || !OrbitControls) {
        throw new Error('THREE.js modules not properly loaded')
      }
      
      isLoading.value = true
      
      // Delay initialization slightly to ensure DOM is fully ready
      setTimeout(async () => {
        try {
          await loadTextures()
          initThree()
          isLoading.value = false
        } catch (initError) {
          console.error('Error during delayed initialization:', initError)
          error.value = initError instanceof Error ? initError.message : 'Error initializing 3D view'
          isLoading.value = false
        }
      }, 100)
    } catch (e) {
      console.error('Error initializing Three.js:', e)
      error.value = e instanceof Error ? e.message : 'Unknown error initializing 3D view'
      isLoading.value = false
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize)
  cancelAnimationFrame(animationFrameId)

  // Dispose resources
  if (renderer) {
    renderer.dispose()
  }

  // Dispose geometries and materials
  if (book) {
    book.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose())
        }
        else {
          object.material.dispose()
        }
      }
    })
  }

  // Dispose textures
  Object.values(loadedTextures.value).forEach(texture => texture.dispose())
})
</script>

<template>
  <div
    id="book"
    ref="rendererContainer"
    :style="{ backgroundColor: design.background }"
  >
    <!-- Error message overlay -->
    <div v-if="error" class="error-container">
      <div class="error-message">
        <p>Error loading 3D view: {{ error }}</p>
        <button @click="error = null">Dismiss</button>
      </div>
    </div>
    
    <!-- Loading indicator -->
    <div v-if="isLoading && !error" class="loading-container">
      <div class="loading-spinner">Loading...</div>
    </div>
    
    <!-- Three.js canvas -->
    <div class="three-container" :data-loaded="loaded && !error">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>

<style lang="css">
#book {
  width: 100%;
  height: 100vh;
  position: relative;
}

.three-container {
  width: 100%;
  height: 100%;
  transition: opacity 0.4s ease-in-out;
  opacity: 0;
}

.three-container[data-loaded=true] {
  opacity: 1;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* Error display styles */
.error-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 10;
}

.error-message {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  max-width: 80%;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.error-message p {
  margin-bottom: 15px;
  color: #d32f2f;
  font-weight: bold;
}

.error-message button {
  padding: 8px 16px;
  background-color: #e0e0e0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Loading styles */
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
  z-index: 5;
}

.loading-spinner {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}
</style>
