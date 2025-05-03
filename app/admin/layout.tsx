"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Monitor, ImageIcon, ListVideo, LayoutGrid, Settings, Tv2 } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentRoute = usePathname()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Media Player Admin</h1>
            <nav>
              <Tabs defaultValue={currentRoute}>
                <TabsList>
                  <Link href="/admin">
                    <TabsTrigger
                      value="/admin"
                      className={`flex items-center gap-1 ${
                        currentRoute === "/admin" ? "bg-gray-200" : ""
                      }`}
                    >
                      <LayoutGrid size={16} />
                      Dashboard
                    </TabsTrigger>
                  </Link>
                  <Link href="/admin/devices">
                    <TabsTrigger
                      value="/admin/devices"
                      className={`flex items-center gap-1 ${
                        currentRoute === "/admin/devices" ? "bg-gray-200" : ""
                      }`}
                    >
                      <Monitor size={16} />
                      Devices
                    </TabsTrigger>
                  </Link>
                  <Link href="/admin/media">
                    <TabsTrigger
                      value="/admin/media"
                      className={`flex items-center gap-1 ${
                        currentRoute === "/admin/media" ? "bg-gray-200" : ""
                      }`}
                    >
                      <ImageIcon size={16} />
                      Media
                    </TabsTrigger>
                  </Link>
                  <Link href="/admin/playlists">
                    <TabsTrigger
                      value="/admin/playlists"
                      className={`flex items-center gap-1 ${
                        currentRoute === "/admin/playlists" ? "bg-gray-200" : ""
                      }`}
                    >
                      <ListVideo size={16} />
                      Playlists
                    </TabsTrigger>
                  </Link>
                  <Link href="/admin/tv-control">
                    <TabsTrigger
                      value="/admin/tv-control"
                      className={`flex items-center gap-1 ${
                        currentRoute === "/admin/tv-control" ? "bg-gray-200" : ""
                      }`}
                    >
                      <Tv2 size={16} />
                      TV Control
                    </TabsTrigger>
                  </Link>
                  <Link href="/admin/setup">
                    <TabsTrigger
                      value="/admin/setup"
                      className={`flex items-center gap-1 ${
                        currentRoute === "/admin/setup" ? "bg-gray-200" : ""
                      }`}
                    >
                      <Settings size={16} />
                      Setup
                    </TabsTrigger>
                  </Link>
                </TabsList>
              </Tabs>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6 px-6">{children}</main>
    </div>
  )
}
