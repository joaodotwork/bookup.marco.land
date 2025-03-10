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

// Load all textures
async function loadTextures() {
  const promises = textureUrls.map(({ key, url }) => {
    return new Promise<void>((resolve) => {
      textureLoader.load(
        design.value[key as keyof typeof design.value] || url,
        (texture) => {
          loadedTextures.value[key] = texture
          resolve()
        },
        undefined,
        () => {
          console.warn(`Failed to load texture: ${url}`)
          resolve()
        },
      )
    })
  })

  await Promise.all(promises)
  loaded.value = true
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
  })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(rendererContainer.value.clientWidth, rendererContainer.value.clientHeight)

  // Create scene
  scene = new THREE.Scene()

  // Set background color
  scene.background = new THREE.Color(design.value.background)

  // Create lights
  lights = {
    ambient: new THREE.AmbientLight(0xFFFFFF, 0.6),
    main: new THREE.DirectionalLight(0xFFFFFF, 0.8),
    fill: new THREE.DirectionalLight(0xFFFFFF, 0.4),
    rim: new THREE.DirectionalLight(0xFFFFFF, 0.5),
  }

  // Add all lights to scene
  Object.values(lights).forEach(light => scene.add(light))

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

  // Create materials with textures
  const materials = {
    cover: new THREE.MeshPhysicalMaterial({
      map: loadedTextures.value.cover,
      roughness: 0.7,
      metalness: 0.1,
      clearcoat: 0.3, // Slight glossy finish for book cover
      clearcoatRoughness: 0.2,
    }),
    back: new THREE.MeshPhysicalMaterial({
      map: loadedTextures.value.back,
      roughness: 0.7,
      metalness: 0.1,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
    }),
    spine: new THREE.MeshPhysicalMaterial({
      map: loadedTextures.value.spine,
      roughness: 0.65,
      metalness: 0.1,
      clearcoat: 0.4, // More glossy on spine
      clearcoatRoughness: 0.1,
    }),
    side: new THREE.MeshStandardMaterial({
      map: loadedTextures.value.side,
      roughness: 0.9, // Pages are rougher
      metalness: 0.0,
    }),
    top: new THREE.MeshStandardMaterial({
      map: loadedTextures.value.top,
      roughness: 0.9,
      metalness: 0.0,
    }),
  }

  // Front cover (front face)
  const coverGeometry = new THREE.BoxGeometry(w, h, 1)
  const coverMesh = new THREE.Mesh(coverGeometry, materials.cover)
  coverMesh.position.set(0, 0, d / 2)
  book.add(coverMesh)

  // Back cover (back face)
  const backGeometry = new THREE.BoxGeometry(w, h, 1)
  const backMesh = new THREE.Mesh(backGeometry, materials.back)
  backMesh.position.set(0, 0, -d / 2)
  book.add(backMesh)

  // Spine (left face)
  const spineGeometry = new THREE.BoxGeometry(d, h, 1)
  const spineMesh = new THREE.Mesh(spineGeometry, materials.spine)
  spineMesh.position.set(-w / 2, 0, 0)
  spineMesh.rotation.y = Math.PI / 2
  book.add(spineMesh)

  // Right side
  const rightGeometry = new THREE.BoxGeometry(d, h, 1)
  const rightMesh = new THREE.Mesh(rightGeometry, materials.side)
  rightMesh.position.set(w / 2, 0, 0)
  rightMesh.rotation.y = Math.PI / 2
  book.add(rightMesh)

  // Top
  const topGeometry = new THREE.BoxGeometry(w, d, 1)
  const topMesh = new THREE.Mesh(topGeometry, materials.top)
  topMesh.position.set(0, h / 2, 0)
  topMesh.rotation.x = Math.PI / 2
  book.add(topMesh)

  // Bottom
  const bottomGeometry = new THREE.BoxGeometry(w, d, 1)
  const bottomMesh = new THREE.Mesh(bottomGeometry, materials.top)
  bottomMesh.position.set(0, -h / 2, 0)
  bottomMesh.rotation.x = Math.PI / 2
  book.add(bottomMesh)

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

// Animation loop
function animate() {
  animationFrameId = requestAnimationFrame(animate)

  // Apply animation if enabled
  if (animation.value.enabled && book) {
    const speed = 0.001 * animation.value.speed

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

  controls.update()
  renderer.render(scene, camera)
}

// Update book when dimensions change
watch([width, height, depth], () => {
  if (scene && book) {
    createBook()
  }
})

// Watch for design property changes (cover, back, spine, background)
watch(() => design.value, async (newDesign, oldDesign) => {
  if (scene) {
    // Update background color if it changed
    if (newDesign.background !== oldDesign.background) {
      scene.background = new THREE.Color(newDesign.background)
    }

    // Check if any textures have changed
    const textureChanged = textureUrls.some(({ key }) =>
      newDesign[key as keyof typeof newDesign] !== oldDesign[key as keyof typeof oldDesign],
    )

    // If textures changed, reload them and update the book
    if (textureChanged) {
      await reloadChangedTextures(newDesign, oldDesign)
      if (book) {
        createBook() // Recreate book with new textures
      }
    }
  }
}, { deep: true })

// Update lighting when preset changes
watch(() => lighting.value.preset, (newPreset) => {
  if (lights) {
    updateLighting(newPreset)
  }
})

// Function to reload only textures that have changed
async function reloadChangedTextures(newDesign: any, oldDesign: any) {
  const promises = textureUrls.map(({ key, url }) => {
    const designKey = key as keyof typeof newDesign
    // Only reload if texture has changed
    if (newDesign[designKey] !== oldDesign[designKey]) {
      return new Promise<void>((resolve) => {
        // If existing texture exists, dispose it to prevent memory leaks
        if (loadedTextures.value[key]) {
          loadedTextures.value[key].dispose()
        }

        textureLoader.load(
          newDesign[designKey] || url,
          (texture) => {
            loadedTextures.value[key] = texture
            resolve()
          },
          undefined,
          () => {
            console.warn(`Failed to load texture: ${newDesign[designKey] || url}`)
            resolve()
          },
        )
      })
    }
    return Promise.resolve()
  })

  await Promise.all(promises)
}

// Function to update lighting based on preset
function updateLighting(preset: string) {
  if (!lights)
    return

  switch (preset) {
    case 'studio':
      // Studio lighting: balanced, professional look
      lights.ambient.intensity = 0.6
      lights.ambient.color.set(0xFFFFFF)

      lights.main.intensity = 0.8
      lights.main.color.set(0xFFFFFF)
      lights.main.position.set(1, 0.5, 2)

      lights.fill.intensity = 0.4
      lights.fill.color.set(0xFFFFFF)
      lights.fill.position.set(-2, 0.2, 1)

      lights.rim.intensity = 0.5
      lights.rim.color.set(0xFFFFFF)
      lights.rim.position.set(0, 1, -2)
      break

    case 'soft':
      // Soft lighting: gentle, diffused lighting
      lights.ambient.intensity = 0.8
      lights.ambient.color.set(0xFFFFFF)

      lights.main.intensity = 0.5
      lights.main.color.set(0xFFFFFF)
      lights.main.position.set(0.5, 0.8, 1.5)

      lights.fill.intensity = 0.5
      lights.fill.color.set(0xFFFFFF)
      lights.fill.position.set(-1, 0.5, 0.5)

      lights.rim.intensity = 0.2
      lights.rim.color.set(0xFFFFFF)
      lights.rim.position.set(0, 0.5, -1)
      break

    case 'dramatic':
      // Dramatic lighting: high contrast
      lights.ambient.intensity = 0.3
      lights.ambient.color.set(0x333333)

      lights.main.intensity = 1.2
      lights.main.color.set(0xFFFFFF)
      lights.main.position.set(2, 1, 1)

      lights.fill.intensity = 0.1
      lights.fill.color.set(0x0077FF)
      lights.fill.position.set(-2, 0, 1)

      lights.rim.intensity = 0.8
      lights.rim.color.set(0xFF3300)
      lights.rim.position.set(0, 1, -3)
      break

    case 'warm':
      // Warm lighting: golden hour effect
      lights.ambient.intensity = 0.5
      lights.ambient.color.set(0xFFEECC)

      lights.main.intensity = 0.9
      lights.main.color.set(0xFFCC88)
      lights.main.position.set(1, 0.2, 2)

      lights.fill.intensity = 0.3
      lights.fill.color.set(0xFFEEDD)
      lights.fill.position.set(-1.5, 0.2, 0.5)

      lights.rim.intensity = 0.4
      lights.rim.color.set(0xFF9900)
      lights.rim.position.set(-0.5, 1, -2)
      break

    case 'cool':
      // Cool lighting: cold, blue tinted light
      lights.ambient.intensity = 0.5
      lights.ambient.color.set(0xCCDDFF)

      lights.main.intensity = 0.8
      lights.main.color.set(0xAABBFF)
      lights.main.position.set(1, 0.5, 2)

      lights.fill.intensity = 0.4
      lights.fill.color.set(0x8899FF)
      lights.fill.position.set(-2, 0.2, 1)

      lights.rim.intensity = 0.6
      lights.rim.color.set(0x0044FF)
      lights.rim.position.set(0, 1, -2)
      break

    default:
      // Default to studio lighting
      updateLighting('studio')
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
  <div id="book" ref="rendererContainer" :style="{ backgroundColor: design.background }">
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
