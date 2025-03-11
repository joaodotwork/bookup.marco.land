// Three.js client-side plugin
// This ensures Three.js is only loaded in the browser

// Import THREE.js directly for better SSR handling
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

// Simple check to verify imports worked
const isThreeLoaded = typeof THREE === 'object' && THREE !== null
const isOrbitControlsLoaded = typeof OrbitControls === 'function'

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

export default defineNuxtPlugin(() => {
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

  // SSR - provide mock objects
  if (!isBrowser) {
    console.warn('THREE.js not available during SSR. Using mock objects.')
    return {
      provide: {
        THREE: mockTHREE,
        OrbitControls: MockOrbitControls,
        isThreeReady: false,
      },
    }
  }

  // Log Three.js loading status in browser
  console.log('Three.js loaded status:', { 
    isThreeLoaded, 
    isOrbitControlsLoaded,
    isBrowser
  })
  
  // For browser environment - try to use the imported modules
  if (isThreeLoaded && isOrbitControlsLoaded) {
    return {
      provide: {
        THREE,
        OrbitControls,
        isThreeReady: true,
      },
    }
  }
  
  // Fallback to mock objects if imports failed
  console.error('Error: Three.js modules not loaded correctly')
  return {
    provide: {
      THREE: mockTHREE,
      OrbitControls: MockOrbitControls,
      isThreeReady: false,
    },
  }
})
