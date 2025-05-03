import { PrismaClient } from "@prisma/client"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)
const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Starting database migration...")

    // Run Prisma migration
    await execAsync("npx prisma migrate dev --name init")

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
