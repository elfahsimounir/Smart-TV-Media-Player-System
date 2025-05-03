import { type NextRequest, NextResponse } from "next/server"
import { createReadStream, statSync } from "fs"
import { join } from "path"
import { lookup } from "mime-types"
import { Readable } from "stream"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path || []
    const filePath = join(process.cwd(), "public", ...path)

    try {
      const stats = statSync(filePath)

      if (stats.isFile()) {
        const mimeType = lookup(filePath) || "application/octet-stream"

        // Create a readable stream from the file
        const fileStream = createReadStream(filePath)

        // Convert Node.js stream to Web stream
        const readableStream = Readable.toWeb(fileStream) as ReadableStream

        // Return the file as a streaming response with appropriate headers
        return new NextResponse(readableStream, {
          headers: {
            "Content-Type": mimeType,
            "Content-Length": String(stats.size),
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
          },
        })
      } else {
        return NextResponse.json({ message: "Not a file" }, { status: 404 })
      }
    } catch (error) {
      console.error("Error serving image:", error)
      return NextResponse.json({ message: "File not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Error in image API route:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
