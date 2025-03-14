import { createError, defineEventHandler, readBody } from 'h3'
import { storeDesign } from '../../utils/designStore'

// Maximum allowed payload size (6MB to be safe)
const MAX_PAYLOAD_SIZE = 6 * 1024 * 1024

export default defineEventHandler(async (event) => {
  try {
    // Read the request body
    const body = await readBody(event)

    if (!body || !body.design || !body.shareId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields',
      })
    }

    const { design, shareId } = body

    // Check the payload size
    const payloadSize = JSON.stringify(design).length

    if (payloadSize > MAX_PAYLOAD_SIZE) {
      throw createError({
        statusCode: 413,
        statusMessage: `Design is too large (${Math.round(payloadSize / 1024 / 1024)}MB). Maximum size is ${Math.round(MAX_PAYLOAD_SIZE / 1024 / 1024)}MB.`,
      })
    }

    // Store the design in our store
    const result = await storeDesign(shareId, design)

    if (!result.success) {
      throw createError({
        statusCode: 500,
        statusMessage: result.error || 'Failed to store design',
      })
    }

    // Return the share ID and a shareable URL
    return {
      shareId,
      shareUrl: `/share/${shareId}`,
    }
  } catch (error) {
    console.error('Error in share endpoint:', error)
    
    if (error.statusCode) {
      // Re-throw HTTP errors
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error',
    })
  }
})
