"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Trash2, Edit, Plus, GripVertical, Play, ImageIcon } from "lucide-react"
import type { MediaItem, Playlist, PlaylistItem } from "@prisma/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import Image from "next/image"
import { getImageProps } from "@/lib/media-utils"

type PlaylistWithItems = Playlist & {
  items: (PlaylistItem & {
    media: MediaItem
  })[]
}

export default function PlaylistManagement() {
  const [playlists, setPlaylists] = useState<PlaylistWithItems[]>([])
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentPlaylist, setCurrentPlaylist] = useState<PlaylistWithItems | null>(null)
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([])
  const [playlistName, setPlaylistName] = useState("")
  const [availableMedia, setAvailableMedia] = useState<MediaItem[]>([])
  const [editSelectedMediaIds, setEditSelectedMediaIds] = useState<string[]>([])

  // Fetch playlists and media
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [playlistsRes, mediaRes] = await Promise.all([
          fetch("/api/playlists?includeItems=true", {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          }),
          fetch("/api/media", {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
          }),
        ])

        if (!playlistsRes.ok || !mediaRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const playlistsData = await playlistsRes.json()
        const mediaData = await mediaRes.json()

        setPlaylists(playlistsData)
        setMediaItems(mediaData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load playlists or media",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up a refresh interval to keep data fresh
    const intervalId = setInterval(fetchData, 60000) // Refresh every minute

    return () => clearInterval(intervalId)
  }, [])

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      })
      return
    }

    try {
      // Create playlist
      const res = await fetch("/api/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playlistName,
          mediaIds: selectedMediaIds,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to create playlist")
      }

      const newPlaylist = await res.json()

      // Refresh playlists to get the items
      const playlistsRes = await fetch("/api/playlists?includeItems=true")
      const playlistsData = await playlistsRes.json()
      setPlaylists(playlistsData)

      setIsAddDialogOpen(false)
      setPlaylistName("")
      setSelectedMediaIds([])

      toast({
        title: "Success",
        description: "Playlist created successfully",
      })
    } catch (error) {
      console.error("Error creating playlist:", error)
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (playlist: PlaylistWithItems) => {
    setCurrentPlaylist(playlist)
    setPlaylistName(playlist.name)

    // Set initially selected media IDs from the playlist items
    setEditSelectedMediaIds(playlist.items.map((item) => item.mediaId))

    // Fetch all available media for selection
    fetchAvailableMedia()

    setIsEditDialogOpen(true)
  }

  // Add this function to fetch available media
  const fetchAvailableMedia = async () => {
    try {
      const res = await fetch("/api/media")
      if (!res.ok) {
        throw new Error("Failed to fetch media")
      }
      const data = await res.json()
      setAvailableMedia(data)
    } catch (error) {
      console.error("Error fetching media:", error)
      toast({
        title: "Error",
        description: "Failed to load media items",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePlaylist = async () => {
    if (!currentPlaylist) return

    try {
      // First, get the existing items to preserve their IDs where possible
      const existingItems = currentPlaylist.items

      // Create updated items array with proper order
      const updatedItems = editSelectedMediaIds.map((mediaId, index) => {
        // Try to find an existing item with this mediaId
        const existingItem = existingItems.find((item) => item.mediaId === mediaId)

        return {
          id: existingItem?.id || `temp-${index}`, // Use existing ID or temporary ID
          mediaId: mediaId,
          order: index,
        }
      })

      const res = await fetch(`/api/playlists/${currentPlaylist.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playlistName,
          items: updatedItems,
          mediaIds: editSelectedMediaIds, // Add this to handle new items
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update playlist")
      }

      // Refresh playlists
      const playlistsRes = await fetch("/api/playlists?includeItems=true")
      const playlistsData = await playlistsRes.json()
      setPlaylists(playlistsData)

      setIsEditDialogOpen(false)

      toast({
        title: "Success",
        description: "Playlist updated successfully",
      })
    } catch (error) {
      console.error("Error updating playlist:", error)
      toast({
        title: "Error",
        description: "Failed to update playlist",
        variant: "destructive",
      })
    }
  }

  const handleDeletePlaylist = async (id: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return

    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to delete playlist")
      }

      setPlaylists((prev) => prev.filter((playlist) => playlist.id !== id))

      toast({
        title: "Success",
        description: "Playlist deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting playlist:", error)
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      })
    }
  }

  const handleEditMediaSelection = (mediaId: string) => {
    setEditSelectedMediaIds((prev) => {
      if (prev.includes(mediaId)) {
        return prev.filter((id) => id !== mediaId)
      } else {
        return [...prev, mediaId]
      }
    })
  }

  const handleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds((prev) => {
      if (prev.includes(mediaId)) {
        return prev.filter((id) => id !== mediaId)
      } else {
        return [...prev, mediaId]
      }
    })
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !currentPlaylist) return

    const items = Array.from(currentPlaylist.items)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setCurrentPlaylist({
      ...currentPlaylist,
      items: items,
    })
  }

  const handleRemoveFromPlaylist = (itemId: string) => {
    if (!currentPlaylist) return

    setCurrentPlaylist({
      ...currentPlaylist,
      items: currentPlaylist.items.filter((item) => item.id !== itemId),
    })
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading playlists...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Playlist Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} /> Create Playlist
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Playlist Name</Label>
                <Input
                  id="name"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="My Playlist"
                />
              </div>
              <div className="grid gap-2">
                <Label>Select Media Items</Label>
                <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                  {mediaItems.length === 0 ? (
                    <p className="text-center text-muted-foreground">No media items available</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {mediaItems.map((media) => (
                        <div
                          key={media.id}
                          className={`border rounded-md p-2 cursor-pointer ${
                            selectedMediaIds.includes(media.id) ? "border-primary bg-primary/10" : ""
                          }`}
                          onClick={() => handleMediaSelection(media.id)}
                        >
                          <div className="aspect-video bg-muted rounded flex items-center justify-center overflow-hidden mb-2">
                            {media.type === "IMAGE" ? (
                              <Image
                            
                                {...getImageProps(media.url, media.title || "Media preview")}
                                width={120}
                                height={68}
                                className="w-full h-full object-cover"
                                    loading="lazy"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <Play size={24} />
                              </div>
                            )}
                          </div>
                          <div className="text-sm truncate">{media.title}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {media.type === "IMAGE" ? <ImageIcon size={12} /> : <Play size={12} />}
                            {media.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreatePlaylist} disabled={!playlistName.trim() || selectedMediaIds.length === 0}>
                Create Playlist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Playlist Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
          </DialogHeader>
          {currentPlaylist && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Playlist Name</Label>
                <Input id="edit-name" value={playlistName} onChange={(e) => setPlaylistName(e.target.value)} />
              </div>

              <div className="grid gap-2">
                <Label>Add or Remove Media</Label>
                <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                  {availableMedia.length === 0 ? (
                    <p className="text-center text-muted-foreground">No media items available</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {availableMedia.map((media) => (
                        <div
                          key={media.id}
                          className={`border rounded-md p-2 cursor-pointer ${
                            editSelectedMediaIds.includes(media.id) ? "border-primary bg-primary/10" : ""
                          }`}
                          onClick={() => handleEditMediaSelection(media.id)}
                        >
                          <div className="aspect-video bg-muted rounded flex items-center justify-center overflow-hidden mb-2">
                            {media.type === "IMAGE" ? (
                              <Image
                                {...getImageProps(media.url, media.title || "Media preview")}
                                width={60}
                                height={45}
                                className="w-full h-full object-cover"
                                    loading="lazy"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <Play size={24} />
                              </div>
                            )}
                          </div>
                          <div className="text-sm truncate">{media.title}</div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {media.type === "IMAGE" ? <ImageIcon size={12} /> : <Play size={12} />}
                            {media.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
{/* 
              <div className="grid gap-2">
                <Label>Reorder Selected Items</Label>
                <div className="border rounded-md p-4 max-h-[10rem] overflow-y-auto">
                  {editSelectedMediaIds.length === 0 ? (
                    <p className="text-center text-muted-foreground">No items selected for this playlist</p>
                  ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="playlist-items">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {editSelectedMediaIds.map((mediaId, index) => {
                              const media = availableMedia.find((m) => m.id === mediaId)
                              if (!media) return null

                              return (
                                <Draggable
                                  key={`edit-${mediaId}-${index}`}
                                  draggableId={`edit-${mediaId}-${index}`}
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="flex items-center gap-3 border rounded-md p-2"
                                    >
                                      <div {...provided.dragHandleProps} className="cursor-grab">
                                        <GripVertical size={16} />
                                      </div>
                                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                                        {media.type === "IMAGE" ? (
                                          <Image
                                            {...getImageProps(media.url, media.title || "Media preview")}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                                loading="lazy"
                                          />
                                        ) : (
                                          <div className="flex items-center justify-center w-full h-full">
                                            <Play size={20} />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{media.title}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                          {media.type === "IMAGE" ? (
                                            <>
                                              <ImageIcon size={12} />
                                              {media.duration}s
                                            </>
                                          ) : (
                                            <>
                                              <Play size={12} />
                                              Video
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditMediaSelection(media.id)}
                                      >
                                        <Trash2 size={16} />
                                      </Button>
                                    </div>
                                  )}
                                </Draggable>
                              )
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  )}
                </div>
              </div> */}
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={handleUpdatePlaylist} disabled={!playlistName.trim() || editSelectedMediaIds.length === 0}>
              Update Playlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Playlists Table */}
      {playlists.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">No playlists found. Create your first playlist to get started.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {playlists.map((playlist) => {
              // Calculate total duration
              const totalDuration = playlist.items.reduce((total, item) => {
                if (item.media.type === "IMAGE") {
                  return total + (item.media.duration || 0)
                }
                // Estimate video duration (in a real app, you'd store this)
                return total + 30 // Assume 30 seconds for videos
              }, 0)

              // Format duration
              const formatDuration = (seconds: number) => {
                const minutes = Math.floor(seconds / 60)
                const remainingSeconds = seconds % 60
                return `${minutes}m ${remainingSeconds}s`
              }

              return (
                <TableRow key={playlist.id}>
                  <TableCell className="font-medium">{playlist.name}</TableCell>
                  <TableCell>{playlist.items.length} items</TableCell>
                  <TableCell>{formatDuration(totalDuration)}</TableCell>
                  <TableCell>{new Date(playlist.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(playlist)}>
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePlaylist(playlist.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
