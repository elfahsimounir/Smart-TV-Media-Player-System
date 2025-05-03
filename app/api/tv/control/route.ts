import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { isAdbInstalled, getAdbPath, logAdbCommand, executeCommandWithEnv } from "@/lib/adb-utils"
import { exec } from "child_process"
import util from "util"

// Convert exec to Promise-based
const execPromise = util.promisify(exec)

// Helper function to check if ADB is installed
// async function isAdbInstalled() {
//   try {
//     // Try multiple possible ADB paths
//     const possiblePaths = [
//       "adb", // Default PATH
//       "/opt/homebrew/bin/adb", // macOS Homebrew (Apple Silicon)
//       "/usr/local/bin/adb", // macOS Homebrew (Intel)
//       "/usr/bin/adb", // Linux
//       "C:\\platform-tools\\adb.exe", // Windows
//     ]

//     // Try each path
//     for (const adbPath of possiblePaths) {
//       try {
//         await execPromise(`${adbPath} version`)
//         console.log(`ADB found at: ${adbPath}`)
//         // If successful, store the working path for future use
//         global.adbPath = adbPath
//         return true
//       } catch (error) {
//         // Continue to next path
//         console.log(`ADB not found at: ${adbPath}`)
//       }
//     }

//     // If we get here, none of the paths worked
//     return false
//   } catch (error) {
//     console.error("Error checking ADB installation:", error)
//     return false
//   }
// }

// Helper function to get the ADB path
// function getAdbPath() {
//   return global.adbPath || "adb"
// }

// Helper function to log ADB commands and results
// async function logAdbCommand(command: string, result: any, error?: any) {
//   const logDir = path.join(process.cwd(), "logs")
//   const logFile = path.join(logDir, "adb-commands.log")

//   // Create logs directory if it doesn't exist
//   if (!fs.existsSync(logDir)) {
//     fs.mkdirSync(logDir, { recursive: true })
//   }

//   const timestamp = new Date().toISOString()
//   const logEntry = `[${timestamp}] Command: ${command}\nResult: ${JSON.stringify(result)}\n${error ? `Error: ${JSON.stringify(error)}\n` : ""}\n`

//   fs.appendFileSync(logFile, logEntry)
// }

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deviceId, action, url } = body

    if (!deviceId || !action) {
      return NextResponse.json({ error: "Device ID and action are required" }, { status: 400 })
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
    const device:any = await db.device.findUnique({
      where: { id: deviceId },
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    const ipAddress = device.ipAddress
    const adbPath = getAdbPath()

    // Try to connect to the device first
    try {
      const connectCommand = `${adbPath} connect ${ipAddress}:5555`
      const connectResult = await execPromise(connectCommand)
      await logAdbCommand(connectCommand, connectResult)

      // Check if connection was successful
      if (!connectResult.stdout.includes("connected") && !connectResult.stdout.includes("already")) {
        return NextResponse.json(
          {
            error: "Failed to connect to TV. Make sure the TV is on and ADB over network is enabled.",
            details: connectResult,
          },
          { status: 500 },
        )
      }
    } catch (error) {
      await logAdbCommand(`${adbPath} connect ${ipAddress}:5555`, null, error)
      return NextResponse.json(
        {
          error: "Failed to connect to TV. Make sure the TV is on and ADB over network is enabled.",
          details: error,
        },
        { status: 500 },
      )
    }

    // Handle different actions
    switch (action) {
      case "launchBrowser": {
        if (!url) {
          return NextResponse.json({ error: "URL is required for launchBrowser action" }, { status: 400 })
        }

        try {
          // Use the full path to ADB that we know works
          const fullAdbPath = getAdbPath()
          console.log(`Using ADB path: ${fullAdbPath}`)
          console.log(`Attempting to launch browser on ${ipAddress} with URL: ${url}`)

          // Use the exact command format that worked manually
          const launchCommand = `${fullAdbPath} -s ${ipAddress}:5555 shell am start -a android.intent.action.VIEW -d "${url}"`
          console.log(`Executing command: ${launchCommand}`)

          // Execute the command and log the result
          const launchResult = await execPromise(launchCommand)
          await logAdbCommand(launchCommand, launchResult)

          console.log("Command output:", launchResult.stdout)
          console.log("Command error (if any):", launchResult.stderr)

          // Update last seen timestamp for the device
          await db.device.update({
            where: { id: deviceId },
            data: { lastSeen: new Date() },
          })

          return NextResponse.json({
            success: true,
            message: `Browser launched on ${device.name} with URL: ${url}`,
            details: launchResult,
          })
        } catch (error) {
          console.error("Error launching browser:", error)
          await logAdbCommand(`Browser launch error`, null, error)

          // Try with the exact command that worked for the user
          try {
            console.log("Trying with exact command format that worked manually...")
            const manualCommand = `${getAdbPath()} -s ${ipAddress}:5555 shell am start -a android.intent.action.VIEW -d "${url}"`
            const manualResult = await execPromise(manualCommand)
            await logAdbCommand(manualCommand, manualResult)

            // Update last seen timestamp for the device
            await db.device.update({
              where: { id: deviceId },
              data: { lastSeen: new Date() },
            })

            return NextResponse.json({
              success: true,
              message: `Browser launched on ${device.name} with URL: ${url} (fallback method)`,
              details: manualResult,
            })
          } catch (fallbackError) {
            console.error("Fallback method also failed:", fallbackError)
            await logAdbCommand(`Fallback browser launch error`, null, fallbackError)

            return NextResponse.json(
              {
                error: "Failed to launch browser. See server logs for details.",
                details: {
                  originalError: error,
                  fallbackError: fallbackError,
                },
              },
              { status: 500 },
            )
          }
        }

        // Try with our enhanced environment execution method
        try {
          console.log("Trying with enhanced environment execution...")
          const enhancedCommand = `${getAdbPath()} -s ${ipAddress}:5555 shell am start -a android.intent.action.VIEW -d "${url}"`
          const { success, result, error } = await executeCommandWithEnv(enhancedCommand)

          if (success && result) {
            await logAdbCommand(enhancedCommand, result)

            // Update last seen timestamp for the device
            await db.device.update({
              where: { id: deviceId },
              data: { lastSeen: new Date() },
            })

            return NextResponse.json({
              success: true,
              message: `Browser launched on ${device.name} with URL: ${url} (enhanced method)`,
              details: result,
            })
          } else {
            throw new Error("Enhanced execution method failed")
          }
        } catch (enhancedError) {
          console.error("Enhanced method failed:", enhancedError)
          // Continue to other fallback methods...
        }
      }

      case "refreshBrowser": {
        try {
          // Try different refresh methods - some TVs respond to different keycodes
          const refreshCommands = [
            `${adbPath} -s ${ipAddress}:5555 shell input keyevent 82`, // KEYCODE_MENU (sometimes used for refresh)
            `${adbPath} -s ${ipAddress}:5555 shell input keyevent 61`, // KEYCODE_TAB (can trigger refresh in some browsers)
          ]

          // Try each command in sequence
          for (const cmd of refreshCommands) {
            try {
              const result = await execPromise(cmd)
              await logAdbCommand(cmd, result)
            } catch (error) {
              await logAdbCommand(cmd, null, error)
              // Continue to next command even if this one fails
            }
          }

          // Update last seen timestamp for the device
          await db.device.update({
            where: { id: deviceId },
            data: { lastSeen: new Date() },
          })

          return NextResponse.json({
            success: true,
            message: `Browser refresh commands sent to ${device.name}`,
          })
        } catch (error) {
          return NextResponse.json(
            {
              error: "Failed to refresh browser",
              details: error,
            },
            { status: 500 },
          )
        }
      }
      case "powerOn":
      case "powerOff": {
        try {
          // Send power toggle command (same for on/off)
          const powerCommand = `${adbPath} -s ${ipAddress}:5555 shell input keyevent 26`
          const powerResult = await execPromise(powerCommand)
          await logAdbCommand(powerCommand, powerResult)

          // Update last seen timestamp for the device
          await db.device.update({
            where: { id: deviceId },
            data: { lastSeen: new Date() },
          })

          return NextResponse.json({
            success: true,
            message: `Power ${action === "powerOn" ? "on" : "off"} command sent to ${device.name}`,
          })
        } catch (error) {
          await logAdbCommand(`${adbPath} -s ${ipAddress}:5555 shell input keyevent 26`, null, error)
          return NextResponse.json(
            {
              error: `Failed to power ${action === "powerOn" ? "on" : "off"} TV`,
              details: error,
            },
            { status: 500 },
          )
        }
      }

      case "menu": {
        try {
          // Send menu button command
          const menuCommand = `${adbPath} -s ${ipAddress}:5555 shell input keyevent 82`
          const menuResult = await execPromise(menuCommand)
          await logAdbCommand(menuCommand, menuResult)

          // Update last seen timestamp for the device
          await db.device.update({
            where: { id: deviceId },
            data: { lastSeen: new Date() },
          })

          return NextResponse.json({
            success: true,
            message: `Menu button command sent to ${device.name}`,
          })
        } catch (error) {
          await logAdbCommand(`${adbPath} -s ${ipAddress}:5555 shell input keyevent 82`, null, error)
          return NextResponse.json(
            {
              error: "Failed to send menu button command",
              details: error,
            },
            { status: 500 },
          )
        }
      }

      case "home": {
        try {
          // Send home button command
          const homeCommand = `${adbPath} -s ${ipAddress}:5555 shell input keyevent 3`
          const homeResult = await execPromise(homeCommand)
          await logAdbCommand(homeCommand, homeResult)

          // Update last seen timestamp for the device
          await db.device.update({
            where: { id: deviceId },
            data: { lastSeen: new Date() },
          })

          return NextResponse.json({
            success: true,
            message: `Home button command sent to ${device.name}`,
          })
        } catch (error) {
          await logAdbCommand(`${adbPath} -s ${ipAddress}:5555 shell input keyevent 3`, null, error)
          return NextResponse.json(
            {
              error: "Failed to send home button command",
              details: error,
            },
            { status: 500 },
          )
        }
      }

      case "back": {
        try {
          // Send back button command
          const backCommand = `${adbPath} -s ${ipAddress}:5555 shell input keyevent 4`
          const backResult = await execPromise(backCommand)
          await logAdbCommand(backCommand, backResult)

          // Update last seen timestamp for the device
          await db.device.update({
            where: { id: deviceId },
            data: { lastSeen: new Date() },
          })

          return NextResponse.json({
            success: true,
            message: `Back button command sent to ${device.name}`,
          })
        } catch (error) {
          await logAdbCommand(`${adbPath} -s ${ipAddress}:5555 shell input keyevent 4`, null, error)
          return NextResponse.json(
            {
              error: "Failed to send back button command",
              details: error,
            },
            { status: 500 },
          )
        }
      }

      case "volumeUp": {
        try {
          // Send volume up command
          const volumeUpCommand = `${adbPath} -s ${ipAddress}:5555 shell input keyevent 24`
          const volumeUpResult = await execPromise(volumeUpCommand)
          await logAdbCommand(volumeUpCommand, volumeUpResult)

          // Update last seen timestamp for the device
          await db.device.update({
            where: { id: deviceId },
            data: { lastSeen: new Date() },
          })

          return NextResponse.json({
            success: true,
            message: `Volume up command sent to ${device.name}`,
          })
        } catch (error) {
          await logAdbCommand(`${adbPath} -s ${ipAddress}:5555 shell input keyevent 24`, null, error)
          return NextResponse.json(
            {
              error: "Failed to increase volume",
              details: error,
            },
            { status: 500 },
          )
        }
      }

      case "volumeDown": {
        try {
          // Send volume down command
          const volumeDownCommand = `${adbPath} -s ${ipAddress}:5555 shell input keyevent 25`
          const volumeDownResult = await execPromise(volumeDownCommand)
          await logAdbCommand(volumeDownCommand, volumeDownResult)

          // Update last seen timestamp for the device
          await db.device.update({
            where: { id: deviceId },
            data: { lastSeen: new Date() },
          })

          return NextResponse.json({
            success: true,
            message: `Volume down command sent to ${device.name}`,
          })
        } catch (error) {
          await logAdbCommand(`${adbPath} -s ${ipAddress}:5555 shell input keyevent 25`, null, error)
          return NextResponse.json(
            {
              error: "Failed to decrease volume",
              details: error,
            },
            { status: 500 },
          )
        }
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error("Error controlling TV:", error)
    return NextResponse.json({ error: "Failed to control TV", details: error }, { status: 500 })
  }
}
