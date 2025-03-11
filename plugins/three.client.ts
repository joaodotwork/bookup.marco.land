// Three.js client-side plugin
// This ensures Three.js is only loaded in the browser

// Dynamically import Three.js and related modules
// This helps prevent SSR issues and enables code-splitting
async function loadThreeJsDependencies() {
  try {
    // Load THREE.js core
    const THREEModule = await import('three')

    // Load OrbitControls from examples
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls')

    return {
      THREE: THREEModule,
      OrbitControls,
    }
  }
  catch (error) {
    console.error('Failed to load Three.js dependencies:', error)
    return null
  }
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

export default defineNuxtPlugin(async () => {
  // Mock classes for SSR
  class MockOrbitControls {
    constructor() {
      console.warn('Mock OrbitControls created during SSR')
    }

    // Add mock methods that might be called
    update() {}
    dispose() {}
  }

  // Create a minimal mock THREE object for SSR
  const mockTHREE = {
    // Minimal mock implementation to prevent SSR errors
    WebGLRenderer: class {},
    Scene: class {},
    PerspectiveCamera: class {},
    Group: class {},
    Color: class {
      constructor() { return {} }
      set() {}
    },
    sRGBEncoding: 'mock',
    FrontSide: 'mock',
    BoxGeometry: class {},
    Mesh: class {},
    MeshPhysicalMaterial: class {},
    MeshStandardMaterial: class {},
    AmbientLight: class {},
    DirectionalLight: class {},
    Vector3: class {},
    Euler: class {},
    ACESFilmicToneMapping: 'mock',
    PCFSoftShadowMap: 'mock',
    LinearMipmapLinearFilter: 'mock',
    LinearFilter: 'mock',
    ClampToEdgeWrapping: 'mock',
  }

  // If not in browser, provide mock objects
  if (!isBrowser) {
    console.warn('THREE.js not available during SSR. Using mock objects.')

    return {
      provide: {
        THREE: mockTHREE,
        OrbitControls: MockOrbitControls,
      },
    }
  }

  // For browser environment, attempt to load Three.js
  try {
    const modules = await loadThreeJsDependencies()

    if (!modules) {
      throw new Error('Failed to load Three.js modules')
    }

    // Successfully loaded Three.js in browser
    return {
      provide: {
        THREE: modules.THREE,
        OrbitControls: modules.OrbitControls,
      },
    }
  }
  catch (error) {
    console.error('Error setting up Three.js plugin:', error)

    // Fallback to mock objects even in browser if loading failed
    return {
      provide: {
        THREE: mockTHREE,
        OrbitControls: MockOrbitControls,
      },
    }
  }
})
