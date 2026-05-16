// lib/image-utils.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  
  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // Clean up backslashes and ensure proper path format
  const cleanPath = path.replace(/\\/g, '/')
  
  // Ensure path starts with /
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`
  
  return `${API_BASE_URL}${normalizedPath}`
}

// Helper to determine if we should use Next.js Image or regular img
export function shouldUseNextImage(url: string | null): boolean {
  if (!url) return false
  // Don't use Next.js Image for localhost images in development
  if (process.env.NODE_ENV === 'development' && url.includes('localhost')) {
    return false
  }
  // Also check for other private IP patterns
  if (process.env.NODE_ENV === 'development' && 
      (url.includes('127.0.0.1') || url.includes('::1'))) {
    return false
  }
  return true
}

export function getPlaceholderImage(status: string): string {
  const placeholders = {
    pending: "/placeholder.svg?height=400&width=600&query=pending report",
    processing: "/placeholder.svg?height=400&width=600&query=processing",
    analyzed: "/placeholder.svg?height=400&width=600&query=analyzed waste site",
    rejected: "/placeholder.svg?height=400&width=600&query=rejected report",
    default: "/placeholder.svg?height=400&width=600&query=dumping site"
  }
  
  return placeholders[status as keyof typeof placeholders] || placeholders.default
}