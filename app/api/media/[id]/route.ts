import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { unlink } from "fs/promises"
import path from "path"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const mediaItem = await db.mediaItem.findUnique({
      where: { id: params.id },
    })

    if (!mediaItem) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 })
    }

    return NextResponse.json(mediaItem)
  } catch (error) {
    console.error("Error fetching media item:", error)
    return NextResponse.json({ error: "Failed to fetch media item" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Get the media item to find its file path
    const mediaItem = await db.mediaItem.findUnique({
      where: { id: params.id },
    })

    if (!mediaItem) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 })
    }

    // Check if media is used in any playlists
    const playlistItems = await db.playlistItem.findMany({
      where: { mediaId: params.id },
    })

    // Delete the media item (cascade will handle playlist items)
    await db.mediaItem.delete({
      where: { id: params.id },
    })

    // Delete the file from the public directory
    try {
      // The URL will be like "/images/filename.jpg" or "/videos/filename.mp4"
      // We need to convert it to an absolute path in the public directory
      const relativePath = mediaItem.url // e.g., "/images/filename.jpg"
      const publicPath = path.join(process.cwd(), "public", relativePath.substring(1)) // Remove leading slash

      await unlink(publicPath)
      console.log(`Deleted file: ${publicPath}`)
    } catch (fileError) {
      console.error("Error deleting file:", fileError)
      // Continue even if file deletion fails
    }

    // If this media was in playlists, reorder the remaining items
    if (playlistItems.length > 0) {
      // Get unique playlist IDs
      const playlistIds = [...new Set(playlistItems.map((item) => item.playlistId))]

      // For each affected playlist, reorder items
      for (const playlistId of playlistIds) {
        const remainingItems = await db.playlistItem.findMany({
          where: { playlistId },
          orderBy: { order: "asc" },
        })

        // Update order for each item
        for (let i = 0; i < remainingItems.length; i++) {
          await db.playlistItem.update({
            where: { id: remainingItems[i].id },
            data: { order: i },
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting media item:", error)
    return NextResponse.json({ error: "Failed to delete media item" }, { status: 500 })
  }
}
