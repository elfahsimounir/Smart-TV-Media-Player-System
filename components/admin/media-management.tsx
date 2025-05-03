"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Trash2, Upload, Play, ImageIcon } from "lucide-react"
import type { MediaItem } from "@prisma/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"

// Import the media utility
import { getImageProps } from "@/lib/media-utils"

export default function MediaManagement() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    type: "IMAGE",
    duration: 10,
    muted: true,
  })

  // Fetch media items
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/media", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        })

        if (!res.ok) {
          throw new Error("Failed to fetch media")
        }

        const data = await res.json()
        setMediaItems(data)
      } catch (error) {
        console.error("Error fetching media:", error)
        toast({
          title: "Error",
          description: "Failed to load media items",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()

    // Set up a refresh interval to keep data fresh
    const intervalId = setInterval(fetchMedia, 60000) // Refresh every minute

    return () => clearInterval(intervalId)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, type: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Auto-detect type based on file
      const fileType = selectedFile.type.startsWith("video") ? "VIDEO" : "IMAGE"
      setFormData((prev) => ({ ...prev, type: fileType }))
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Create form data for upload
    const uploadData = new FormData()
    uploadData.append("file", file)
    uploadData.append("title", formData.title || file.name)
    uploadData.append("type", formData.type)
    uploadData.append("duration", formData.duration.toString())
    uploadData.append("muted", formData.muted.toString())

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10
          return newProgress > 90 ? 90 : newProgress
        })
      }, 500)

      const res = await fetch("/api/media/upload", {
        method: "POST",
        body: uploadData,
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        throw new Error("Failed to upload media")
      }

      setUploadProgress(100)

      const newMedia = await res.json()
      setMediaItems((prev) => [...prev, newMedia])

      toast({
        title: "Success",
        description: "Media uploaded successfully",
      })

      // Reset form
      setFile(null)
      setFormData({
        title: "",
        type: "IMAGE",
        duration: 10,
        muted: true,
      })
      setIsUploadDialogOpen(false)
    } catch (error) {
      console.error("Error uploading media:", error)
      toast({
        title: "Error",
        description: "Failed to upload media",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media item?")) return

    try {
      const res = await fetch(`/api/media/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to delete media")
      }

      setMediaItems((prev) => prev.filter((item) => item.id !== id))

      toast({
        title: "Success",
        description: "Media deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting media:", error)
      toast({
        title: "Error",
        description: "Failed to delete media",
        variant: "destructive",
      })
    }
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, muted: checked }))
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading media...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Media Management</h2>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload size={16} /> Upload Media
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" type="file" accept="image/*,video/*" onChange={handleFileChange} />
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={file ? file.name : "Enter media title"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Media Type</Label>
                <Select value={formData.type} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select media type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type === "IMAGE" && (
                <div className="grid gap-2">
                  <Label htmlFor="duration">Display Duration (seconds)</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={handleInputChange}
                  />
                </div>
              )}
              {formData.type === "VIDEO" && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="muted" className="cursor-pointer">
                    Mute Video
                  </Label>
                  <Switch id="muted" checked={formData.muted} onCheckedChange={handleSwitchChange} />
                </div>
              )}
              {isUploading && (
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleUpload} disabled={isUploading || !file}>
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Media Items Table */}
      {mediaItems.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">No media items found. Upload your first media to get started.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mediaItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="w-16 h-16 bg-muted rounded flex items-center justify-center overflow-hidden">
                    {item.type === "IMAGE" ? (
                      // Use our new getImageProps utility to ensure consistent styling
                      <Image
                        {...getImageProps(item.url, item.title || "Media preview")}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <Play size={24} />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {item.type === "IMAGE" ? <ImageIcon size={16} /> : <Play size={16} />}
                    {item.type}
                  </div>
                </TableCell>
                <TableCell>{item.type === "IMAGE" ? `${item.duration} seconds` : "Auto"}</TableCell>
                <TableCell>{item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(2)} MB` : "Unknown"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteMedia(item.id)}>
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
