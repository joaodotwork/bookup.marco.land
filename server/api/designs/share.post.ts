import { createError, defineEventHandler, readBody } from 'h3'
import { storeDesign } from '../../utils/designStore'

export default defineEventHandler(async (event) => {
  // Read the request body
  const body = await readBody(event)

  if (!body || !body.design || !body.shareId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    })
  }

  const { design, shareId } = body

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
})
