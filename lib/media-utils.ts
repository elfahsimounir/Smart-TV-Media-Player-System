/**
 * Utility function to ensure media URLs are properly formatted
 * and include a cache-busting parameter
 */
export function getMediaUrl(url: string): string {
  if (!url) return ""

  // Check if it's an image or video path from our uploads
  if (url.startsWith("/images/") || url.startsWith("/videos/")) {
    // Convert to API route path
    return `/api/images${url}`
  }

  // For other URLs, add a timestamp to prevent caching
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}t=${Date.now()}`
}

/**
 * Utility function to check if a file exists in the public directory
 * This is useful for debugging media file issues
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    const response = await fetch(filePath, { method: "HEAD" })
    return response.ok
  } catch (error) {
    console.error(`Error checking if file exists: ${filePath}`, error)
    return false
  }
}

/**
 * Utility function to ensure image paths are correctly formatted for Next.js Image component
 * This addresses the difference between built-in and uploaded images
 */
export function getImageProps(src: string, alt = "") {
  return {
    src: getMediaUrl(src),
    alt,
    unoptimized: true,
    style: { color: "transparent" }, // This is crucial for consistency with Next.js built-in images
    loading: "lazy",
    onError: (e: any) => {
      console.error(`Failed to load image: ${src}`, e)
    },
  }
}
