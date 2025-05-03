"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import type { MediaItem, Playlist } from "@prisma/client"
import NextImage from "next/image"
// Import the media utility
import { getMediaUrl, getImageProps } from "@/lib/media-utils"

interface MediaPlayerProps {
  deviceId: string
}

type MediaWithType = MediaItem & {
  currentIndex?: number
  totalItems?: number
}

export default function MediaPlayer({ deviceId }: MediaPlayerProps) {
  const [currentMedia, setCurrentMedia] = useState<MediaWithType | null>(null)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imageTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const nextMediaTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isVideoError, setIsVideoError] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const hasAttemptedAutoplay = useRef(false)
  const autoplayAttemptTimeout = useRef<NodeJS.Timeout | null>(null)

  // Function to fetch the current media for this device
  const fetchCurrentMedia = useCallback(async () => {
    try {
      const response = await fetch(`/api/media/current?deviceId=${deviceId}&t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.status}`)
      }

      const data = await response.json()

      // Check if we have media data
      if (data.media) {
        setCurrentMedia(data.media)
        setPlaylist(data.playlist)
        setIsVideoError(false) // Reset video error state

        // Reset autoplay attempt flag when media changes
        hasAttemptedAutoplay.current = false
      } else {
        // No media available
        setCurrentMedia(null)
        setPlaylist(null)
        if (data.message) {
          setError(data.message)
        }
      }

      setIsLoading(false)
      setRetryCount(0) // Reset retry count on successful fetch
    } catch (err) {
      console.error("Error fetching current media:", err)

      // Implement exponential backoff for retries
      const maxRetries = 5
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000) // Exponential backoff with 30s max
        console.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)

        setTimeout(() => {
          setRetryCount((prev) => prev + 1)
          fetchCurrentMedia()
        }, delay)
      } else {
        setError("Failed to load media content after multiple attempts. Please check your connection.")
        setIsLoading(false)
      }
    }
  }, [deviceId, retryCount])

  // Function to request the next media item
  const requestNextMedia = useCallback(async () => {
    try {
      // Clear any existing timers
      if (nextMediaTimeoutRef.current) {
        clearTimeout(nextMediaTimeoutRef.current)
        nextMediaTimeoutRef.current = null
      }

      const response = await fetch(`/api/media/next?deviceId=${deviceId}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to request next media: ${response.status}`)
      }

      // Fetch the updated media
      await fetchCurrentMedia()
    } catch (err) {
      console.error("Error requesting next media:", err)

      // Retry after a delay
      nextMediaTimeoutRef.current = setTimeout(() => {
        requestNextMedia()
      }, 5000) // Retry after 5 seconds
    }
  }, [deviceId, fetchCurrentMedia])

  // Initialize audio context on component mount
  useEffect(() => {
    // Create audio context for unlocking audio
    const initAudioContext = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext && !audioContextRef.current) {
          audioContextRef.current = new AudioContext()
          console.log("Audio context initialized")
        }
      } catch (e) {
        console.error("Failed to initialize audio context:", e)
      }
    }

    initAudioContext()

    // Clean up function
    return () => {
      if (audioContextRef.current) {
        if (audioContextRef.current.state !== "closed") {
          try {
            audioContextRef.current.close()
          } catch (e) {
            console.error("Error closing audio context:", e)
          }
        }
        audioContextRef.current = null
      }
    }
  }, [])

  // Initial media fetch and polling setup
  useEffect(() => {
    // Initial fetch
    fetchCurrentMedia()

    // Set up polling as a fallback
    pollingIntervalRef.current = setInterval(() => {
      fetchCurrentMedia()
    }, 30000) // Poll every 30 seconds (reduced frequency to avoid overwhelming the server)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      if (nextMediaTimeoutRef.current) {
        clearTimeout(nextMediaTimeoutRef.current)
      }
      if (autoplayAttemptTimeout.current) {
        clearTimeout(autoplayAttemptTimeout.current)
      }
    }
  }, [deviceId, fetchCurrentMedia])

  // Handle image duration and playlist progression
  useEffect(() => {
    if (!currentMedia) return

    // Clear any existing timers
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current)
      imageTimerRef.current = null
    }

    // If it's an image, set a timer to request the next item
    if (currentMedia.type === "IMAGE" && currentMedia.duration) {
      imageTimerRef.current = setTimeout(() => {
        requestNextMedia()
      }, currentMedia.duration * 1000)
    }

    return () => {
      if (imageTimerRef.current) {
        clearTimeout(imageTimerRef.current)
      }
    }
  }, [currentMedia, requestNextMedia])

  // Function to unlock audio
  const unlockAudio = useCallback(() => {
    if (!audioContextRef.current) return

    // Create and play a silent sound to unlock audio
    try {
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume()
      }

      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()
      gainNode.gain.value = 0.001 // Very low volume, almost silent
      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)
      oscillator.start(0)
      oscillator.stop(0.001) // Very short duration

      console.log("Audio unlocked")
    } catch (e) {
      console.error("Error unlocking audio:", e)
    }
  }, [])

  // Attempt to enable audio for video
  const attemptAutoplayWithAudio = useCallback(() => {
    if (!videoRef.current || hasAttemptedAutoplay.current) return

    hasAttemptedAutoplay.current = true

    // First unlock audio context
    unlockAudio()

    // Try multiple approaches to enable audio
    const video = videoRef.current

    // 1. Try setting muted to false before playing
    video.muted = false

    // 2. Try to play with audio
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("Video playing with audio successfully")
          // If successful, unmute (in case it was muted)
          video.muted = false
        })
        .catch((error) => {
          console.warn("Autoplay with audio failed:", error)

          // 3. If that fails, try playing muted first, then unmute
          video.muted = true
          video
            .play()
            .then(() => {
              console.log("Video playing muted successfully")

              // Wait a short time then try to unmute
              autoplayAttemptTimeout.current = setTimeout(() => {
                // Try to unmute after a short delay
                video.muted = false
                console.log("Attempted to unmute after delay")

                // If that fails, try again with user gesture simulation
                if (video.muted) {
                  // This is a last resort and may not work in all browsers
                  const simulatedEvent = new MouseEvent("click", {
                    view: window,
                    bubbles: true,
                    cancelable: true,
                  })
                  document.dispatchEvent(simulatedEvent)

                  // Try unmuting again
                  video.muted = false
                }
              }, 1000)
            })
            .catch((e) => {
              console.error("Even muted autoplay failed:", e)
            })
        })
    }
  }, [unlockAudio])

  // Handle video events
  const handleVideoEnded = () => {
    requestNextMedia()
  }

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video playback error:", e)
    setIsVideoError(true)

    // Try to reload the current media after a short delay
    setTimeout(() => {
      fetchCurrentMedia()
    }, 3000)
  }

  // Effect to handle video playback when media changes
  useEffect(() => {
    if (currentMedia?.type === "VIDEO" && videoRef.current) {
      // Reset autoplay attempt flag
      hasAttemptedAutoplay.current = false

      // Clear any existing timeout
      if (autoplayAttemptTimeout.current) {
        clearTimeout(autoplayAttemptTimeout.current)
      }

      // Set a timeout to attempt autoplay with audio
      // This gives the browser a moment to process the new video element
      autoplayAttemptTimeout.current = setTimeout(() => {
        attemptAutoplayWithAudio()
      }, 100)
    }
  }, [currentMedia, attemptAutoplayWithAudio])

  // Add global event listeners to unlock audio on any user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      unlockAudio()

      // If there's a video and it's muted, try to unmute it
      if (videoRef.current && videoRef.current.muted) {
        videoRef.current.muted = false
      }
    }

    // Add various interaction events to unlock audio
    document.addEventListener("click", handleUserInteraction, { once: true })
    document.addEventListener("touchstart", handleUserInteraction, { once: true })
    document.addEventListener("keydown", handleUserInteraction, { once: true })

    return () => {
      document.removeEventListener("click", handleUserInteraction)
      document.removeEventListener("touchstart", handleUserInteraction)
      document.removeEventListener("keydown", handleUserInteraction)
    }
  }, [unlockAudio])

  // Preload next image/video
  useEffect(() => {
    if (!currentMedia || !playlist) return

    // Get the next index
    const currentIdx = (currentMedia.currentIndex || 1) - 1
    const nextIdx = (currentIdx + 1) % (currentMedia.totalItems || 1)

    // For demonstration purposes only - in a real app, you'd fetch the actual next item
    if (currentMedia.type === "IMAGE") {
      // Preload next item (if we had its URL)
      const preloadImage = new window.Image()
      // preloadImage.src = nextItemUrl
    }
  }, [currentMedia, playlist])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!currentMedia) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Media Available</h2>
          <p>{error || "Please assign a playlist to this device."}</p>
          <p className="mt-4 text-sm text-gray-400">Device ID: {deviceId}</p>
          <button
            onClick={() => {
              setIsLoading(true)
              setError(null)
              fetchCurrentMedia()
            }}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen bg-black overflow-hidden"
      onClick={unlockAudio} // Unlock audio on any click
    >
      {/* Media display */}
      {currentMedia.type === "VIDEO" ? (
        <>
          {isVideoError ? (
            <div className="w-full h-screen flex items-center justify-center text-white">
              <div className="text-center">
                <p>Error loading video. Attempting to recover...</p>
                <div className="mt-4 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={getMediaUrl(currentMedia.url)}
              className="w-full h-screen object-contain"
              autoPlay
              playsInline
              muted={false}
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              controls={false}
              loop={false}
              onCanPlay={() => attemptAutoplayWithAudio()}
            />
          )}
        </>
      ) : (
        <div className="w-full h-screen flex items-center justify-center">
          <NextImage
            {...getImageProps(currentMedia.url || "", currentMedia.title || "Media content")}
            fill
            className="object-contain"
            priority
            onError={() => {
              console.error("Image failed to load:", currentMedia.url)
              // Try to move to next item after a delay
              setTimeout(() => requestNextMedia(), 3000)
            }}
          />
        </div>
      )}

      {/* Overlay with playlist info */}
      {playlist && (
        <div className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded text-sm">
          {currentMedia?.currentIndex}/{currentMedia?.totalItems} - {playlist.name}
        </div>
      )}

      {/* Hidden button to help with audio unlocking - invisible but clickable */}
      <button
        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-default"
        onClick={unlockAudio}
        aria-hidden="true"
      />
    </div>
  )
}
