"use client"

// This file is kept as a placeholder to maintain file structure
// We've replaced WebSockets with HTTP polling for better reliability

export function useWebSocket() {
  console.warn("WebSockets have been replaced with HTTP polling for better reliability")
  return {
    lastMessage: null,
    readyState: 3, // CLOSED
    sendMessage: () => {},
    reconnect: () => {},
  }
}
