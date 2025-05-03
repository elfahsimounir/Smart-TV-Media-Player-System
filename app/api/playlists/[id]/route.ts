import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const playlist = await db.playlist.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            media: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    return NextResponse.json(playlist)
  } catch (error) {
    console.error("Error fetching playlist:", error)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, items, mediaIds } = body

    if (!name) {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }

    // Update playlist name
    const updatedPlaylist = await db.playlist.update({
      where: { id: params.id },
      data: {
        name,
      },
    })

    // If mediaIds are provided, completely rebuild the playlist items
    if (mediaIds && Array.isArray(mediaIds)) {
      // Delete all existing items
      await db.playlistItem.deleteMany({
        where: { playlistId: params.id },
      })

      // Create new items
      await db.playlistItem.createMany({
        data: mediaIds.map((mediaId, index) => ({
          playlistId: params.id,
          mediaId,
          order: index,
        })),
      })
    }
    // If only items are provided (for reordering)
    else if (items && Array.isArray(items)) {
      // Get current items
      const currentItems = await db.playlistItem.findMany({
        where: { playlistId: params.id },
      })

      // Items to delete (not in the new list)
      const itemsToDelete = currentItems.filter((item) => !items.some((newItem) => newItem.id === item.id))

      // Delete removed items
      if (itemsToDelete.length > 0) {
        await db.playlistItem.deleteMany({
          where: {
            id: {
              in: itemsToDelete.map((item) => item.id),
            },
          },
        })
      }

      // Update order for remaining items
      for (const item of items) {
        await db.playlistItem.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      }
    }

    return NextResponse.json(updatedPlaylist)
  } catch (error) {
    console.error("Error updating playlist:", error)
    return NextResponse.json({ error: "Failed to update playlist" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Delete playlist (cascade will handle playlist items)
    await db.playlist.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting playlist:", error)
    return NextResponse.json({ error: "Failed to delete playlist" }, { status: 500 })
  }
}
