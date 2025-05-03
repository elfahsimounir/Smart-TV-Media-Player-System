import DatabaseSetup from "@/components/admin/database-setup"
import AdbTest from "@/components/admin/adb-test"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Setup | TV Media Player Admin",
}

export default function SetupPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">System Setup</h1>

      <div className="grid gap-6">
        <DatabaseSetup />

        <AdbTest />

        <Card>
          <CardHeader>
            <CardTitle>ADB Setup</CardTitle>
            <CardDescription>Set up Android Debug Bridge (ADB) to control your Smart TVs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              To control your Smart TVs, you need to install ADB on your server and enable ADB debugging on your TVs.
            </p>
            <Link href="/admin/tv-setup" passHref>
              <Button variant="outline">View ADB Setup Guide</Button>
            </Link>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-4">
          <Link href="/admin" passHref>
            <Button>Go to Admin Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
