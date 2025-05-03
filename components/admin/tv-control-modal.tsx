"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface TVControlModalProps {
  device: Device
  open: boolean
  onOpenChange: (open: boolean) => void
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

export default function TVControlModal({ device, open, onOpenChange }: TVControlModalProps) {
  const [customUrl, setCustomUrl] = useState<string>(device.defaultUrl || "")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [tvStatus, setTvStatus] = useState<TVStatus | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPowerOn, setIsPowerOn] = useState<boolean>(false)

  // Initialize with device data
  useEffect(() => {
    if (device && open) {
      setCustomUrl(device.defaultUrl || "")
      handleCheckTVStatus()
    }
  }, [device, open])

  const handleLaunchBrowser = async (url?: string) => {
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
          deviceId: device.id,
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

  const handleTVCommand = async (command: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/tv/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: device.id,
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
          deviceId: device.id,
          action: "powerOn",
        }),
      })

      if (!powerResponse.ok) {
        const data = await powerResponse.json()
        throw new Error(data.error || "Failed to power on TV")
      }

      // Wait a moment for the TV to power on
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Then launch the browser with default URL
      const url = device.defaultUrl || window.location.origin
      const browserResponse = await fetch(`/api/tv/control`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: device.id,
          action: "launchBrowser",
          url,
        }),
      })

      if (!browserResponse.ok) {
        const data = await browserResponse.json()
        throw new Error(data.error || "Failed to launch browser")
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
    setIsLoading(true)
    setErrorMessage(null)
    setTvStatus({
      deviceId: device.id,
      status: "checking",
    })

    try {
      const response = await fetch(`/api/tv/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: device.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check TV status")
      }

      setTvStatus({
        deviceId: device.id,
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
        deviceId: device.id,
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
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await fetch(`/api/tv/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: device.id,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Control TV: {device.name}</DialogTitle>
          <DialogDescription>IP Address: {device.ipAddress}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
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
              >
                <PlayCircle size={14} className="mr-2" />
                Run
              </Button>
            </div>
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {tvStatus?.status === "connected" && tvStatus.details && (
            <div className="bg-muted p-3 rounded-md text-xs space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <span>Connected to TV</span>
              </div>
              {tvStatus.details.model && <p>Model: {tvStatus.details.model}</p>}
              {tvStatus.details.version && <p>Android Version: {tvStatus.details.version}</p>}
              {tvStatus.details.lastSeen && <p>Last Seen: {new Date(tvStatus.details.lastSeen).toLocaleString()}</p>}
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
                    onClick={() => handleLaunchBrowser(device.defaultUrl)}
                    disabled={isLoading || !device.defaultUrl}
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
