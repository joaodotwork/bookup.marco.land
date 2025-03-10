<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const { design, dimensions, animation } = storeToRefs(useBookStore())

const canvasRef = ref<HTMLCanvasElement | null>(null)
const rendererContainer = ref<HTMLDivElement | null>(null)
let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let book: THREE.Group
let animationFrameId: number
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

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8)
  directionalLight.position.set(1, 1, 1)
  scene.add(directionalLight)

  // Create camera
  const aspect = rendererContainer.value.clientWidth / rendererContainer.value.clientHeight
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 2000)
  camera.position.z = 500

  // Add orbit controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.1

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
    cover: new THREE.MeshStandardMaterial({
      map: loadedTextures.value.cover,
      roughness: 0.8,
      metalness: 0.1,
    }),
    back: new THREE.MeshStandardMaterial({
      map: loadedTextures.value.back,
      roughness: 0.8,
      metalness: 0.1,
    }),
    spine: new THREE.MeshStandardMaterial({
      map: loadedTextures.value.spine,
      roughness: 0.8,
      metalness: 0.1,
    }),
    side: new THREE.MeshStandardMaterial({
      map: loadedTextures.value.side,
      roughness: 0.8,
      metalness: 0.1,
    }),
    top: new THREE.MeshStandardMaterial({
      map: loadedTextures.value.top,
      roughness: 0.8,
      metalness: 0.1,
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

// Update background color when it changes
watch(() => design.value.background, (newColor) => {
  if (scene) {
    scene.background = new THREE.Color(newColor)
  }
})

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
