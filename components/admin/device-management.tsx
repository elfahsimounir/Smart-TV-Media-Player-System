"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Pencil, Trash, Plus, Globe, Power, RefreshCw } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Device, Playlist } from "@prisma/client"

interface DeviceManagementProps {
  initialDevices?: Device[]
  initialPlaylists?: Playlist[]
}

export default function DeviceManagement({ initialDevices = [], initialPlaylists = [] }: DeviceManagementProps) {
  const [devices, setDevices] = useState<Device[]>(initialDevices)
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [isControlDialogOpen, setIsControlDialogOpen] = useState(false)
  const [customUrl, setCustomUrl] = useState("")

  const [newDevice, setNewDevice] = useState({
    name: "",
    description: "",
    ipAddress: "",
    defaultUrl: "",
    playlistId: "",
  })

  const [editDevice, setEditDevice] = useState({
    id: "",
    name: "",
    description: "",
    ipAddress: "",
    defaultUrl: "",
    playlistId: "",
  })

  // Fetch devices and playlists if not provided as props
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Always fetch devices in production to ensure we have the latest data
        const res = await fetch("/api/devices", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setDevices(data)
        }
      } catch (error) {
        console.error("Error fetching devices:", error)
      }

      try {
        // Always fetch playlists in production to ensure we have the latest data
        const res = await fetch("/api/playlists", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setPlaylists(data)
        }
      } catch (error) {
        console.error("Error fetching playlists:", error)
      }
    }

    // Fetch data on component mount
    fetchData()

    // Set up a refresh interval to keep data fresh
    const intervalId = setInterval(fetchData, 60000) // Refresh every minute

    return () => clearInterval(intervalId)
  }, [])

  const handleAddDevice = async () => {
    setIsLoading(true)
    try {
      // Process the playlistId before sending
      const processedPlaylistId = newDevice.playlistId === "none" ? null : newDevice.playlistId

      const response = await fetch("/api/devices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newDevice,
          playlistId: processedPlaylistId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add device")
      }

      const addedDevice = await response.json()
      setDevices((prev) => [...prev, addedDevice])

      toast({
        title: "Device added",
        description: "The device has been added successfully.",
      })

      setIsAddDialogOpen(false)
      setNewDevice({
        name: "",
        description: "",
        ipAddress: "",
        defaultUrl: "",
        playlistId: "",
      })
    } catch (error) {
      console.error("Error adding device:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add device. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleEditDevice function to properly handle the playlistId

  const handleEditDevice = async () => {
    setIsLoading(true)
    try {
      // Process the playlistId before sending
      const processedPlaylistId = editDevice.playlistId === "none" ? null : editDevice.playlistId

      const response = await fetch(`/api/devices/${editDevice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editDevice,
          playlistId: processedPlaylistId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update device")
      }

      const updatedDevice = await response.json()
      setDevices((prev) => prev.map((device) => (device.id === updatedDevice.id ? updatedDevice : device)))

      toast({
        title: "Device updated",
        description: "The device has been updated successfully.",
      })

      setIsEditDialogOpen(false)
      setEditDevice({
        id: "",
        name: "",
        description: "",
        ipAddress: "",
        defaultUrl: "",
        playlistId: "",
      })
    } catch (error) {
      console.error("Error updating device:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update device. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteDevice = async () => {
    if (!selectedDevice) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/devices/${selectedDevice.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete device")
      }

      setDevices((prev) => prev.filter((device) => device.id !== selectedDevice.id))

      toast({
        title: "Device deleted",
        description: "The device has been deleted successfully.",
      })

      setIsDeleteDialogOpen(false)
      setSelectedDevice(null)
    } catch (error) {
      console.error("Error deleting device:", error)
      toast({
        title: "Error",
        description: "Failed to delete device. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (device: Device) => {
    setEditDevice({
      id: device.id,
      name: device.name,
      description: device.description || "",
      ipAddress: device.ipAddress,
      defaultUrl: device.defaultUrl || "",
      playlistId: device.playlistId || "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (device: Device) => {
    setSelectedDevice(device)
    setIsDeleteDialogOpen(true)
  }

  const openControlDialog = (device: Device) => {
    setSelectedDevice(device)
    setCustomUrl(device.defaultUrl || "")
    setIsControlDialogOpen(true)
  }

  const handleTVCommand = async (command: string, url?: string) => {
    if (!selectedDevice) return

    setIsLoading(true)
    try {
      const payload: any = {
        deviceId: selectedDevice.id,
        action: command,
      }

      if (url && command === "launchBrowser") {
        payload.url = url
      }

      const response = await fetch("/api/tv/control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send command")
      }

      toast({
        title: "Command sent",
        description: data.message || `${command} command sent to ${selectedDevice.name}`,
      })
    } catch (error) {
      console.error("Error sending command:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send command",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckStatus = async (deviceId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/tv/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deviceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check status")
      }

      toast({
        title: "Device Status",
        description: data.message || "Status checked successfully",
        variant: data.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error checking status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add a function to handle connecting to a device
  const handleConnectToDevice = async (deviceId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tv/connect`, {
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
        throw new Error(data.error || "Failed to connect to device")
      }

      toast({
        title: "Connection Successful",
        description: data.message || "Successfully connected to device",
      })
    } catch (error) {
      console.error("Error connecting to device:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect to device",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Device Management</CardTitle>
            <CardDescription>Manage your TV devices and assign playlists to them.</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Device
          </Button>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No devices found. Add a device to get started.</div>
          ) : (
            <div className="grid gap-4">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{device.name}</h3>
                    <p className="text-sm text-muted-foreground">{device.description}</p>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-xs">IP: {device.ipAddress}</p>
                      {device.defaultUrl && <p className="text-xs">Default URL: {device.defaultUrl}</p>}
                      <p className="text-xs">
                        Playlist:{" "}
                        {device.playlistId
                          ? playlists.find((p) => p.id === device.playlistId)?.name || "Unknown"
                          : "None"}
                      </p>
                      <p className="text-xs">
                        Last Seen: {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Never"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openControlDialog(device)}>
                      Control
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnectToDevice(device.id)}
                      disabled={isLoading}
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(device)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openDeleteDialog(device)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>Add a new TV device to your media player system.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Device Name</Label>
              <Input
                id="name"
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                placeholder="Living Room TV"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={newDevice.description}
                onChange={(e) => setNewDevice({ ...newDevice, description: e.target.value })}
                placeholder="TV in the living room"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input
                id="ipAddress"
                value={newDevice.ipAddress}
                onChange={(e) => setNewDevice({ ...newDevice, ipAddress: e.target.value })}
                placeholder="192.168.1.100"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="defaultUrl">Default URL (Optional)</Label>
              <Input
                id="defaultUrl"
                value={newDevice.defaultUrl}
                onChange={(e) => setNewDevice({ ...newDevice, defaultUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="playlist">Playlist (Optional)</Label>
              <Select
                value={newDevice.playlistId}
                onValueChange={(value) => setNewDevice({ ...newDevice, playlistId: value })}
              >
                <SelectTrigger id="playlist">
                  <SelectValue placeholder="Select a playlist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {playlists.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDevice} disabled={isLoading || !newDevice.name || !newDevice.ipAddress}>
              {isLoading ? "Adding..." : "Add Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>Update the device information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Device Name</Label>
              <Input
                id="edit-name"
                value={editDevice.name}
                onChange={(e) => setEditDevice({ ...editDevice, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                value={editDevice.description}
                onChange={(e) => setEditDevice({ ...editDevice, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-ipAddress">IP Address</Label>
              <Input
                id="edit-ipAddress"
                value={editDevice.ipAddress}
                onChange={(e) => setEditDevice({ ...editDevice, ipAddress: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-defaultUrl">Default URL (Optional)</Label>
              <Input
                id="edit-defaultUrl"
                value={editDevice.defaultUrl}
                onChange={(e) => setEditDevice({ ...editDevice, defaultUrl: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-playlist">Playlist</Label>
              <Select
                value={editDevice.playlistId}
                onValueChange={(value) => setEditDevice({ ...editDevice, playlistId: value })}
              >
                <SelectTrigger id="edit-playlist">
                  <SelectValue placeholder="Select a playlist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {playlists.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDevice} disabled={isLoading || !editDevice.name || !editDevice.ipAddress}>
              {isLoading ? "Updating..." : "Update Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Device Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this device? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDevice} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Control Device Dialog */}
      <Dialog open={isControlDialogOpen} onOpenChange={setIsControlDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Control Device: {selectedDevice?.name}</DialogTitle>
            <DialogDescription>Send commands to control this TV device.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Tabs defaultValue="browser">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="browser">Browser</TabsTrigger>
                <TabsTrigger value="power">Power</TabsTrigger>
                <TabsTrigger value="navigation">Navigation</TabsTrigger>
              </TabsList>

              <TabsContent value="browser" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="control-url">URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="control-url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                    <Button
                      onClick={() => handleTVCommand("launchBrowser", customUrl)}
                      disabled={isLoading || !customUrl}
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Open
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handleTVCommand("launchBrowser", selectedDevice?.defaultUrl ?? undefined)}
                    disabled={isLoading || !selectedDevice?.defaultUrl}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Open Default URL
                  </Button>
                  <Button variant="outline" onClick={() => handleTVCommand("refreshBrowser")} disabled={isLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="power" className="space-y-4">
                <div className="flex justify-between">
                  <Button onClick={() => handleTVCommand("powerOn")} disabled={isLoading}>
                    <Power className="mr-2 h-4 w-4" />
                    Power On
                  </Button>
                  <Button variant="outline" onClick={() => handleTVCommand("powerOff")} disabled={isLoading}>
                    <Power className="mr-2 h-4 w-4" />
                    Power Off
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCheckStatus(selectedDevice?.id || "")}
                  disabled={isLoading}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Check Status
                </Button>
              </TabsContent>

              <TabsContent value="navigation" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => handleTVCommand("home")} disabled={isLoading}>
                    Home
                  </Button>
                  <Button variant="outline" onClick={() => handleTVCommand("menu")} disabled={isLoading}>
                    Menu
                  </Button>
                  <Button variant="outline" onClick={() => handleTVCommand("back")} disabled={isLoading}>
                    Back
                  </Button>
                  <Button variant="outline" onClick={() => handleTVCommand("volumeUp")} disabled={isLoading}>
                    Volume Up
                  </Button>
                  <Button variant="outline" onClick={() => handleTVCommand("volumeDown")} disabled={isLoading}>
                    Volume Down
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
