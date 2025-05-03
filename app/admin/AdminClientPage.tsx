"use client"

import { useState, useEffect } from "react"
import AdminDashboard from "@/components/admin/dashboard"
import DeviceManagement from "@/components/admin/device-management"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MediaManagement from "@/components/admin/media-management"
import PlaylistManagement from "@/components/admin/playlist-management"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AdminClientPage({
  initialDeviceCount,
  initialMediaCount,
  initialPlaylistCount,
  initialDevices,
  initialPlaylists,
  initialDatabaseError,
}: {
  initialDeviceCount: number
  initialMediaCount: number
  initialPlaylistCount: number
  initialDevices: any[]
  initialPlaylists: any[]
  initialDatabaseError: boolean
}) {
  const [deviceCount, setDeviceCount] = useState(initialDeviceCount)
  const [mediaCount, setMediaCount] = useState(initialMediaCount)
  const [playlistCount, setPlaylistCount] = useState(initialPlaylistCount)
  const [devices, setDevices] = useState(initialDevices)
  const [playlists, setPlaylists] = useState(initialPlaylists)
  const [databaseError, setDatabaseError] = useState(initialDatabaseError)

  useEffect(() => {
    setDeviceCount(initialDeviceCount)
    setMediaCount(initialMediaCount)
    setPlaylistCount(initialPlaylistCount)
    setDevices(initialDevices)
    setPlaylists(initialPlaylists)
    setDatabaseError(initialDatabaseError)
  }, [
    initialDeviceCount,
    initialMediaCount,
    initialPlaylistCount,
    initialDevices,
    initialPlaylists,
    initialDatabaseError,
  ])

  if (databaseError) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Database Error</h2>
          <p className="mb-4">
            There was an error connecting to the database. This might be because the database schema needs to be
            updated.
          </p>
          <div className="flex gap-4">
            <Link href="/api/admin/migrate" passHref>
              <Button>Run Database Migration</Button>
            </Link>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <AdminDashboard deviceCount={deviceCount} mediaCount={mediaCount} playlistCount={playlistCount} />

      <div className="mt-8">
        <Tabs defaultValue="devices" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>

          <TabsContent value="devices">
            <DeviceManagement initialDevices={devices} initialPlaylists={playlists} />
          </TabsContent>

          <TabsContent value="media">
            <MediaManagement />
          </TabsContent>

          <TabsContent value="playlists">
            <PlaylistManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
