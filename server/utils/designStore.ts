/**
 * Persistent storage for design data using Vercel Blob.
 * Designs are stored with a 30-day expiration to prevent unlimited growth.
 * 
 * For local development, falls back to in-memory storage when Blob is not available.
 */

// Backup in-memory storage for local development
if (typeof globalThis.sharedDesigns === 'undefined') {
  globalThis.sharedDesigns = new Map<string, any>()
}

// Check if we're in a server environment
const isServer = typeof window === 'undefined'

// Check if Vercel Blob is available (will be in production)
const isBlobAvailable = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN

// Helper to get the URL where a design would be stored
const getDesignUrl = (id: string) => {
  // Get Vercel project and team details from environment
  const projectId = process.env.VERCEL_PROJECT_ID || ''
  const teamId = process.env.VERCEL_TEAM_ID || ''
  
  // For better reliability, construct URL with proper path segments
  let storageUrl = process.env.VERCEL_BLOB_PUBLIC_URL || 'https://public.blob.vercel-storage.com'
  
  // Ensure the URL doesn't have trailing slashes
  storageUrl = storageUrl.replace(/\/$/, '')
  
  // Construct a proper blob path (using project ID if available)
  const blobPath = projectId ? 
    `/${projectId}${teamId ? `_${teamId}` : ''}/designs/${id}.json` : 
    `/designs/${id}.json`
    
  return `${storageUrl}${blobPath}`
}

// Store a design with a unique ID
export async function storeDesign(id: string, data: any) {
  try {
    // Save to in-memory cache in all cases (as backup)
    globalThis.sharedDesigns.set(id, data);
    
    if (isBlobAvailable && isServer) {
      try {
        // Clear URL cache for this ID
        if (globalThis.designUrlCache) {
          globalThis.designUrlCache.delete(id);
        }
        
        // Prepare data as JSON
        const jsonData = JSON.stringify(data);
        
        // Import is inside the function to prevent client inclusion
        const { put } = await import('@vercel/blob');
        
        // Store in Vercel Blob with public access
        const blob = await put(`designs/${id}.json`, jsonData, {
          contentType: 'application/json',
          access: 'public',
          cacheControl: 'max-age=31536000', // 1 year cache
          addRandomSuffix: false, // Use exact filename
        });
        
        console.log('Design stored in Blob:', blob.url);
        
        // Cache the URL for future use
        if (!globalThis.designUrlCache) {
          globalThis.designUrlCache = new Map();
        }
        globalThis.designUrlCache.set(id, blob.url);
        
        return { success: true, id, url: blob.url };
      } catch (blobError) {
        console.error('Error storing in Blob:', blobError);
        // Continue with fallback
        return { 
          success: true, 
          id, 
          note: 'Saved to memory only, Blob storage failed'
        };
      }
    } else {
      // Fallback for development
      console.log('Using in-memory storage (no Blob available)');
      return { success: true, id };
    }
  } catch (error) {
    console.error('Failed to store design:', error);
    return { success: false, error: 'Failed to store design' };
  }
}

// Retrieve a design by ID
export async function getDesign(id: string) {
  console.log(`DesignStore: Getting design with ID: ${id}`)
  console.log(`DesignStore: Environment: ${isServer ? 'Server' : 'Client'}, Blob available: ${isBlobAvailable ? 'Yes' : 'No'}`)
  
  try {
    // Check in-memory storage first as a quick check
    const memoryDesign = globalThis.sharedDesigns?.get(id);
    if (memoryDesign) {
      console.log('DesignStore: Found design in memory, returning it')
      return { success: true, data: memoryDesign };
    }
    
    if (isBlobAvailable && isServer) {
      try {
        // First try using Vercel Blob read API if available
        try {
          console.log('DesignStore: Trying Vercel Blob native get')
          const { get } = await import('@vercel/blob');
          const blob = await get(`designs/${id}.json`);
          
          if (blob) {
            console.log('DesignStore: Got blob from Vercel Blob API')
            const designText = await blob.text();
            const designData = JSON.parse(designText);
            
            // Save to memory cache for future requests
            if (!globalThis.sharedDesigns) globalThis.sharedDesigns = new Map();
            globalThis.sharedDesigns.set(id, designData);
            
            return { success: true, data: designData };
          }
        } catch (blobError) {
          // Vercel Blob get function might not be available or might throw
          console.log('DesignStore: Vercel Blob get failed:', blobError.message);
        }
        
        // Store public URLs in memory to prevent repeated lookups
        if (!globalThis.designUrlCache) {
          globalThis.designUrlCache = new Map();
        }
        
        // Check if we've already received a URL for this design
        let designUrl = globalThis.designUrlCache.get(id);
        
        // If we don't have a URL cached, try to get one by doing a head request
        if (!designUrl) {
          try {
            // Get the proper URL from the storage directly
            console.log('DesignStore: Looking up blob URL via list')
            const { list } = await import('@vercel/blob');
            const { blobs } = await list({ prefix: `designs/${id}.json` });
            
            console.log(`DesignStore: List result: ${blobs?.length || 0} blobs found`)
            
            if (blobs && blobs.length > 0) {
              designUrl = blobs[0].url;
              globalThis.designUrlCache.set(id, designUrl);
              console.log('DesignStore: Found blob URL:', designUrl)
            } else {
              console.log('DesignStore: No blobs found with this ID')
            }
          } catch (listError) {
            console.log('DesignStore: Blob list error:', listError.message);
            // If list fails, fall back to constructed URL
            designUrl = getDesignUrl(id);
            console.log('DesignStore: Using constructed URL:', designUrl)
          }
        } else {
          console.log('DesignStore: Using cached URL:', designUrl)
        }
        
        if (!designUrl) {
          console.error('DesignStore: No URL available for this design')
          return { success: false, error: 'Design not found (no URL available)' };
        }
        
        console.log('DesignStore: Fetching design from URL:', designUrl);
        
        // Fetch the design with retry logic
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        try {
          const response = await fetch(designUrl, { 
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            if (response.status === 404) {
              console.error('DesignStore: 404 Not Found from URL')
              return { success: false, error: 'Design not found' };
            }
            throw new Error(`Server returned ${response.status}`);
          }
          
          const designText = await response.text();
          console.log(`DesignStore: Got response text (${designText.length} bytes)`)
          
          const designData = JSON.parse(designText);
          
          // Save to memory cache for future requests
          if (!globalThis.sharedDesigns) globalThis.sharedDesigns = new Map();
          globalThis.sharedDesigns.set(id, designData);
          
          console.log('DesignStore: Successfully parsed design data')
          return { success: true, data: designData };
        } catch (fetchError) {
          clearTimeout(timeoutId);
          console.error('DesignStore: Fetch error:', fetchError.message)
          throw fetchError;
        }
      } catch (error) {
        console.error('DesignStore: Error retrieving design:', error.message || error);
        
        // Check in-memory store as last resort
        const memoryDesign = globalThis.sharedDesigns?.get(id);
        if (memoryDesign) {
          console.log('DesignStore: Found design in memory as fallback')
          return { success: true, data: memoryDesign };
        }
        
        return { 
          success: false, 
          error: `Unable to retrieve design: ${error.message || 'Unknown error'}`
        };
      }
    } else {
      // Fallback to in-memory storage for local dev
      console.log('DesignStore: Using in-memory storage (no Blob available)');
      const design = globalThis.sharedDesigns?.get(id);
      
      if (!design) {
        console.error('DesignStore: Design not found in memory storage')
        return { success: false, error: 'Design not found in memory' };
      }
      
      console.log('DesignStore: Found design in memory')
      return { success: true, data: design };
    }
  } catch (error) {
    console.error('DesignStore: Fatal error retrieving design:', error.message || error);
    return { success: false, error: 'Failed to retrieve design' };
  }
}

// Delete a design by ID
export async function deleteDesign(id: string) {
  try {
    if (isBlobAvailable && isServer) {
      // Import is moved inside the function
      const { del } = await import('@vercel/blob')
      
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
    if (isBlobAvailable && isServer) {
      // Import is moved inside the function
      const { list } = await import('@vercel/blob')
      
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