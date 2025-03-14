<script setup lang="ts">
// Import Three.js directly - we'll ensure it only runs on client side
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// Simple debounce utility
function debounce(fn, delay) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn.apply(this, args), delay)
  }
}

// Simple states - defined before use
const error = ref(null)
const isLoading = ref(true)
const canvasRef = ref(null)
const rendererContainer = ref(null)
const initializationTimeout = ref(null)

const bookStore = useBookStore()
const { design, dimensions, rotation, animation, lighting, surface } = storeToRefs(bookStore)
const appStore = useAppStore()
const { showSidebar } = storeToRefs(appStore)

// Initialize the store
onBeforeMount(() => {
  bookStore.init()
})

// Simple logger - only outputs in dev mode for critical events
function logDebug(message) {
  if (process.dev) {
    console.log(`[Book] ${message}`)
  }
}

// Book centering function with option to preserve camera position
function centerBook(forceRender = true, preserveCameraPosition = false) {
  try {
    if (!book || !camera || !scene || !renderer || !rendererContainer.value) {
      return
    }

    // Get container dimensions with fallback to window
    const containerWidth = rendererContainer.value.clientWidth || window.innerWidth
    const containerHeight = rendererContainer.value.clientHeight || window.innerHeight

    // Skip invalid dimensions to prevent rendering issues
    if (containerWidth <= 0 || containerHeight <= 0) {
      return
    }

    // Make sure book is at center of scene
    book.position.set(0, 0, 0)

    // Store current camera position if we need to preserve it
    let oldPosition, oldTarget
    if (preserveCameraPosition && camera) {
      oldPosition = camera.position.clone()
      if (controls) {
        oldTarget = controls.target.clone()
      }
    }

    // Calculate appropriate camera distance only if not preserving position
    const aspect = containerWidth / containerHeight

    // Always update aspect ratio regardless of preservation setting
    camera.aspect = aspect
    camera.updateProjectionMatrix()

    if (!preserveCameraPosition) {
      // Only reset camera position if not preserving it
      const baseDistance = 5.5

      // Determine if the viewport is portrait or landscape
      const isPortrait = aspect < 1
      const isNarrow = containerWidth < 600 // arbitrary threshold

      // Calculate camera distance based on viewport characteristics
      let cameraDistance = baseDistance
      if (isPortrait) {
        // For portrait mode, move camera further back
        cameraDistance = baseDistance * 1.2
      }
      else if (isNarrow) {
        // For narrow viewports, adjust camera position
        cameraDistance = baseDistance * 1.1
      }

      // Position camera with calculated distance
      camera.position.set(0, 0, cameraDistance)
      camera.lookAt(0, 0, 0)

      // Reset controls target and update
      if (controls) {
        controls.target.set(0, 0, 0)
        controls.update()
      }
    }
    else if (oldPosition && camera) {
      // Restore the previous camera position
      camera.position.copy(oldPosition)

      if (controls && oldTarget) {
        controls.target.copy(oldTarget)
        controls.update()
      }
    }

    if (forceRender && renderer && scene && camera) {
      // Render the centered view - always resize the renderer
      renderer.setSize(containerWidth, containerHeight, true)
      renderer.render(scene, camera)
    }
  }
  catch (error) {
    console.error('Error in centerBook:', error)
  }
}

// Function to handle resize and recentering with debounce for performance
const handleResize = debounce((preserveCameraPosition = false) => {
  if (!renderer || !camera || !rendererContainer.value) {
    return
  }

  try {
    // Call centerBook which handles everything we need
    centerBook(true, preserveCameraPosition)

    // Add a second resize/render call after a short delay
    // This helps catch changes that might not be fully applied yet,
    // especially horizontal dimension changes during sidebar transitions
    setTimeout(() => centerBook(true, preserveCameraPosition), 50)
  }
  catch (error) {
    console.error('Error in handleResize:', error)
  }
}, 50) // Shorter debounce time for more responsive resizing

// Center the book in the viewport without complex zoom adaptation
function adjustCameraForBookSize() {
  if (!book || !camera)
    return

  // Set book position to center of scene
  if (book) {
    book.position.set(0, 0, 0)
  }

  // Use a fixed, reasonable camera distance
  const cameraDistance = 5.5

  // Set camera position with fixed distance, ensuring it's centered on origin
  camera.position.set(0, 0, cameraDistance)
  camera.lookAt(0, 0, 0)

  // Ensure controls target remains at the center
  if (controls) {
    controls.target.set(0, 0, 0)
    controls.update()
  }
}

// Core Three.js objects
let renderer = null
let scene = null
let camera = null
let book = null
let controls = null
let animationFrameId = null

// References for cleanup
let resizeObserver = null
let windowResizeHandler = null
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
  hemisphere: null,
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
  'ease': (t) => {
    // Sine wave oscillation (0.5-1.0)
    return 0.75 + Math.sin(t * Math.PI * 2) * 0.25
  },

  // Ease-in starts slower, gradually speeds up
  'ease-in': (t) => {
    // Smoother sine-based variation (0.3-0.7)
    return 0.5 + Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.2
  },

  // Ease-out starts faster, gradually slows down
  'ease-out': (t) => {
    // Inverse of ease-in
    return 0.5 - Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.2
  },

  // Ease-in-out combines both patterns
  'ease-in-out': (t) => {
    // More pronounced sine wave (0.25-0.75)
    return 0.5 + Math.sin(t * Math.PI * 2) * 0.25
  },
}

// Animation function - simplified for performance
function animate() {
  try {
    if (!renderer || !scene || !camera || !book) {
      animationFrameId = requestAnimationFrame(animate)
      return
    }

    // Safety check to ensure loading state is cleared
    if (isLoading.value && Date.now() - lastAnimationTime > 10000) {
      isLoading.value = false
    }

    // Measure time delta for smooth animation
    const currentTime = Date.now()
    const deltaTime = (currentTime - lastAnimationTime) / 1000 // seconds
    lastAnimationTime = currentTime

    // Apply manual rotation values
    book.rotation.x = THREE.MathUtils.degToRad(rotation.value.x)
    book.rotation.y = THREE.MathUtils.degToRad(rotation.value.y)
    book.rotation.z = THREE.MathUtils.degToRad(rotation.value.z)

    // Apply animation if enabled (simplified)
    if (animation.value.enabled) {
      const axis = animation.value.axis || 'Y'
      const speedValue = Math.max(1, animation.value.speed)
      // Base speed of 60 degrees per second for speed=1
      // Lower speed values = faster rotation (e.g., 1 = 60 deg/sec, 10 = 6 deg/sec)
      const speed = 60 / speedValue // degrees per second

      // Simple animation without complex easing
      if (axis === 'Y') {
        animationOffset.y += speed * deltaTime
        book.rotation.y += THREE.MathUtils.degToRad(animationOffset.y)
        animationOffset.y = animationOffset.y % 360
      }
      else if (axis === 'X') {
        animationOffset.x += speed * deltaTime
        book.rotation.x += THREE.MathUtils.degToRad(animationOffset.x)
        animationOffset.x = animationOffset.x % 360
      }
      else if (axis === 'Z') {
        animationOffset.z += speed * deltaTime
        book.rotation.z += THREE.MathUtils.degToRad(animationOffset.z)
        animationOffset.z = animationOffset.z % 360
      }

      // Reset other offsets
      if (axis !== 'X')
        animationOffset.x = 0
      if (axis !== 'Y')
        animationOffset.y = 0
      if (axis !== 'Z')
        animationOffset.z = 0
    }

    // Render the scene
    renderer.render(scene, camera)

    // Request next frame
    animationFrameId = requestAnimationFrame(animate)
  }
  catch (error) {
    console.error('Error in animation loop:', error)
    isLoading.value = false
    error.value = 'Animation error occurred'
  }
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

        // Set the correct color space for the texture
        // Most images are in sRGB color space
        texture.colorSpace = THREE.SRGBColorSpace

        // Ensure texture wrapping and filtering are set correctly
        texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
        texture.minFilter = THREE.LinearMipmapLinearFilter
        texture.magFilter = THREE.LinearFilter

        // Generate mipmaps for better rendering at different distances
        texture.generateMipmaps = true

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

    // Create an array of texture loading promises for parallel loading
    const texturePromises = [
      { name: 'cover', url: '/images/book-cover.jpg' },
      { name: 'back', url: '/images/book-back.jpg' },
      { name: 'spine', url: '/images/book-spine.jpg' },
      { name: 'side', url: '/images/book-side.jpg' },
      { name: 'top', url: '/images/book-top.jpg' },
    ].map(async ({ name, url }) => {
      console.log(`Loading ${name} texture: ${url}`)
      try {
        textures[name] = await loadTexture(url)
        console.log(`Successfully loaded ${name} texture`)
        return { name, success: true }
      }
      catch (err) {
        console.error(`Failed to load ${name} texture:`, err)
        return { name, success: false, error: err }
      }
    })

    // Wait for all textures to load in parallel
    const results = await Promise.all(texturePromises)

    // Check if any textures failed to load
    const failedTextures = results.filter(result => !result.success)
    if (failedTextures.length > 0) {
      const failedNames = failedTextures.map(result => result.name).join(', ')
      console.error(`Failed to load the following textures: ${failedNames}`)
      throw new Error(`Failed to load required textures: ${failedNames}`)
    }

    // Override with user-provided textures if available
    const customTexturePromises = []

    if (design.value.cover) {
      console.log('Loading custom cover texture...')
      customTexturePromises.push(
        loadTexture(design.value.cover)
          .then((texture) => {
            textures.cover = texture
            console.log('Custom cover texture loaded successfully')
          })
          .catch(err => console.error('Failed to load custom cover texture:', err)),
      )
    }

    if (design.value.back) {
      console.log('Loading custom back texture...')
      customTexturePromises.push(
        loadTexture(design.value.back)
          .then((texture) => {
            textures.back = texture
            console.log('Custom back texture loaded successfully')
          })
          .catch(err => console.error('Failed to load custom back texture:', err)),
      )
    }

    if (design.value.spine) {
      console.log('Loading custom spine texture...')
      customTexturePromises.push(
        loadTexture(design.value.spine)
          .then((texture) => {
            textures.spine = texture
            console.log('Custom spine texture loaded successfully')
          })
          .catch(err => console.error('Failed to load custom spine texture:', err)),
      )
    }

    // Wait for custom textures to load (don't fail if custom textures fail)
    if (customTexturePromises.length > 0) {
      await Promise.all(customTexturePromises)
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
  // Material properties vary based on selected surface type
  let materialProps

  // Configure material properties based on selected surface type
  switch (surface.value.type) {
    case 'glossy':
      materialProps = {
        roughness: 0.55, // Higher roughness to further reduce spot reflections
        metalness: 0.02, // Lower metalness for more subtle sheen
        envMapIntensity: 0.5, // Reduced reflection intensity
        flatShading: false, // Smooth surface
        clearcoat: 0.2, // Lower clearcoat for more subtle laminated look
        clearcoatRoughness: 0.5, // Medium roughness for clearcoat layer
      }
      break

    case 'matte':
      materialProps = {
        roughness: 0.7, // Higher roughness for matte, non-reflective finish
        metalness: 0.0, // No metallic look
        envMapIntensity: 0.5, // Minimal reflections
        flatShading: false, // Smooth surface
      }
      break

    case 'uncoated':
      materialProps = {
        roughness: 0.9, // Very high roughness for uncoated texture
        metalness: 0.0, // No metallic look
        envMapIntensity: 0.3, // Minimal reflections
        flatShading: false, // Even surface (we'll use normal map for texture)
      }

      // Add a subtle paper texture for uncoated style
      // We'll use a procedural bump map to simulate paper texture
      const textureSize = 256
      const data = new Uint8Array(textureSize * textureSize * 4)

      // Create subtle random variations for paper texture
      for (let i = 0; i < textureSize * textureSize * 4; i += 4) {
        // Random value between 120-135 for subtle paper texture
        const value = 127 + Math.floor(Math.random() * 16) - 8
        data[i] = data[i + 1] = data[i + 2] = value
        data[i + 3] = 255 // Alpha
      }

      // Create normal map from the grayscale texture
      const paperTexture = new THREE.DataTexture(data, textureSize, textureSize, THREE.RGBAFormat)
      paperTexture.wrapS = paperTexture.wrapT = THREE.RepeatWrapping
      paperTexture.repeat.set(4, 4) // Repeat the texture to make it less obvious
      paperTexture.needsUpdate = true

      // Add the paper texture to material properties
      materialProps.normalMap = paperTexture
      materialProps.normalScale = new THREE.Vector2(0.05, 0.05) // Subtle effect
      break

    default:
      // Default to uncoated if type is unknown
      materialProps = {
        roughness: 0.9,
        metalness: 0.0,
        envMapIntensity: 0.3,
        flatShading: false,
      }
  }

  // Create materials - use MeshPhysicalMaterial for glossy, MeshStandardMaterial for others
  // First remove clearcoat properties if not glossy to avoid warnings
  const materialPropsToUse = { ...materialProps }
  if (surface.value.type !== 'glossy') {
    delete materialPropsToUse.clearcoat
    delete materialPropsToUse.clearcoatRoughness
  }

  // Choose the correct material class based on surface type
  const MaterialClass = surface.value.type === 'glossy'
    ? THREE.MeshPhysicalMaterial
    : THREE.MeshStandardMaterial

  const materials = [
    new MaterialClass({ ...materialPropsToUse, map: textures.side }), // right side
    new MaterialClass({ ...materialPropsToUse, map: textures.spine }), // left side (spine)
    new MaterialClass({ ...materialPropsToUse, map: textures.top }), // top
    new MaterialClass({ ...materialPropsToUse, map: textures.top }), // bottom
    new MaterialClass({ ...materialPropsToUse, map: textures.cover }), // front (cover)
    new MaterialClass({ ...materialPropsToUse, map: textures.back }), // back
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

  // Set a safety timeout to ensure loading state is cleared even if initialization fails
  if (initializationTimeout.value) {
    clearTimeout(initializationTimeout.value)
  }

  // Set a 15-second timeout to clear the loading state if initialization takes too long
  initializationTimeout.value = setTimeout(() => {
    console.error('Initialization timeout reached, forcing loading state to complete')
    isLoading.value = false
    error.value = 'Initialization timed out. Please try refreshing the page.'
  }, 15000)

  // Initialize last animation time to current time
  // This ensures smooth animation from the first frame if animation is enabled
  lastAnimationTime = Date.now()

  try {
    console.log('Starting Three.js initialization...')

    // Get dimensions
    const width = rendererContainer.value.clientWidth || window.innerWidth
    const height = rendererContainer.value.clientHeight || window.innerHeight

    console.log(`Container dimensions: ${width}x${height}`)

    // Create renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: true,
      alpha: true,
      powerPreference: 'default', // Add explicit power preference
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Limit pixel ratio to avoid performance issues

    // Configure shadow properties (will be enabled/disabled per preset)
    renderer.shadowMap.enabled = false
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Set the correct output color space for proper color rendering
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // Enable tone mapping for more realistic rendering
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0

    // Create scene
    scene = new THREE.Scene()
    scene.background = new THREE.Color(bookStore.background || '#0072FF')

    // Add a subtle environment map for more realistic reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()

    // Create a simple environment map using the scene background color
    const envColor = new THREE.Color(bookStore.background || '#0072FF')
    const cubeRenderTarget = pmremGenerator.fromScene(
      new THREE.Scene().add(new THREE.HemisphereLight(envColor.getHex(), 0x000000, 1)),
      0.04,
    )
    scene.environment = cubeRenderTarget.texture

    // Create camera
    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000) // Slightly narrower FOV

    // Initial camera position - will be adjusted after book is created
    camera.position.set(0, 0, 5.5) // Default distance, will be adjusted based on book size
    camera.lookAt(0, 0, 0)

    // Set up initial lighting based on preset
    setupLighting(lighting.value.preset)

    // Load textures
    console.log('Starting texture loading process...')
    try {
      await loadTextures()
      console.log('All textures loaded successfully')
    }
    catch (texError) {
      console.error('Error loading textures:', texError)
      throw new Error(`Failed to load textures: ${texError.message || 'Unknown texture error'}`)
    }

    // Create and add book
    console.log('Creating book geometry...')
    book = createBook()
    scene.add(book)

    // Adjust camera position based on book size
    console.log('Adjusting camera position...')
    adjustCameraForBookSize()

    // Add orbit controls
    console.log('Setting up orbit controls...')
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

    // Set up ResizeObserver for handling container size changes - store in module variable
    // for proper cleanup
    resizeObserver = new ResizeObserver((entries) => {
      // Skip processing if Three.js elements are not initialized
      if (!renderer || !camera || !rendererContainer.value)
        return

      // Get the specific entry for our container
      const containerEntry = entries.find(entry => entry.target === rendererContainer.value)
      if (containerEntry) {
        // Extract the dimensions
        const { width, height } = containerEntry.contentRect

        // Skip invalid dimensions
        if (width <= 0 || height <= 0)
          return

        // Log if in dev mode
        if (process.dev) {
          console.log(`[Book] Container resized: ${width}x${height}`)
        }

        // For automatic resizes from the ResizeObserver,
        // we want to preserve camera position to prevent view reset
        // during window resizes and layout changes
        handleResize(true) // true = preserve camera position
      }
    })

    // Only observe if the container exists
    if (rendererContainer.value) {
      // Observe both the container element and its parent for any size changes
      resizeObserver.observe(rendererContainer.value)

      // Also observe the document body to catch broader layout changes
      resizeObserver.observe(document.body)
    }

    // Create a named function for the window resize handler and store in module variable
    // for proper cleanup
    windowResizeHandler = () => handleResize(true)

    // Window resize listener as a backup - preserve camera position
    window.addEventListener('resize', windowResizeHandler)

    // Initial sizing
    handleResize()

    // Clear the safety timeout as we completed successfully
    if (initializationTimeout.value) {
      clearTimeout(initializationTimeout.value)
      initializationTimeout.value = null
    }

    console.log('Three.js initialization complete!')
    isLoading.value = false
  }
  catch (e) {
    console.error('Error initializing Three.js scene:', e)
    // Provide detailed error message to help diagnose the issue
    const errorMessage = e instanceof Error
      ? `${e.name}: ${e.message}`
      : 'Failed to initialize 3D view with unknown error'
    error.value = errorMessage

    // Always ensure loading state is cleared on error
    isLoading.value = false

    // Clear the safety timeout as we've already handled the error
    if (initializationTimeout.value) {
      clearTimeout(initializationTimeout.value)
      initializationTimeout.value = null
    }
  }
}

// Handle texture updates when design changes
watch(() => [design.value.cover, design.value.back, design.value.spine], async () => {
  if (!book || !scene)
    return

  try {
    // No special handling needed now that we're properly uploading images to Blob
    // The textures will be loaded from the Blob URLs just like normal URLs
    
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
          // Ensure texture has correct settings
          updatedTextures.spine.colorSpace = THREE.SRGBColorSpace
          materials[1].map = updatedTextures.spine
          materials[1].needsUpdate = true
          textures.spine = updatedTextures.spine
        }

        // Update cover (front - index 4)
        if (updatedTextures.cover) {
          // Ensure texture has correct settings
          updatedTextures.cover.colorSpace = THREE.SRGBColorSpace
          materials[4].map = updatedTextures.cover
          materials[4].needsUpdate = true
          textures.cover = updatedTextures.cover
        }

        // Update back (back - index 5)
        if (updatedTextures.back) {
          // Ensure texture has correct settings
          updatedTextures.back.colorSpace = THREE.SRGBColorSpace
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
  if (!scene || !renderer)
    return

  // Update scene background color
  const color = new THREE.Color(newColor || '#0072FF')
  scene.background = color

  // Update environment map to match the new background color
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()

  const envScene = new THREE.Scene()
  envScene.add(new THREE.HemisphereLight(color.getHex(), 0x000000, 1))
  const cubeRenderTarget = pmremGenerator.fromScene(envScene, 0.04)

  // Update scene environment
  scene.environment = cubeRenderTarget.texture

  // Dispose of the old render target to prevent memory leaks
  pmremGenerator.dispose()
})

// Watch for lighting preset changes
watch(() => lighting.value.preset, (newPreset) => {
  setupLighting(newPreset)
})

// Watch for surface type changes
watch(() => surface.value.type, async (newSurfaceType) => {
  if (!book || !scene)
    return

  try {
    console.log(`Surface type changed to: ${newSurfaceType}`)

    // Remove the old book from the scene
    scene.remove(book)

    // Create a new book with updated surface material
    book = createBook()
    scene.add(book)
  }
  catch (e) {
    console.error('Error updating book surface:', e)
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
watch(() => animation.value, (newAnimation, oldAnimation) => {
  // When animation is turned on, set the last time to now to avoid jumps
  // and ensure animation starts from the current position (not from zero)
  if (newAnimation.enabled && !oldAnimation.enabled) {
    lastAnimationTime = Date.now()

    // Reset animation offsets and progress counters
    // This is important to start with a clean state
    animationOffset.x = 0
    animationOffset.y = 0
    animationOffset.z = 0
    animationProgress.x = 0
    animationProgress.y = 0
    animationProgress.z = 0

    // Update rotation values to match the current visual position of the book
    // This ensures animation starts from the current rotation, not from default values
    if (book) {
      // Convert from radians to degrees and update the store
      rotation.value.x = THREE.MathUtils.radToDeg(book.rotation.x)
      rotation.value.y = THREE.MathUtils.radToDeg(book.rotation.y)
      rotation.value.z = THREE.MathUtils.radToDeg(book.rotation.z)
    }
  }

  // When animation is turned off, update rotation to match current visual position
  // This preserves the current position when animation stops
  if (!newAnimation.enabled && oldAnimation.enabled) {
    // Update the rotation store values to match the current visual position
    // This ensures the book stays exactly where it was when animation was disabled
    if (book) {
      // Convert from radians to degrees and update the store
      rotation.value.x = THREE.MathUtils.radToDeg(book.rotation.x)
      rotation.value.y = THREE.MathUtils.radToDeg(book.rotation.y)
      rotation.value.z = THREE.MathUtils.radToDeg(book.rotation.z)
    }

    // Reset accumulated offsets since we've stored the position in rotation values
    // This prevents any further animation calculations from affecting the position
    animationOffset.x = 0
    animationOffset.y = 0
    animationOffset.z = 0

    // Reset progress values to clean state
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
function setupLighting(preset = 'ambient') {
  if (!scene || !renderer)
    return

  // Clear existing lights before adding new ones
  if (lights.ambient)
    scene.remove(lights.ambient)
  if (lights.hemisphere)
    scene.remove(lights.hemisphere)
  if (lights.main)
    scene.remove(lights.main)
  if (lights.fill)
    scene.remove(lights.fill)
  if (lights.rim)
    scene.remove(lights.rim)

  // Reset shadow settings
  renderer.shadowMap.enabled = false

  // Create lighting setups based on preset
  switch (preset) {
    case 'ambient':
      // Ambient lighting - even illumination from all directions
      // Use hemisphere light for natural sky/ground illumination
      lights.hemisphere = new THREE.HemisphereLight(
        0xFFFFFF, // Sky color
        0xFFFAF0, // Ground color (slightly warm)
        2.5, // Increased intensity (2.5) for much brighter appearance
      )

      // Add a subtle ambient light to ensure even illumination from all directions
      lights.ambient = new THREE.AmbientLight(0xFFFFFF, 0.4)

      // No directional lights for this preset
      lights.main = null
      lights.fill = null
      lights.rim = null
      break

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

    default:
      // Fallback to ambient lighting if preset is unknown
      setupLighting('ambient')
      return
  }

  // Add all lights to the scene (only add if they exist)
  if (lights.ambient)
    scene.add(lights.ambient)
  if (lights.hemisphere)
    scene.add(lights.hemisphere)
  if (lights.main)
    scene.add(lights.main)
  if (lights.fill)
    scene.add(lights.fill)
  if (lights.rim)
    scene.add(lights.rim)
}

// Function to reset camera position and view
function resetCameraView() {
  if (!camera || !controls)
    return

  // Reset book to center position
  if (book) {
    book.position.set(0, 0, 0)
  }

  // Reset camera to default position
  camera.position.set(0, 0, 5.5)
  camera.lookAt(0, 0, 0)

  // Reset orbital controls
  controls.target.set(0, 0, 0)
  controls.reset()

  // Disable any auto-rotation
  if (controls.autoRotate) {
    controls.autoRotate = false
  }

  controls.update()

  // Use our centering function to ensure proper positioning
  centerBook()
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

// Flag to prevent multiple concurrent exports
let isExporting = false

// Create a global function to export the current view as an image
window.exportBookImage = async (exportSettings) => {
  if (!renderer || !scene || !camera) {
    console.error('Cannot export image: 3D scene not initialized')
    return
  }

  // Prevent multiple concurrent exports
  if (isExporting) {
    console.warn('Export already in progress, please wait')
    return
  }

  isExporting = true
  isLoading.value = true

  try {
    // Parse the scale value (e.g., "2x" -> 2)
    let scaleValue = Number.parseFloat(exportSettings.scale) || 1

    // Define maximum dimensions to prevent memory issues
    const MAX_EXPORT_SIZE = 5000 * 5000 // ~25 megapixels

    // Get current canvas dimensions
    const width = renderer.domElement.clientWidth
    const height = renderer.domElement.clientHeight

    // Calculate new pixel dimensions
    const scaledWidth = width * scaleValue
    const scaledHeight = height * scaleValue

    // Check if the export would be too large
    if (scaledWidth * scaledHeight > MAX_EXPORT_SIZE) {
      const adjustedScale = Math.sqrt(MAX_EXPORT_SIZE / (width * height))
      console.warn(`Export size too large. Reducing scale from ${scaleValue}x to ${adjustedScale.toFixed(2)}x`)
      scaleValue = adjustedScale
    }

    // Store original renderer size and pixel ratio
    const originalSize = {
      width: renderer.domElement.width,
      height: renderer.domElement.height,
      pixelRatio: renderer.getPixelRatio(),
    }

    // Set a higher pixel ratio for better quality
    renderer.setPixelRatio(window.devicePixelRatio * scaleValue)

    // Resize renderer to current dimensions (with new pixel ratio applied)
    renderer.setSize(width, height, false)

    // If transparent background is selected, temporarily set scene background to transparent
    let originalBackground = null
    if (exportSettings.transparent && scene.background) {
      originalBackground = scene.background.clone()
      scene.background = null
    }

    // Render the scene with the new settings
    renderer.render(scene, camera)

    // Get the canvas element
    const canvas = renderer.domElement

    // Use more memory-efficient Blob approach instead of dataURL for large images
    try {
      // Create a blob from the canvas data
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      if (!blob)
        throw new Error('Failed to create blob from canvas')

      // Create an object URL from the blob
      const url = URL.createObjectURL(blob)

      // Create an invisible download link
      const link = document.createElement('a')
      link.style.display = 'none'
      link.href = url
      link.download = 'bookup-export.png'

      // Add to DOM, click, and remove
      document.body.appendChild(link)
      link.click()

      // Clean up after a delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url) // Important: release the object URL to free memory
      }, 100)
    }
    catch (blobError) {
      // Fallback to dataURL method if blob approach fails
      console.warn('Blob export failed, falling back to dataURL:', blobError)

      // Generate the data URL (always PNG)
      const dataURL = canvas.toDataURL('image/png')

      // Set up the download
      const link = document.createElement('a')
      link.href = dataURL
      link.download = 'bookup-export.png'

      // Trigger the download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    // Restore original background if it was changed
    if (exportSettings.transparent && originalBackground) {
      scene.background = originalBackground
      originalBackground.dispose() // Properly dispose the clone
    }

    // Restore original renderer settings
    renderer.setPixelRatio(originalSize.pixelRatio)
    renderer.setSize(originalSize.width, originalSize.height, false)

    // Render once more with original settings
    renderer.render(scene, camera)

    console.log(`Image exported as PNG at ${exportSettings.scale} scale${exportSettings.transparent ? ' with transparent background' : ''}`)
  }
  catch (error) {
    console.error('Error exporting image:', error)
  }
  finally {
    // Always reset loading states
    isExporting = false
    isLoading.value = false
  }
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

// Clean up all resources to prevent memory leaks
onBeforeUnmount(() => {
  // Cancel any pending animation frame to stop render loop
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  // Make sure any in-progress exports are completed
  isExporting = false
  isLoading.value = false

  // Clean up observers and event listeners first
  if (resizeObserver) {
    try {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    catch (e) {
      console.error('Error disconnecting resize observer:', e)
    }
  }

  // Remove window resize event listener
  if (typeof windowResizeHandler === 'function') {
    window.removeEventListener('resize', windowResizeHandler)
    windowResizeHandler = null
  }

  // Clear any sidebar transition timeouts
  if (sidebarTransitionTimeouts.length > 0) {
    sidebarTransitionTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
    sidebarTransitionTimeouts = []
  }

  // Dispose of all Three.js objects in the correct order

  // 1. Dispose of all geometries and materials
  if (book) {
    book.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose()
        }

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => {
              // Dispose any textures on materials
              if (material.map)
                material.map.dispose()
              if (material.normalMap)
                material.normalMap.dispose()
              if (material.specularMap)
                material.specularMap.dispose()
              if (material.envMap)
                material.envMap.dispose()

              // Dispose material itself
              material.dispose()
            })
          }
          else {
            // Dispose any textures on materials
            if (object.material.map)
              object.material.map.dispose()
            if (object.material.normalMap)
              object.material.normalMap.dispose()
            if (object.material.specularMap)
              object.material.specularMap.dispose()
            if (object.material.envMap)
              object.material.envMap.dispose()

            // Dispose material itself
            object.material.dispose()
          }
        }
      }
    })
    book = null
  }

  // 2. Dispose of textures
  Object.values(textures).forEach((texture) => {
    if (texture) {
      texture.dispose()
    }
  })

  // Reset textures object
  Object.keys(textures).forEach((key) => {
    textures[key] = null
  })

  // 3. Dispose of environment map
  if (scene && scene.environment) {
    scene.environment.dispose()
    scene.environment = null
  }

  // 4. Dispose of renderer - should be last since it may access other objects
  if (renderer) {
    // Ensure WebGL context is released
    const gl = renderer.getContext()
    if (gl) {
      const loseContext = gl.getExtension('WEBGL_lose_context')
      if (loseContext)
        loseContext.loseContext()
    }

    renderer.dispose()
    renderer = null
  }

  // Clear all references
  scene = null
  camera = null
  controls = null

  // Clear global references
  if (window.resetBookCamera)
    window.resetBookCamera = null
  if (window.exportBookImage)
    window.exportBookImage = null
})

// Keep track of sidebar transition timeouts so we can clear them
let sidebarTransitionTimeouts = []

// Watch for sidebar visibility changes to update layout with special handling
watch(() => showSidebar.value, () => {
  // Clear any previous timeouts to avoid overlapping resize events
  sidebarTransitionTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
  sidebarTransitionTimeouts = []

  // For sidebar transitions, we need to handle resize but avoid redundant operations

  // Initial resize with camera position preservation
  handleResize(true) // true = preserve camera position

  // Use a single delayed resize after the transition completes
  // The standard transition duration is 300ms in CSS
  const timeoutId = setTimeout(() => {
    // This single delayed resize is enough to catch layout changes
    // after the transition animation completes
    if (renderer && camera && rendererContainer.value) {
      handleResize(true)
    }
  }, 350) // Just after transition completes

  sidebarTransitionTimeouts.push(timeoutId)
})

// Watch for dimension changes to ensure proper centering
watch(() => [dimensions.value.width, dimensions.value.height, dimensions.value.depth, dimensions.value.scale], () => {
  if (book && camera) {
    // Single resize is sufficient
    handleResize()
  }
})

// Watch for background color changes
watch(() => bookStore.background, (newColor) => {
  if (scene) {
    scene.background = new THREE.Color(newColor)
    
    // Also update environment map if needed
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    
    const envColor = new THREE.Color(newColor)
    const cubeRenderTarget = pmremGenerator.fromScene(
      new THREE.Scene().add(new THREE.HemisphereLight(envColor.getHex(), 0x000000, 1)),
      0.04,
    )
    
    // Dispose of previous environment map if exists
    if (scene.environment) 
      scene.environment.dispose()
      
    scene.environment = cubeRenderTarget.texture
    
    needsUpdate = true
  }
})
</script>

<template>
  <div
    id="book"
    ref="rendererContainer"
    :style="{ backgroundColor: bookStore.background }"
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
