import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get("deviceId")

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    // Get the device and its playlist
    const device = await db.device.findUnique({
      where: { id: deviceId },
      include: {
        playlist: {
          include: {
            items: {
              orderBy: { order: "asc" },
              include: { media: true },
            },
          },
        },
      },
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Update the device's last seen timestamp
    await db.device.update({
      where: { id: deviceId },
      data: { lastSeen: new Date() },
    })

    // If no playlist is assigned or playlist is empty
    if (!device.playlist || device.playlist.items.length === 0) {
      return NextResponse.json({
        message: "No playlist assigned or playlist is empty",
        media: null,
        playlist: null,
      })
    }

    // Use the stored current media index
    const currentIndex = device.currentMediaIndex % device.playlist.items.length
    const currentItem = device.playlist.items[currentIndex]

    // Return the media item
    return NextResponse.json(
      {
        media: {
          ...currentItem.media,
          currentIndex: currentIndex + 1,
          totalItems: device.playlist.items.length,
        },
        playlist: {
          id: device.playlist.id,
          name: device.playlist.name,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Error getting current media:", error)
    return NextResponse.json({ error: "Failed to get current media" }, { status: 500 })
  }
}
