import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "downloads", "tv-helper-app.apk")

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Helper app not found" }, { status: 404 })
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": "attachment; filename=tv-helper-app.apk",
      },
    })
  } catch (error) {
    console.error("Error serving helper app:", error)
    return NextResponse.json({ error: "Failed to serve helper app" }, { status: 500 })
  }
}
