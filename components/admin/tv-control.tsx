"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Power,
  RefreshCw,
  Globe,
  Volume2,
  VolumeIcon as VolumeMute,
  Home,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import type { Device } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface TVControlProps {
  devices: Device[]
}

interface TVStatus {
  deviceId: string
  status: "connected" | "disconnected" | "checking" | "unknown"
  details?: {
    model?: string
    version?: string
    lastSeen?: string
  }
}

export default function TVControl({ devices }: TVControlProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [customUrl, setCustomUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [tvStatus, setTvStatus] = useState<TVStatus | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLaunchBrowser = async (deviceId: string, url?: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const targetUrl = url || window.location.origin
      const response = await fetch(`/api/tv/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId,
          action: "launchBrowser",
          url: targetUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send command to TV")
      }

      toast({
        title: "Command sent",
        description: data.message || "Browser launch command sent to TV",
      })
    } catch (error) {
      console.error("Error controlling TV:", error)
      const message = error instanceof Error ? error.message : "Failed to send command to TV"
      setErrorMessage(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTVCommand = async (deviceId: string, command: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/tv/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId,
          action: command,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send command to TV")
      }

      toast({
        title: "Command sent",
        description: data.message || `${command} command sent to TV`,
      })
    } catch (error) {
      console.error("Error controlling TV:", error)
      const message = error instanceof Error ? error.message : "Failed to send command to TV"
      setErrorMessage(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckTVStatus = async (deviceId: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    setTvStatus({
      deviceId,
      status: "checking",
    })

    try {
      const response = await fetch(`/api/tv/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check TV status")
      }

      setTvStatus({
        deviceId,
        status: data.status || "unknown",
        details: data.details,
      })

      toast({
        title: "TV Status",
        description: data.message || "TV status checked",
      })
    } catch (error) {
      console.error("Error checking TV status:", error)
      const message = error instanceof Error ? error.message : "Failed to check TV status"
      setErrorMessage(message)
      setTvStatus({
        deviceId,
        status: "unknown",
      })

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>TV Remote Control</CardTitle>
          <CardDescription>
            Control your Xiaomi Smart TVs remotely using ADB. Launch the browser, power on/off, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="device-select">Select Device</Label>
              <select
                id="device-select"
                value={selectedDeviceId}
                onChange={(e) => {
                  setSelectedDeviceId(e.target.value)
                  setTvStatus(null)
                  setErrorMessage(null)
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a device...</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.ipAddress})
                  </option>
                ))}
              </select>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {selectedDeviceId && (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{selectedDevice?.name}</h3>
                    {tvStatus && (
                      <Badge variant={tvStatus.status === "connected" ? "default" : "outline"}>
                        {tvStatus.status === "checking"
                          ? "Checking..."
                          : tvStatus.status === "connected"
                            ? "Connected"
                            : tvStatus.status === "disconnected"
                              ? "Disconnected"
                              : "Unknown"}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCheckTVStatus(selectedDeviceId)}
                    disabled={isLoading}
                  >
                    <RefreshCw size={14} className={`mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Check Status
                  </Button>
                </div>

                {tvStatus?.status === "connected" && tvStatus.details && (
                  <div className="bg-muted p-3 rounded-md text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-500" />
                      <span>Connected to TV</span>
                    </div>
                    {tvStatus.details.model && <p>Model: {tvStatus.details.model}</p>}
                    {tvStatus.details.version && <p>Android Version: {tvStatus.details.version}</p>}
                    {tvStatus.details.lastSeen && (
                      <p>Last Seen: {new Date(tvStatus.details.lastSeen).toLocaleString()}</p>
                    )}
                  </div>
                )}

                <Tabs defaultValue="browser" className="w-full">
                  <TabsList className="grid grid-cols-3">
                    <TabsTrigger value="browser">Browser Control</TabsTrigger>
                    <TabsTrigger value="power">Power & Volume</TabsTrigger>
                    <TabsTrigger value="navigation">Navigation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="browser" className="space-y-4 pt-4">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleLaunchBrowser(selectedDeviceId)}
                          disabled={isLoading || !selectedDeviceId}
                          className="flex items-center gap-2"
                        >
                          <Globe size={16} />
                          Launch Media Player
                        </Button>
                        <Button
                          onClick={() => handleTVCommand(selectedDeviceId, "refreshBrowser")}
                          disabled={isLoading || !selectedDeviceId}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <RefreshCw size={16} />
                          Refresh Browser
                        </Button>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="custom-url">Custom URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="custom-url"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="flex-1"
                          />
                          <Button
                            onClick={() => handleLaunchBrowser(selectedDeviceId, customUrl)}
                            disabled={isLoading || !selectedDeviceId || !customUrl}
                          >
                            Launch
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="power" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => handleTVCommand(selectedDeviceId, "powerOn")}
                        disabled={isLoading || !selectedDeviceId}
                        className="flex items-center gap-2"
                      >
                        <Power size={16} />
                        Power On
                      </Button>
                      <Button
                        onClick={() => handleTVCommand(selectedDeviceId, "powerOff")}
                        disabled={isLoading || !selectedDeviceId}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Power size={16} />
                        Power Off
                      </Button>

                      <Button
                        onClick={() => handleTVCommand(selectedDeviceId, "volumeUp")}
                        disabled={isLoading || !selectedDeviceId}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Volume2 size={16} />
                        Volume Up
                      </Button>
                      <Button
                        onClick={() => handleTVCommand(selectedDeviceId, "volumeDown")}
                        disabled={isLoading || !selectedDeviceId}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <VolumeMute size={16} />
                        Volume Down
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="navigation" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={() => handleTVCommand(selectedDeviceId, "home")}
                        disabled={isLoading || !selectedDeviceId}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Home size={16} />
                        Home
                      </Button>
                      <Button
                        onClick={() => handleTVCommand(selectedDeviceId, "back")}
                        disabled={isLoading || !selectedDeviceId}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft size={16} />
                        Back
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ADB Setup Instructions</CardTitle>
          <CardDescription>Follow these steps to enable ADB control of your Xiaomi Smart TV</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">On Your Server/PC</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-4">
              <li>Install ADB (Android Debug Bridge) on your server</li>
              <li>
                For Ubuntu/Debian: <code>sudo apt-get install android-tools-adb</code>
              </li>
              <li>
                For CentOS/RHEL: <code>sudo yum install android-tools</code>
              </li>
              <li>
                For Windows: Download and install{" "}
                <a
                  href="https://developer.android.com/tools/releases/platform-tools"
                  className="text-blue-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Android Platform Tools
                </a>
              </li>
              <li>
                Verify installation with: <code>adb version</code>
              </li>
              <li>Make sure ADB is in your system PATH so the application can access it</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">On Your Xiaomi Smart TV</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-4">
              <li>Go to Settings &gt; About &gt; Click on "Build Number" 7 times to enable Developer Options</li>
              <li>Go to Settings &gt; Developer Options &gt; Enable "USB Debugging" and "ADB over Network"</li>
              <li>Note your TV's IP address from Settings &gt; Network</li>
              <li>Add your TV to the admin panel with the correct IP address</li>
            </ol>
          </div>

          <div className="space-y-2 mt-4">
            <h3 className="font-semibold">Troubleshooting</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4">
              <li>If you can't connect to the TV, make sure it's on the same network as your server</li>
              <li>Check that the IP address is correct in the device settings</li>
              <li>
                Try manually connecting with: <code>adb connect TV_IP_ADDRESS:5555</code>
              </li>
              <li>
                Verify connection with: <code>adb devices</code>
              </li>
              <li>If connection fails, try restarting the TV and enabling ADB over Network again</li>
              <li>Check the logs folder in your application directory for detailed ADB command logs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
