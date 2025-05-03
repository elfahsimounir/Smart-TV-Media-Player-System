import { headers } from "next/headers"

export async function getClientIp(): Promise<string> {
  const headersList = headers()

  // Try to get IP from common headers
  const forwardedFor = headersList.get("x-forwarded-for")
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim()
  }

  const realIp = headersList.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  // Fallback to a placeholder IP for development
  return "127.0.0.1"
}
