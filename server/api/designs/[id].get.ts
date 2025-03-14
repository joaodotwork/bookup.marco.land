import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getDesign } from '../../utils/designStore'

export default defineEventHandler(async (event) => {
  // Get the design ID from the URL
  const id = getRouterParam(event, 'id')
  console.log('API: Design fetch request received for ID:', id)

  if (!id) {
    console.error('API: Missing design ID in request')
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing design ID',
    })
  }

  // Fetch the design from our store
  console.log('API: Fetching design with ID:', id)
  const result = await getDesign(id)
  console.log('API: Design fetch result:', result.success ? 'Success' : 'Failed', 
              result.error || '', 
              result.success ? `Data size: ${JSON.stringify(result.data).length} bytes` : '')

  if (!result.success) {
    console.error('API: Design not found:', result.error)
    throw createError({
      statusCode: 404,
      statusMessage: result.error || 'Design not found',
    })
  }

  // Log design data details for debugging
  const data = result.data
  console.log('API: Returning design data with:', 
              'designOptions:', Array.isArray(data.designOptions) ? data.designOptions.length : 'none',
              'currentDesignId:', data.currentDesignId || 'none')
  
  return result.data
})
