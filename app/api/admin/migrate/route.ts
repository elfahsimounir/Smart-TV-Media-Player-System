import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST() {
  try {
    console.log("Running database migration...")

    // Run Prisma migration
    const { stdout, stderr } = await execAsync("npx prisma migrate dev --name update_schema")

    // Generate Prisma client
    await execAsync("npx prisma generate")

    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully",
      details: { stdout, stderr },
    })
  } catch (error) {
    console.error("Migration failed:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database migration failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
