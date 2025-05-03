"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export default function DatabaseSetup() {
  const [isLoading, setIsLoading] = useState(false)

  const initializeDatabase = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/init-db", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description:
            data.status === "created"
              ? "Database initialized successfully. Reloading page..."
              : "Database is already initialized.",
        })

        if (data.status === "created") {
          // Reload the page after a short delay
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      } else {
        throw new Error(data.message || "Initialization failed")
      }
    } catch (error) {
      console.error("Database error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize database",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Setup</CardTitle>
        <CardDescription>Initialize or update your database schema</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          If you're experiencing database errors or have just installed the application, you need to initialize your
          database. This will create the necessary tables and relationships.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={initializeDatabase} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing Database...
            </>
          ) : (
            "Initialize Database"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
