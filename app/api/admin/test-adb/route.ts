import { NextResponse } from "next/server"
import { isAdbInstalled, getAdbPath, executeAdbCommand } from "@/lib/adb-utils"
import { exec } from "child_process"
import util from "util"

const execPromise = util.promisify(exec)

export async function GET() {
  try {
    // Check if ADB is installed
    const adbInstalled = await isAdbInstalled()

    if (!adbInstalled) {
      return NextResponse.json({
        success: false,
        message: "ADB is not installed or not found in PATH",
        possibleSolutions: [
          "Install ADB using 'brew install android-platform-tools' on macOS",
          "Make sure ADB is in your system PATH",
          "Restart your server after installing ADB",
        ],
      })
    }

    // Get ADB path
    const adbPath = getAdbPath()

    // Get ADB version
    const { result: versionResult } = await executeAdbCommand(`${adbPath} version`, "adb-test.log")

    // List connected devices
    const { result: devicesResult } = await executeAdbCommand(`${adbPath} devices`, "adb-test.log")

    // Get environment info
    const { stdout: envOutput } = await execPromise("env")

    // Get current working directory
    const { stdout: cwdOutput } = await execPromise("pwd")

    return NextResponse.json({
      success: true,
      adbInstalled,
      adbPath,
      version: versionResult?.stdout,
      devices: devicesResult?.stdout,
      environment: {
        PATH: process.env.PATH,
        cwd: cwdOutput.trim(),
      },
    })
  } catch (error) {
    console.error("Error testing ADB:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Error testing ADB",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
