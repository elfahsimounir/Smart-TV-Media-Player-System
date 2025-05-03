import { exec } from "child_process"
import util from "util"
import fs from "fs"
import path from "path"

// Convert exec to Promise-based
const execPromise = util.promisify(exec)

// Helper function to check if ADB is installed
export async function isAdbInstalled() {
  try {
    // Try multiple possible ADB paths
    const possiblePaths = [
      "/opt/homebrew/bin/adb", // macOS Homebrew (Apple Silicon) - Move this to the top
      "adb", // Default PATH
      "/usr/local/bin/adb", // macOS Homebrew (Intel)
      "/usr/bin/adb", // Linux
      "C:\\platform-tools\\adb.exe", // Windows
    ]

    // Try each path
    for (const adbPath of possiblePaths) {
      try {
        const { stdout } = await execPromise(`${adbPath} version`)
        console.log(`ADB found at: ${adbPath}`)
        console.log(`ADB version: ${stdout.trim()}`)

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
export function getAdbPath() {
  return global.adbPath || "adb"
}

// Helper function to log ADB commands and results
export async function logAdbCommand(command: string, result: any, error?: any, logFileName = "adb-commands.log") {
  const logDir = path.join(process.cwd(), "logs")
  const logFile = path.join(logDir, logFileName)

  // Create logs directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] Command: ${command}\nResult: ${JSON.stringify(result)}\n${error ? `Error: ${JSON.stringify(error)}\n` : ""}\n`

  fs.appendFileSync(logFile, logEntry)
}

// Execute command with proper environment variables
export async function executeCommandWithEnv(command: string) {
  try {
    // Get the current PATH environment variable
    const currentPath = process.env.PATH || ""

    // Add common ADB locations to the PATH
    const enhancedPath = [
      "/opt/homebrew/bin", // macOS Homebrew (Apple Silicon)
      "/usr/local/bin", // macOS Homebrew (Intel)
      "/usr/bin", // Linux
      process.env.HOME + "/Library/Android/sdk/platform-tools", // macOS Android SDK
      "C:\\platform-tools", // Windows
      currentPath,
    ].join(":")

    // Execute the command with the enhanced PATH
    const result = await execPromise(command, {
      env: {
        ...process.env,
        PATH: enhancedPath,
      },
      shell: true,
    })

    return { success: true, result }
  } catch (error) {
    console.error("Command execution error:", error)
    return { success: false, error }
  }
}

// Execute ADB command with proper error handling
export async function executeAdbCommand(command: string, logFileName = "adb-commands.log") {
  try {
    const { success, result, error } = await executeCommandWithEnv(command)

    if (success && result) {
      await logAdbCommand(command, result, null, logFileName)
      return { success: true, result }
    } else {
      await logAdbCommand(command, null, error, logFileName)
      return { success: false, error }
    }
  } catch (error) {
    await logAdbCommand(command, null, error, logFileName)
    return { success: false, error }
  }
}

// Check ADB connection to a device
export async function checkAdbConnection(ipAddress: string) {
  const adbPath = getAdbPath()
  const connectCommand = `${adbPath} connect ${ipAddress}:5555`

  try {
    const { stdout } = await execPromise(connectCommand)
    await logAdbCommand(connectCommand, { stdout }, null, "adb-connection.log")

    if (stdout.includes("connected") || stdout.includes("already")) {
      return { success: true, message: stdout }
    } else {
      return { success: false, message: stdout }
    }
  } catch (error) {
    await logAdbCommand(connectCommand, null, error, "adb-connection.log")
    return { success: false, error }
  }
}
