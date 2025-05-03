"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Monitor, ImageIcon, ListVideo, Clock, Wifi, WifiOff, PlayCircle } from "lucide-react"
import TVControlModal from "@/components/admin/tv-control-modal"
import type { Device, Playlist } from "@prisma/client"

interface AdminPageProps {
  deviceCount: number
  mediaCount: number
  playlistCount: number
  connectedDevices: (Device & { playlist: Playlist | null })[]
  recentlyDisconnectedDevices: (Device & { playlist: Playlist | null })[]
}

export default function AdminPageClient({
  deviceCount,
  mediaCount,
  playlistCount,
  connectedDevices,
  recentlyDisconnectedDevices,
}: AdminPageProps) {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [isControlModalOpen, setIsControlModalOpen] = useState(false)

  const handleControlClick = (device: Device) => {
    setSelectedDevice(device)
    setIsControlModalOpen(true)
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deviceCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{connectedDevices.length} currently online</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Media Items</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Images and videos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Playlists</CardTitle>
            <ListVideo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playlistCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active content playlists</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/admin/devices">
          <Button variant="outline" className="w-full justify-start">
            <Monitor className="mr-2 h-4 w-4" />
            Manage Devices
          </Button>
        </Link>
        <Link href="/admin/media">
          <Button variant="outline" className="w-full justify-start">
            <ImageIcon className="mr-2 h-4 w-4" />
            Manage Media
          </Button>
        </Link>
        <Link href="/admin/playlists">
          <Button variant="outline" className="w-full justify-start">
            <ListVideo className="mr-2 h-4 w-4" />
            Manage Playlists
          </Button>
        </Link>
      </div>

      {/* Connected Devices */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Connected Devices</CardTitle>
          <CardDescription>Devices that have connected in the last 5 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          {connectedDevices.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No devices currently connected</div>
          ) : (
            <div className="space-y-4">
              {connectedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{device.name}</h3>
                      <Badge variant="default" className="bg-green-500">
                        <Wifi className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-xs">IP: {device.ipAddress}</p>
                      <p className="text-xs">Playlist: {device.playlist ? device.playlist.name : "None"}</p>
                      <p className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last Seen: {new Date(device.lastSeen!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleControlClick(device)}>
                      Control
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        handleControlClick(device)
                        // We'll trigger the Run function after the modal opens
                        setTimeout(() => {
                          const runButton = document.querySelector('[data-run-button="true"]') as HTMLButtonElement
                          if (runButton) runButton.click()
                        }, 500)
                      }}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Run
                    </Button>
                    <Link href="/admin/devices">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Disconnected Devices */}
      {recentlyDisconnectedDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Disconnected</CardTitle>
            <CardDescription>Devices that were active in the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentlyDisconnectedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{device.name}</h3>
                      <Badge variant="outline">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Offline
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-xs">IP: {device.ipAddress}</p>
                      <p className="text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last Seen: {new Date(device.lastSeen!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleControlClick(device)}>
                      Control
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TV Control Modal */}
      {selectedDevice && (
        <TVControlModal device={selectedDevice} open={isControlModalOpen} onOpenChange={setIsControlModalOpen} />
      )}
    </div>
  )
}
