import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const device = await db.device.findUnique({
      where: {
        id: params.id,
      },
      include: {
        playlist: true,
      },
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    return NextResponse.json(device)
  } catch (error) {
    console.error("Error fetching device:", error)
    return NextResponse.json({ error: "Failed to fetch device" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, ipAddress, defaultUrl, playlistId } = body

    if (!name || !ipAddress) {
      return NextResponse.json({ error: "Name and IP address are required" }, { status: 400 })
    }

    // Handle the playlistId properly
    // If playlistId is "none" or empty, set it to null
    const finalPlaylistId = playlistId && playlistId !== "none" ? playlistId : null

    // Validate that the playlist exists if a playlistId is provided
    if (finalPlaylistId) {
      const playlist = await db.playlist.findUnique({
        where: { id: finalPlaylistId },
      })

      if (!playlist) {
        return NextResponse.json({ error: "Selected playlist does not exist" }, { status: 400 })
      }
    }

    const device = await db.device.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        description,
        ipAddress,
        defaultUrl,
        playlistId: finalPlaylistId,
      },
    })

    return NextResponse.json(device)
  } catch (error) {
    console.error("Error updating device:", error)
    return NextResponse.json({ error: "Failed to update device" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await db.device.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting device:", error)
    return NextResponse.json({ error: "Failed to delete device" }, { status: 500 })
  }
}
