import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import dgram from "dgram"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { deviceId } = body

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    // Get the device
    const device = await db.device.findUnique({
      where: { id: deviceId },
    })

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // For this example, we'll assume the MAC address is stored in a metadata field
    // In a real app, you'd add a macAddress field to your Device model
    const macAddress = device.macAddress || "00:00:00:00:00:00" // Default or placeholder

    // Send Wake-on-LAN packet
    await sendWakeOnLan(macAddress)

    return NextResponse.json({
      success: true,
      message: `Wake-on-LAN packet sent to ${device.name} (MAC: ${macAddress})`,
    })
  } catch (error) {
    console.error("Error sending Wake-on-LAN:", error)
    return NextResponse.json({ error: "Failed to send Wake-on-LAN packet" }, { status: 500 })
  }
}

// Function to send Wake-on-LAN packet
async function sendWakeOnLan(macAddress: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Parse MAC address
    const mac = macAddress
      .toLowerCase()
      .replace(/[^0-9a-f]/g, "")
      .match(/.{2}/g)

    if (!mac || mac.length !== 6) {
      reject(new Error("Invalid MAC address"))
      return
    }

    // Create magic packet
    const buffer = Buffer.alloc(102)

    // First 6 bytes of 0xFF
    for (let i = 0; i < 6; i++) {
      buffer.writeUInt8(0xff, i)
    }

    // Repeat MAC address 16 times
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 6; j++) {
        buffer.writeUInt8(Number.parseInt(mac[j], 16), 6 + i * 6 + j)
      }
    }

    // Create UDP socket
    const socket = dgram.createSocket("udp4")

    // Send packet
    socket.send(buffer, 0, buffer.length, 9, "255.255.255.255", (err) => {
      socket.close()

      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
