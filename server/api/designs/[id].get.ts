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
  const design = getDesign(id)

  if (!design) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Design not found',
    })
  }

  return design
})
