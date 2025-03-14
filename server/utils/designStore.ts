// Simple in-memory storage for design data
// In a real implementation this would be replaced with a database

// Add type declaration to avoid TypeScript errors
declare global {
  var sharedDesigns: Map<string, any>
}

// Use globalThis to ensure the Map is shared across all imports of this module
if (!globalThis.sharedDesigns) {
  globalThis.sharedDesigns = new Map<string, any>()
  
  // Add a test design that's always available with multiple design options
  const testDesign = {
    // Include multiple design options
    designOptions: [
      {
        id: 'design-1',
        name: 'Cover Design 1',
        createdAt: new Date().toISOString(),
        design: {
          cover: '',
          back: '',
          spine: '',
        },
        lighting: {
          preset: 'ambient',
        },
        surface: {
          type: 'uncoated',
        },
        export: {
          scale: '1x',
          transparent: false,
        },
      },
      {
        id: 'design-2',
        name: 'Cover Design 2',
        createdAt: new Date().toISOString(),
        design: {
          cover: '',
          back: '',
          spine: '',
        },
        lighting: {
          preset: 'studio',
        },
        surface: {
          type: 'matte',
        },
        export: {
          scale: '1x',
          transparent: false,
        },
      }
    ],
    // Current design ID
    currentDesignId: 'design-1',
    // Shared properties
    dimensions: {
      width: 200,
      height: 270,
      depth: 29,
      scale: 1,
    },
    background: '#0072FF',
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
    animation: {
      enabled: false,
      speed: 1,
      timing: 'linear',
      axis: 'Y',
    }
  }
  
  globalThis.sharedDesigns.set('test', testDesign)
  console.log('Test design added with ID: test')
}

export function storeDesign(id: string, design: any): void {
  globalThis.sharedDesigns.set(id, design)
  console.log(`Design stored with ID: ${id}`)
}

export function getDesign(id: string): any {
  console.log(`Getting design with ID: ${id}`)
  const design = globalThis.sharedDesigns.get(id)
  if (!design) {
    console.log(`Design not found with ID: ${id}`)
    console.log(`Available designs: ${listDesigns().join(', ')}`)
  }
  return design
}

export function deleteDesign(id: string): boolean {
  console.log(`Deleting design with ID: ${id}`)
  return globalThis.sharedDesigns.delete(id)
}

export function listDesigns(): string[] {
  const keys = Array.from(globalThis.sharedDesigns.keys())
  console.log(`Available designs: ${keys.join(', ')}`)
  return keys
}