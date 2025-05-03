"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminDashboardProps {
  deviceCount: number
  mediaCount: number
  playlistCount: number
}

export default function AdminDashboard({ deviceCount, mediaCount, playlistCount }: AdminDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{deviceCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Media Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mediaCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Playlists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{playlistCount}</div>
        </CardContent>
      </Card>
    </div>
  )
}
