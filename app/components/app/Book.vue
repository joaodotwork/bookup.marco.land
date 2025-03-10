<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

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
const textureLoader = new THREE.TextureLoader()
const loadedTextures = ref<Record<string, THREE.Texture>>({})

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
  const promises = textureUrls.map(({ key, url }) => {
    return new Promise<void>((resolve) => {
      // Get the texture source - either from design or default
      const designKey = key as keyof typeof design.value
      const textureSource = design.value[designKey] || url

      textureLoader.load(
        textureSource,
        (texture) => {
          // Apply texture settings for better color reproduction
          texture.encoding = THREE.sRGBEncoding // Use sRGB encoding for correct colors
          texture.anisotropy = 16 // Improve texture sharpness
          texture.generateMipmaps = true
          texture.minFilter = THREE.LinearMipmapLinearFilter
          texture.magFilter = THREE.LinearFilter
          texture.wrapS = THREE.ClampToEdgeWrapping
          texture.wrapT = THREE.ClampToEdgeWrapping

          // Store the texture
          loadedTextures.value[key] = texture
          resolve()
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture for ${key}:`, error)
          resolve()
        },
      )
    })
  })

  await Promise.all(promises)
  loaded.value = true
}

// Reload all textures when uploaded images change
async function reloadAllTextures() {
  // Force dispose existing textures to prevent memory leaks
  Object.values(loadedTextures.value).forEach((texture) => {
    if (texture)
      texture.dispose()
  })

  // Clear loaded textures
  loadedTextures.value = {}

  // Reload all textures from current design state
  const promises = textureUrls.map(({ key, url }) => {
    return new Promise<void>((resolve) => {
      // Get the texture source - either from design or default
      const designKey = key as keyof typeof design.value
      const textureSource = design.value[designKey] || url

      textureLoader.load(
        textureSource,
        (texture) => {
          // Apply texture settings for better color reproduction
          texture.encoding = THREE.sRGBEncoding
          texture.anisotropy = 16
          texture.generateMipmaps = true
          texture.minFilter = THREE.LinearMipmapLinearFilter
          texture.magFilter = THREE.LinearFilter
          texture.wrapS = THREE.ClampToEdgeWrapping
          texture.wrapT = THREE.ClampToEdgeWrapping

          // Store the texture
          loadedTextures.value[key] = texture
          resolve()
        },
        undefined,
        (error) => {
          console.error(`Failed to reload texture for ${key}:`, error)
          resolve()
        },
      )
    })
  })

  return Promise.all(promises)
}

// Initialize Three.js scene
function initThree() {
  if (!canvasRef.value || !rendererContainer.value)
    return

  // Setup renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true,
    precision: 'highp',
    powerPreference: 'high-performance',
    stencil: false,
  })
  renderer.setPixelRatio(window.devicePixelRatio)
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
  const materialParams = {
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
    sides: {
      map: loadedTextures.value.side,
      roughness: 0.9, // Rougher for pages
      metalness: 0.0,
      reflectivity: 0.05, // Minimal reflectivity for paper
    },
    top: {
      map: loadedTextures.value.top,
      roughness: 0.9,
      metalness: 0.0,
      reflectivity: 0.05,
    },
  }

  // Common material settings
  Object.values(materialParams).forEach((params) => {
    // Add common settings to all materials
    Object.assign(params, {
      flatShading: false,
      shadowSide: THREE.FrontSide,
      envMapIntensity: 0, // Disable environment map to preserve texture colors
      dithering: true, // Enable dithering for smoother gradients

      // Improve color accuracy
      colorWrite: true,
      transparent: false,
      fog: false,

      // Crucial for accurate texture colors
      color: new THREE.Color(0xFFFFFF), // Pure white base color to show texture as-is
      emissive: new THREE.Color(0x000000), // No emission
      emissiveIntensity: 0,
    })
  })

  // Create materials from parameters
  const materials = {
    cover: new THREE.MeshPhysicalMaterial(materialParams.cover),
    back: new THREE.MeshPhysicalMaterial(materialParams.back),
    spine: new THREE.MeshPhysicalMaterial(materialParams.spine),
    right: new THREE.MeshStandardMaterial(materialParams.sides),
    top: new THREE.MeshStandardMaterial(materialParams.top),
    bottom: new THREE.MeshStandardMaterial(materialParams.top),
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
    case 'key':
      // Key Light Dominant: Classic 3-point lighting with strong key light
      // Emphasizes form and texture with stronger shadows

      // Low ambient light - allows the 3-point setup to define the lighting
      lights.ambient.intensity = 0.2
      lights.ambient.color.set(0xFFFFFF)

      // Strong key light - positioned at classic 45° angle in front and to the side
      lights.main.intensity = 1.0
      lights.main.color.set(0xFFFFFF)
      lights.main.position.set(1.2, 0.8, 1.2)

      // Subtle fill light - just enough to control shadow density
      lights.fill.intensity = 0.3
      lights.fill.color.set(0xFFFFFF)
      lights.fill.position.set(-0.8, 0.2, 0.5)

      // Subtle back light - creates separation from background
      lights.rim.intensity = 0.4
      lights.rim.color.set(0xFFFFF0) // Slightly warm rim light
      lights.rim.position.set(0, 0.7, -1)
      break

    case 'fill':
      // Fill Light Dominant: Soft, even lighting with minimal shadows
      // Perfect for showing details and color accuracy

      // Medium ambient light - creates general illumination
      lights.ambient.intensity = 0.4
      lights.ambient.color.set(0xFFFFFF)

      // Moderate key light - less dramatic than standard key light
      lights.main.intensity = 0.6
      lights.main.color.set(0xFFFFF8) // Slightly warm key light
      lights.main.position.set(0.8, 0.7, 1)

      // Strong fill light - approaching key light intensity for low contrast
      lights.fill.intensity = 0.5
      lights.fill.color.set(0xFAFAFF) // Slightly cool fill light
      lights.fill.position.set(-1, 0.5, 0.8)

      // Subtle back light - just enough for separation
      lights.rim.intensity = 0.25
      lights.rim.color.set(0xFFFFFA)
      lights.rim.position.set(0, 0.6, -0.8)
      break

    case 'back':
      // Back Light Dominant: Dramatic rim lighting with defined edges
      // Creates shape definition and separation with dramatic silhouette

      // Minimal ambient light - allows for dramatic lighting
      lights.ambient.intensity = 0.15
      lights.ambient.color.set(0x404040)

      // Subdued key light - present but not dominant
      lights.main.intensity = 0.5
      lights.main.color.set(0xFFFFFF)
      lights.main.position.set(1, 0.6, 1)

      // Minimal fill light - maintains shadow detail without filling too much
      lights.fill.intensity = 0.2
      lights.fill.color.set(0xE6E6FA) // Slightly purple fill for interesting shadows
      lights.fill.position.set(-1.2, 0.3, 0.5)

      // Strong back light - the dominant light in the setup
      lights.rim.intensity = 0.9
      lights.rim.color.set(0xFFF8E0) // Warm back light for attractive glow
      lights.rim.position.set(0, 0.8, -1.5)
      break

    default:
      // Default to key light setup
      updateLighting('key')
  }
}

// Lifecycle hooks
onMounted(async () => {
  await loadTextures()
  initThree()
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
    <div class="three-container" :data-loaded="loaded">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>

<style lang="css">
#book {
  width: 100%;
  height: 100vh;
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
</style>
