import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exec } from "child_process"
import util from "util"
import fs from "fs"
import path from "path"

// Convert exec to Promise-based
const execPromise = util.promisify(exec)

// Helper function to check if ADB is installed
async function isAdbInstalled() {
  try {
    // Try multiple possible ADB paths
    const possiblePaths = [
      "adb", // Default PATH
      "/opt/homebrew/bin/adb", // macOS Homebrew (Apple Silicon)
      "/usr/local/bin/adb", // macOS Homebrew (Intel)
      "/usr/bin/adb", // Linux
      "C:\\platform-tools\\adb.exe", // Windows
    ]

    // Try each path
    for (const adbPath of possiblePaths) {
      try {
        await execPromise(`${adbPath} version`)
        console.log(`ADB found at: ${adbPath}`)
        // If successful, store the working path for future use
        global.adbPath = adbPath
        return true
      } catch (error) {
        // Continue to next path
        console.log(`ADB not found at: ${adbPath}`)
      }
    }

    // If we get here, none of the paths worked
    return false
  } catch (error) {
    console.error("Error checking ADB installation:", error)
    return false
  }
}

// Helper function to get the ADB path
function getAdbPath() {
  return global.adbPath || "adb"
}

// Helper function to log ADB commands and results
async function logAdbCommand(command: string, result: any, error?: any) {
  const logDir = path.join(process.cwd(), "logs")
  const logFile = path.join(logDir, "adb-status.log")

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] Command: ${command}\nResult: ${JSON.stringify(result)}\n${error ? `Error: ${JSON.stringify(error)}\n` : ""}\n`

  fs.appendFileSync(logFile, logEntry)
}

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

    try {
      // Try to connect to the device
      const connectCommand = `${adbPath} connect ${ipAddress}:5555`
      const connectResult = await execPromise(connectCommand)
      await logAdbCommand(connectCommand, connectResult)

      // Check if connection was successful
      if (!connectResult.stdout.includes("connected") && !connectResult.stdout.includes("already")) {
        return NextResponse.json({
          success: false,
          status: "disconnected",
          message: `Failed to connect to ${device.name}. Make sure the TV is on and ADB over network is enabled.`,
          details: connectResult,
        })
      }

      // Check if device is connected
      const devicesCommand = `${adbPath} devices`
      const { stdout } = await execPromise(devicesCommand)
      await logAdbCommand(devicesCommand, { stdout })

      if (stdout.includes(`${ipAddress}:5555`)) {
        try {
          // Get device info
          const deviceInfoCommand = `${adbPath} -s ${ipAddress}:5555 shell getprop`
          const { stdout: deviceInfo } = await execPromise(deviceInfoCommand)
          await logAdbCommand(deviceInfoCommand, { stdout: deviceInfo.substring(0, 500) + "..." }) // Log truncated output

          // Extract model info
          const modelMatch = deviceInfo.match(/ro\.product\.model=\[(.*?)\]/)
          const model = modelMatch ? modelMatch[1] : "Unknown"

          // Extract Android version
          const versionMatch = deviceInfo.match(/ro\.build\.version\.release=\[(.*?)\]/)
          const version = versionMatch ? versionMatch[1] : "Unknown"

          // Update last seen timestamp for the device
          await db.device.update({
            where: { id: deviceId },
            data: { lastSeen: new Date() },
          })

          return NextResponse.json({
            success: true,
            status: "connected",
            message: `TV is connected: ${model} running Android ${version}`,
            details: {
              model,
              version,
              ipAddress,
              lastSeen: new Date().toISOString(),
            },
          })
        } catch (error) {
          // Even if we can't get detailed info, the device is connected
          await logAdbCommand(`${adbPath} -s ${ipAddress}:5555 shell getprop`, null, error)

          // Update last seen timestamp for the device
          await db.device.update({
            where: { id: deviceId },
            data: { lastSeen: new Date() },
          })

          return NextResponse.json({
            success: true,
            status: "connected",
            message: `TV is connected but couldn't retrieve detailed information`,
            details: {
              ipAddress,
              lastSeen: new Date().toISOString(),
            },
          })
        }
      } else {
        return NextResponse.json({
          success: false,
          status: "disconnected",
          message: `TV is not connected or ADB is not enabled on ${device.name}`,
        })
      }
    } catch (error) {
      await logAdbCommand(`adb operations`, null, error)
      return NextResponse.json({
        success: false,
        status: "error",
        message: `Failed to check status of ${device.name}. Make sure ADB is installed on the server.`,
        error: error,
      })
    }
  } catch (error) {
    console.error("Error checking TV status:", error)
    return NextResponse.json({ error: "Failed to check TV status", details: error }, { status: 500 })
  }
}
