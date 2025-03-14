import { createError, defineEventHandler, readBody } from 'h3'
import { put } from '@vercel/blob'

export default defineEventHandler(async (event) => {
  try {
    // Read the request body
    const body = await readBody(event)

    if (!body || !body.data || !body.imageId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields',
      })
    }

    const { data, imageId, contentType = 'image/jpeg' } = body

    // Validate the data URL
    if (!data.startsWith('data:')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid data URL',
      })
    }

    // Extract binary data from data URL
    const base64Data = data.split(',')[1]
    if (!base64Data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid data URL format',
      })
    }

    // Convert base64 to blob
    const buffer = Buffer.from(base64Data, 'base64')

    // Check if we have a token
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN
    
    if (!token) {
      console.error('No Blob token available. Check BLOB_READ_WRITE_TOKEN environment variable.')
      throw new Error('Blob storage not configured properly')
    }
    
    // Store in Vercel Blob with explicit token
    const blob = await put(`images/${imageId}`, buffer, {
      contentType,
      access: 'public',
      cacheControl: 'public, max-age=31536000',
      addRandomSuffix: false,
      token: token,
    })

    return {
      success: true,
      url: blob.url,
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to upload image',
    })
  }
})