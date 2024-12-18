/**
 * Preloads an array of images.
 *
 * @param {string[]} imageUrls - Array of image URLs to preload.
 * @returns {Promise<void>} A promise that resolves when all images are preloaded or rejects if an unexpected error occurs.
 */
export async function preloadImages(imageUrls: string[]): Promise<void> {
  return new Promise((resolve) => {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      resolve()
      return
    }

    let loadedCount = 0
    const totalImages = imageUrls.length

    imageUrls.forEach((url) => {
      const img = new Image()

      img.onload = () => {
        loadedCount++
        if (loadedCount === totalImages) {
          resolve()
        }
      }

      img.onerror = () => {
        console.warn(`Failed to load image: ${url}`)
        loadedCount++
        if (loadedCount === totalImages) {
          resolve()
        }
      }

      img.src = url
    })
  })
}
