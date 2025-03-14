import { nanoid } from 'nanoid'
import { defineStore } from 'pinia'

// Define a type for a single design option
interface DesignOption {
  id: string
  name: string
  createdAt: string
  design: {
    cover: string
    back: string
    spine: string
  }
  lighting: {
    preset: string
  }
  surface: {
    type: string
  }
  export: {
    scale: string
    transparent: boolean
  }
}

// Default design template to create new designs
function createDefaultDesign(): DesignOption {
  return {
    id: nanoid(),
    name: `Design ${new Date().toLocaleTimeString()}`,
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
      type: 'uncoated', // Options: 'uncoated', 'matte', 'glossy'
    },
    export: {
      scale: '1x', // Options: '0.5x', '1x', '2x'
      transparent: false,
    },
  }
}

export const useBookStore = defineStore('@bookup/book', {
  state: () => ({
    // Array of design options
    designOptions: [createDefaultDesign()],
    // ID of the currently active design
    currentDesignId: '',
    // For sharing functionality
    shareId: '',
    // Shared properties across all designs
    dimensions: {
      width: 200,
      height: 270,
      depth: 29,
      scale: 1,
    },
    // Camera view (rotation) - shared across all designs
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
    // Background color - shared across all designs
    background: '#0072FF',
    // Animation settings - shared across all designs
    animation: {
      enabled: false, // Animation is disabled by default, user can enable it manually
      speed: 1, // Higher values = slower animation: 1 = fast (60 deg/sec), 10 = normal (6 deg/sec), 100 = very slow (0.6 deg/sec)
      timing: 'linear',
      axis: 'Y',
    },
  }),
  getters: {
    // Get the current active design
    currentDesign: (state) => {
      const current = state.designOptions.find(d => d.id === state.currentDesignId)
      return current || state.designOptions[0]
    },
    // Legacy getters to maintain compatibility with existing code
    design: state => {
      // Merge the current design's cover/spine/back with the global background color
      return {
        ...state.currentDesign.design,
        background: state.background,
      }
    },
    lighting: state => state.currentDesign.lighting,
    surface: state => state.currentDesign.surface,
    export: state => state.currentDesign.export,
    // dimensions and rotation are now directly from state, not from current design
  },
  actions: {
    // Initialize with default design
    init() {
      if (this.designOptions.length === 0) {
        this.designOptions = [createDefaultDesign()]
      }
      if (!this.currentDesignId || !this.designOptions.some(d => d.id === this.currentDesignId)) {
        this.currentDesignId = this.designOptions[0].id
      }
    },
    // Create a new design option
    createDesign(name = '') {
      const newDesign = createDefaultDesign()
      if (name)
        newDesign.name = name
      this.designOptions.push(newDesign)
      this.currentDesignId = newDesign.id
      return newDesign.id
    },
    // Duplicate an existing design
    duplicateDesign(designId = this.currentDesignId) {
      const design = this.designOptions.find(d => d.id === designId)
      if (!design)
        return null

      const newDesign = JSON.parse(JSON.stringify(design))
      newDesign.id = nanoid()
      newDesign.name = `Copy of ${design.name}`
      newDesign.createdAt = new Date().toISOString()

      this.designOptions.push(newDesign)
      this.currentDesignId = newDesign.id
      return newDesign.id
    },
    // Delete a design
    deleteDesign(designId = this.currentDesignId) {
      const index = this.designOptions.findIndex(d => d.id === designId)
      if (index === -1)
        return false

      // Don't delete the last design
      if (this.designOptions.length === 1)
        return false

      this.designOptions.splice(index, 1)

      // If we deleted the current design, select another one
      if (designId === this.currentDesignId) {
        this.currentDesignId = this.designOptions[0].id
      }

      return true
    },
    // Select a design by ID
    selectDesign(designId) {
      const design = this.designOptions.find(d => d.id === designId)
      if (design) {
        this.currentDesignId = designId
        return true
      }
      return false
    },
    // Rename a design
    renameDesign(designId, newName) {
      const design = this.designOptions.find(d => d.id === designId)
      if (design) {
        design.name = newName
        return true
      }
      return false
    },
    // Share the current design and all options
    async shareDesign() {
      try {
        // Generate a new share ID
        this.shareId = nanoid(10)
        
        // For debugging purposes
        console.log('Creating share with ID:', this.shareId)

        // Get a simplified version of the design options
        // Strip out binary data to reduce size
        const optimizedDesignOptions = this.designOptions.map(design => {
          // Create a copy without large binary data
          return {
            id: design.id,
            name: design.name,
            createdAt: design.createdAt,
            // Only include URLs, not base64 data for images
            design: {
              cover: design.design.cover?.startsWith('data:') ? 
                '[IMAGE DATA]' : design.design.cover || '',
              back: design.design.back?.startsWith('data:') ? 
                '[IMAGE DATA]' : design.design.back || '',
              spine: design.design.spine?.startsWith('data:') ? 
                '[IMAGE DATA]' : design.design.spine || '',
            },
            lighting: design.lighting,
            surface: design.surface,
            export: design.export,
          }
        });

        // Create a complete data object that includes designs and shared properties
        const completeData = {
          // Include optimized design options
          designOptions: optimizedDesignOptions,
          // Current design ID
          currentDesignId: this.currentDesignId,
          // Shared properties
          dimensions: this.dimensions,
          rotation: this.rotation,
          background: this.background,
          animation: this.animation,
        }

        // Check size first
        const dataSize = JSON.stringify(completeData).length;
        if (dataSize > 5 * 1024 * 1024) {
          console.error(`Design data is too large: ${Math.round(dataSize / 1024 / 1024)}MB`);
          return null;
        }

        // Call the API to share the design
        const response = await fetch('/api/designs/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            design: completeData,
            shareId: this.shareId,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to share design:', errorText);
          return null;
        }

        const result = await response.json();
        return result.shareUrl;
      }
      catch (error) {
        console.error('Error sharing design:', error);
        return null;
      }
    },

    // Load a shared design from a share ID
    async loadSharedDesign(shareId) {
      try {
        console.log('Loading design with ID:', shareId)
        
        // Call the API to get the shared design
        const response = await fetch(`/api/designs/${shareId}`)

        if (!response.ok) {
          console.error('Failed to load shared design:', await response.text())
          return false
        }

        // Get the shared design data
        const sharedData = await response.json()
        console.log('Loaded shared design:', sharedData)

        // Handle the new data format with multiple designs
        if (sharedData.designOptions && Array.isArray(sharedData.designOptions)) {
          // Clear existing designs
          this.designOptions = []
          
          // Add each design with a new ID
          sharedData.designOptions.forEach(design => {
            // Create a new design with a new ID but keep the name
            const newDesign = {
              ...design,
              id: nanoid(), // Give it a new ID to avoid conflicts
            }
            this.designOptions.push(newDesign)
          })
          
          // Set the current design ID to match the position of the original current design
          if (this.designOptions.length > 0) {
            // Try to find the index of the current design in the original array
            const currentIndex = sharedData.designOptions.findIndex(d => d.id === sharedData.currentDesignId)
            
            // If found, use the corresponding new design's ID
            if (currentIndex >= 0 && currentIndex < this.designOptions.length) {
              this.currentDesignId = this.designOptions[currentIndex].id
            } else {
              // Fallback to the first design
              this.currentDesignId = this.designOptions[0].id
            }
          }
        } else {
          // Handle legacy format with a single design
          // Extract shared properties if they exist
          if (sharedData.dimensions) {
            this.dimensions = sharedData.dimensions
          }
          
          if (sharedData.rotation) {
            this.rotation = sharedData.rotation
          }
          
          if (sharedData.background) {
            this.background = sharedData.background
          }
          
          if (sharedData.animation) {
            this.animation = sharedData.animation
          }

          // Create a new design based on the shared data (only the design-specific parts)
          const newDesign = {
            id: nanoid(),
            name: `Shared Design (${new Date().toLocaleTimeString()})`,
            createdAt: new Date().toISOString(),
            design: {
              cover: sharedData.design?.cover || '',
              back: sharedData.design?.back || '',
              spine: sharedData.design?.spine || '',
            },
            lighting: sharedData.lighting || this.currentDesign.lighting,
            surface: sharedData.surface || this.currentDesign.surface,
            export: sharedData.export || this.currentDesign.export,
          }

          // Add the design to our options
          this.designOptions.push(newDesign)

          // Select the new design
          this.currentDesignId = newDesign.id
        }

        // Extract shared properties regardless of format
        if (sharedData.dimensions) {
          this.dimensions = sharedData.dimensions
        }
        
        if (sharedData.rotation) {
          this.rotation = sharedData.rotation
        }
        
        if (sharedData.background) {
          this.background = sharedData.background
        }
        
        if (sharedData.animation) {
          this.animation = sharedData.animation
        }

        return true
      }
      catch (error) {
        console.error('Error loading shared design:', error)
        return false
      }
    },
  },
  persist: process.client
    ? {
        // Enable persistence for design options only on client side
        enabled: true,
        strategies: [
          {
            key: 'bookup-designs',
            storage: localStorage,
          },
        ],
      }
    : false,
})
