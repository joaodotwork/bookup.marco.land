import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getDesign } from '../../utils/designStore'

export default defineEventHandler(async (event) => {
  // Get the design ID from the URL
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing design ID',
    })
  }

  // Fetch the design from our store
  const result = await getDesign(id)

  if (!result.success) {
    throw createError({
      statusCode: 404,
      statusMessage: result.error || 'Design not found',
    })
  }

  return result.data
})
