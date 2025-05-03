import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: Request) {
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

    if (!device.playlist || device.playlist.items.length === 0) {
      return NextResponse.json({ error: "No playlist assigned or playlist is empty" }, { status: 404 })
    }

    // Calculate the next index
    const nextIndex = (device.currentMediaIndex + 1) % device.playlist.items.length

    // Update the device's current media index
    await db.device.update({
      where: { id: deviceId },
      data: {
        currentMediaIndex: nextIndex,
        lastSeen: new Date(),
      },
    })

    const nextItem = device.playlist.items[nextIndex]

    // Return the next media item
    return NextResponse.json({
      media: {
        ...nextItem.media,
        currentIndex: nextIndex + 1,
        totalItems: device.playlist.items.length,
      },
      playlist: {
        id: device.playlist.id,
        name: device.playlist.name,
      },
    })
  } catch (error) {
    console.error("Error getting next media:", error)
    return NextResponse.json({ error: "Failed to get next media" }, { status: 500 })
  }
}
