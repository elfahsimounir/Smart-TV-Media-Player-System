import { db } from "@/lib/db"
import { getClientIp } from "@/lib/ip-utils"
import MediaPlayer from "@/components/media-player"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Monitor, AlertTriangle, ArrowRight } from "lucide-react"

export const metadata = {
  title: "Smart TV Media Player",
  description: "A media player system for smart TVs",
}

export default async function Home() {
  // Properly await the getClientIp function
  const ip = await getClientIp()

  // Check if this IP is registered as a device
  const device = await db.device.findFirst({
    where: { ipAddress: ip.replace("::ffff:", "") },
  })

  // If not a registered device, show a well-designed message
  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm p-8 rounded-lg border border-gray-700 shadow-xl">
          <div className="flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>

          <h1 className="text-2xl font-bold mb-4 text-center">Device Not Registered</h1>

          <div className="space-y-4">
            <p className="text-gray-300 text-center">This device is not registered in the media player system.</p>

            <div className="bg-gray-700/50 p-3 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <Monitor className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-300">IP Address:</span>
              </div>
              <code className="text-sm bg-gray-800 px-2 py-1 rounded">{ip}</code>
            </div>

            <p className="text-sm text-gray-400 text-center">
              To use this device for media playback, please register it in the admin panel.
            </p>
          </div>

          <div className="mt-8">
            <Link href="/admin/devices">
              <Button className="w-full group">
                Go to Admin Panel
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-500">Smart TV Media Player System</p>
      </div>
    )
  }

  // If it's a registered device, show the media player
  return <MediaPlayer deviceId={device.id} />
}
