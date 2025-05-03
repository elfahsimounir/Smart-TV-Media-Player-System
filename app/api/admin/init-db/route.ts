import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST() {
  try {
    // Check if tables exist by trying to count records
    let tablesExist = true
    try {
      await db.device.count()
      await db.mediaItem.count()
      await db.playlist.count()
      await db.playlistItem.count()
    } catch (error) {
      tablesExist = false
    }

    if (tablesExist) {
      return NextResponse.json({
        success: true,
        message: "Database is already initialized",
        status: "exists",
      })
    }

    // Create tables using Prisma's raw query capabilities
    // This is a simplified approach - in production, use proper migrations
    await db.$executeRaw`
      CREATE TABLE IF NOT EXISTS "MediaItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "duration" INTEGER,
        "muted" BOOLEAN NOT NULL DEFAULT true,
        "fileSize" INTEGER,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "Playlist" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "PlaylistItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "order" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "playlistId" TEXT NOT NULL,
        "mediaId" TEXT NOT NULL,
        FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE,
        FOREIGN KEY ("mediaId") REFERENCES "MediaItem"("id") ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS "Device" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "ipAddress" TEXT NOT NULL UNIQUE,
        "defaultUrl" TEXT,
        "macAddress" TEXT,
        "lastSeen" DATETIME,
        "currentMediaIndex" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "playlistId" TEXT,
        FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id")
      );
    `

    return NextResponse.json({
      success: true,
      message: "Database initialized successfully",
      status: "created",
    })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize database",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
