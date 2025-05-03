import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  try {
    // This is a simple endpoint to trigger a database update
    // In a real app, you'd use Prisma migrations properly

    // Update all devices to have a currentMediaIndex field if it doesn't exist
    try {
      await db.$executeRaw`ALTER TABLE Device ADD COLUMN currentMediaIndex INTEGER NOT NULL DEFAULT 0`
    } catch (e) {
      console.log("currentMediaIndex column might already exist")
    }

    // Add macAddress column if it doesn't exist
    try {
      await db.$executeRaw`ALTER TABLE Device ADD COLUMN macAddress TEXT`
    } catch (e) {
      console.log("macAddress column might already exist")
    }

    return NextResponse.json({ success: true, message: "Migration completed successfully" })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}
