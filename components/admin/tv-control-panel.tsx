"use client"

import { useState, useEffect } from "react"
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
  Menu,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
} from "lucide-react"
import type { Device } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter, useSearchParams } from "next/navigation"

interface TVControlPanelProps {
  devices: Device[]
  initialSelectedDeviceId?: string
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

export default function TVControlPanel({ devices, initialSelectedDeviceId = "" }: TVControlPanelProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(initialSelectedDeviceId)
  const [customUrl, setCustomUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [tvStatus, setTvStatus] = useState<TVStatus | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPowerOn, setIsPowerOn] = useState<boolean>(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Set the selected device ID from the URL parameter
  useEffect(() => {
    if (initialSelectedDeviceId) {
      setSelectedDeviceId(initialSelectedDeviceId)

      // If we have a selected device, set its default URL if available
      const device = devices.find((d) => d.id === initialSelectedDeviceId)
      if (device?.defaultUrl) {
        setCustomUrl(device.defaultUrl)
      }

      // Check the status of the selected device
      if (initialSelectedDeviceId) {
        handleCheckTVStatus()
      }
    }
  }, [initialSelectedDeviceId, devices])

  const handleLaunchBrowser = async (url?: string) => {
    if (!selectedDeviceId) return

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const targetUrl = url || window.location.origin
      console.log(`Launching browser with URL: ${targetUrl}`)

      const response = await fetch(`/api/tv/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          action: "launchBrowser",
          url: targetUrl,
        }),
      })

      const data = await response.json()
      console.log("Browser launch response:", data)

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

  const handleTVCommand = async (command: string) => {
    if (!selectedDeviceId) return

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/tv/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          action: command,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send command")
      }

      // Update power state if this was a power command
      if (command === "powerOn") {
        setIsPowerOn(true)
      } else if (command === "powerOff") {
        setIsPowerOn(false)
      }

      toast({
        title: "Command sent",
        description: data.message || `${command} command sent to TV`,
      })
    } catch (error) {
      console.error("Error controlling TV:", error)
      const message = error instanceof Error ? error.message : "Failed to send command"
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

  const handleTogglePower = () => {
    handleTVCommand(isPowerOn ? "powerOff" : "powerOn")
  }

  const handleRunTV = async () => {
    if (!selectedDeviceId) return

    setIsLoading(true)
    setErrorMessage(null)
    try {
      // First power on the TV
      const powerResponse = await fetch(`/api/tv/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          action: "powerOn",
        }),
      })

      if (!powerResponse.ok) {
        const data = await powerResponse.json()
        throw new Error(data.error || "Failed to power on TV")
      }

      // Wait a moment for the TV to power on
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Then launch the browser with default URL
      const selectedDevice = devices.find((d) => d.id === selectedDeviceId)
      const url = selectedDevice?.defaultUrl || window.location.origin

      console.log(`Launching browser with URL: ${url}`)

      const browserResponse = await fetch(`/api/tv/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: selectedDeviceId,
          action: "launchBrowser",
          url,
        }),
      })

      const browserData = await browserResponse.json()
      console.log("Browser launch response:", browserData)

      if (!browserResponse.ok) {
        throw new Error(browserData.error || "Failed to launch browser")
      }

      setIsPowerOn(true)
      toast({
        title: "TV Started",
        description: `TV powered on and browser launched with ${url}`,
      })
    } catch (error) {
      console.error("Error running TV:", error)
      const message = error instanceof Error ? error.message : "Failed to run TV"
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

  const handleCheckTVStatus = async () => {
    if (!selectedDeviceId) return

    setIsLoading(true)
    setErrorMessage(null)
    setTvStatus({
      deviceId: selectedDeviceId,
      status: "checking",
    })

    try {
      const response = await fetch(`/api/tv/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: selectedDeviceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check TV status")
      }

      setTvStatus({
        deviceId: selectedDeviceId,
        status: data.status || "unknown",
        details: data.details,
      })

      // If we got a successful connection, assume the TV is on
      if (data.status === "connected") {
        setIsPowerOn(true)
      }

      toast({
        title: "TV Status",
        description: data.message || "TV status checked",
        variant: data.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error checking TV status:", error)
      const message = error instanceof Error ? error.message : "Failed to check TV status"
      setErrorMessage(message)
      setTvStatus({
        deviceId: selectedDeviceId,
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

  const handleConnectToTV = async () => {
    if (!selectedDeviceId) return

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/tv/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: selectedDeviceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect to TV")
      }

      toast({
        title: "Connection Successful",
        description: data.message || "Successfully connected to TV",
      })

      // After connecting, check the status
      handleCheckTVStatus()
    } catch (error) {
      console.error("Error connecting to TV:", error)
      const message = error instanceof Error ? error.message : "Failed to connect to TV"
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

  // Update URL when device selection changes
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    setTvStatus(null)
    setErrorMessage(null)

    // Set custom URL to the device's default URL if available
    const device = devices.find((d) => d.id === deviceId)
    if (device?.defaultUrl) {
      setCustomUrl(device.defaultUrl)
    } else {
      setCustomUrl("")
    }

    // Update the URL to include the selected device ID
    if (deviceId) {
      router.push(`/admin/tv-control?deviceId=${deviceId}`)
    } else {
      router.push("/admin/tv-control")
    }
  }

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>TV Remote Control</CardTitle>
          <CardDescription>
            Control your Smart TVs remotely using ADB. Launch the browser, power on/off, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="device-select">Select Device</Label>
              <select
                id="device-select"
                value={selectedDeviceId}
                onChange={(e) => handleDeviceChange(e.target.value)}
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
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCheckTVStatus} disabled={isLoading}>
                      <RefreshCw size={14} className={`mr-2 ${isLoading ? "animate-spin" : ""}`} />
                      Check Status
                    </Button>
                    <Button variant="default" size="sm" onClick={handleConnectToTV} disabled={isLoading}>
                      <Globe size={14} className="mr-2" />
                      Connect
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleRunTV}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                      data-run-button="true"
                    >
                      <PlayCircle size={14} className="mr-2" />
                      Run
                    </Button>
                  </div>
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
                      <div className="grid gap-2">
                        <Label htmlFor="custom-url">URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="custom-url"
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="flex-1"
                          />
                          <Button onClick={() => handleLaunchBrowser(customUrl)} disabled={isLoading || !customUrl}>
                            <Globe size={16} className="mr-2" />
                            Open
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => handleLaunchBrowser(selectedDevice?.defaultUrl || undefined)}
                          disabled={isLoading || !selectedDevice?.defaultUrl}
                          className="flex items-center gap-2"
                        >
                          <Globe size={16} />
                          Open Default URL
                        </Button>
                        <Button
                          onClick={() => handleTVCommand("refreshBrowser")}
                          disabled={isLoading}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <RefreshCw size={16} />
                          Refresh Browser
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="power" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        onClick={handleTogglePower}
                        disabled={isLoading}
                        className={`flex items-center gap-2 ${isPowerOn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                      >
                        <Power size={16} />
                        {isPowerOn ? "Power Off" : "Power On"}
                      </Button>

                      <Button
                        onClick={() => handleTVCommand("volumeUp")}
                        disabled={isLoading}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Volume2 size={16} />
                        Volume Up
                      </Button>
                      <Button
                        onClick={() => handleTVCommand("volumeDown")}
                        disabled={isLoading}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <VolumeMute size={16} />
                        Volume Down
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="navigation" className="space-y-4 pt-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        onClick={() => handleTVCommand("home")}
                        disabled={isLoading}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Home size={16} />
                        Home
                      </Button>
                      <Button
                        onClick={() => handleTVCommand("back")}
                        disabled={isLoading}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft size={16} />
                        Back
                      </Button>
                      <Button
                        onClick={() => handleTVCommand("menu")}
                        disabled={isLoading}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Menu size={16} />
                        Menu
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* <Card>
        <CardHeader>
          <CardTitle>ADB Setup Instructions</CardTitle>
          <CardDescription>Follow these steps to enable ADB control of your Smart TV</CardDescription>
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
            <h3 className="font-semibold">On Your Smart TV</h3>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 pl-4">
              <li>Go to Settings &gt; About &gt; Click on "Build Number" 7 times to enable Developer Options</li>
              <li>Go to Settings &gt; Developer Options &gt; Enable "USB Debugging" and "ADB over Network"</li>
              <li>Note your TV's IP address from Settings &gt; Network</li>
              <li>Add your TV to the admin panel with the correct IP address</li>
            </ol>
          </div>

          <div className="space-y-2 mt-4">
            <h3 className="font-semibold">ADB Commands Reference</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4">
              <li>
                <code>adb connect IP_ADDRESS:5555</code> - Connect to the TV
              </li>
              <li>
                <code>adb -s IP_ADDRESS:5555 shell input keyevent 26</code> - Power on/off
              </li>
              <li>
                <code>adb -s IP_ADDRESS:5555 shell input keyevent 82</code> - Menu button
              </li>
              <li>
                <code>adb -s IP_ADDRESS:5555 shell input keyevent 3</code> - Home button
              </li>
              <li>
                <code>adb -s IP_ADDRESS:5555 shell am start -a android.intent.action.VIEW -d "URL"</code> - Open URL in
                browser
              </li>
            </ul>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
