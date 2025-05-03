import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { isAdbInstalled, getAdbPath, executeAdbCommand } from "@/lib/adb-utils"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deviceId } = body

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    // Check if ADB is installed
    const adbInstalled = await isAdbInstalled()
    if (!adbInstalled) {
      return NextResponse.json(
        {
          error: "ADB is not installed on the server. Please install Android Debug Bridge to control TVs.",
          instructions:
            "For macOS: brew install android-platform-tools, For Ubuntu/Debian: sudo apt-get install android-tools-adb, For Windows: Download Android Platform Tools",
        },
        { status: 500 },
      )
    }

    // Get the device
    const device = await db.device.findUnique({
      where: { id: deviceId },
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    const ipAddress = device.ipAddress
    const adbPath = getAdbPath()

    // Try to connect to the device
    const connectCommand = `${adbPath} connect ${ipAddress}:5555`
    const { success, result, error } = await executeAdbCommand(connectCommand)

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to TV",
          details: error,
        },
        { status: 500 },
      )
    }

    // Check if connection was successful
    const stdout = result?.stdout || ""
    const isConnected = stdout.includes("connected") || stdout.includes("already")

    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to connect to TV. Make sure the TV is on and ADB over network is enabled.",
          details: stdout,
        },
        { status: 500 },
      )
    }

    // Update last seen timestamp for the device
    await db.device.update({
      where: { id: deviceId },
      data: { lastSeen: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully connected to ${device.name} (${ipAddress})`,
      details: stdout,
    })
  } catch (error) {
    console.error("Error connecting to TV:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to TV",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
