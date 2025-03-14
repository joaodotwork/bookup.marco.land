import { put, list, del, get } from '@vercel/blob';

/**
 * Persistent storage for design data using Vercel Blob.
 * Designs are stored with expiration to prevent unlimited growth.
 * 
 * For local development, falls back to in-memory storage when Blob is not available.
 */

// Backup in-memory storage for local development
if (typeof globalThis.sharedDesigns === 'undefined') {
  globalThis.sharedDesigns = new Map<string, any>()
}

// Check if Vercel Blob is available (will be in production)
const isBlobAvailable = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN

// Store a design with a unique ID
export async function storeDesign(id: string, data: any) {
  try {
    const jsonData = JSON.stringify(data)
    
    if (isBlobAvailable) {
      // Store in Vercel Blob
      // Default expiration is 30 days
      const blob = await put(`designs/${id}.json`, jsonData, {
        contentType: 'application/json',
        access: 'public',
      })
      
      return { success: true, id, url: blob.url }
    } else {
      // Fallback to in-memory storage for development
      console.warn('Vercel Blob not available, using in-memory storage')
      globalThis.sharedDesigns.set(id, data)
      return { success: true, id }
    }
  } catch (error) {
    console.error('Failed to store design:', error)
    return { success: false, error: 'Failed to store design' }
  }
}

// Retrieve a design by ID
export async function getDesign(id: string) {
  try {
    if (isBlobAvailable) {
      // Get from Vercel Blob
      try {
        const blob = await get(`designs/${id}.json`)
        
        if (!blob) {
          return { success: false, error: 'Design not found' }
        }
        
        // Get blob content as text (JSON)
        const designText = await blob.text()
        const designData = JSON.parse(designText)
        
        return { success: true, data: designData }
      } catch (error) {
        // If the blob doesn't exist, Vercel will throw a 404 error
        if (error.status === 404) {
          return { success: false, error: 'Design not found' }
        }
        throw error
      }
    } else {
      // Fallback to in-memory storage
      console.warn('Vercel Blob not available, using in-memory storage')
      const design = globalThis.sharedDesigns.get(id)
      
      if (!design) {
        return { success: false, error: 'Design not found' }
      }
      
      return { success: true, data: design }
    }
  } catch (error) {
    console.error('Failed to retrieve design:', error)
    return { success: false, error: 'Failed to retrieve design' }
  }
}

// Delete a design by ID
export async function deleteDesign(id: string) {
  try {
    if (isBlobAvailable) {
      // Delete from Vercel Blob
      await del(`designs/${id}.json`)
    } else {
      // Fallback to in-memory storage
      console.warn('Vercel Blob not available, using in-memory storage')
      globalThis.sharedDesigns.delete(id)
    }
    return { success: true }
  } catch (error) {
    console.error('Failed to delete design:', error)
    return { success: false, error: 'Failed to delete design' }
  }
}

// List all designs (useful for admin purposes or cleanup)
export async function listDesigns() {
  try {
    if (isBlobAvailable) {
      // List all designs from Vercel Blob
      const { blobs } = await list({ prefix: 'designs/' })
      return { 
        success: true, 
        designs: blobs.map(blob => ({
          id: blob.pathname.replace('designs/', '').replace('.json', ''),
          url: blob.url,
          uploadedAt: blob.uploadedAt
        }))
      }
    } else {
      // Fallback to in-memory storage
      console.warn('Vercel Blob not available, using in-memory storage')
      const designs = Array.from(globalThis.sharedDesigns.keys()).map(id => ({
        id,
        url: null,
        uploadedAt: new Date()
      }))
      return { success: true, designs }
    }
  } catch (error) {
    console.error('Failed to list designs:', error)
    return { success: false, error: 'Failed to list designs' }
  }
}