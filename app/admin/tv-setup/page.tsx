import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function TVSetupPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">TV Setup Guide</h1>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Setting Up Your Xiaomi Smart TV</CardTitle>
            <CardDescription>
              Follow these steps to enable remote control of your Xiaomi Smart TV from the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Method 1: Using ADB (Android Debug Bridge)</h2>
              <p>
                This method uses Android's debugging tools to control your TV. It requires enabling developer options on
                your TV.
              </p>

              <div className="space-y-2 pl-4 border-l-2 border-muted-foreground/20">
                <h3 className="font-semibold">Step 1: Enable Developer Options</h3>
                <p className="text-sm text-muted-foreground">
                  On your Xiaomi TV, go to Settings &gt; About &gt; Click on "Build Number" 7 times until you see a
                  message that you are now a developer.
                </p>

                <h3 className="font-semibold mt-4">Step 2: Enable ADB Debugging</h3>
                <p className="text-sm text-muted-foreground">
                  Go to Settings &gt; Developer Options &gt; Enable "USB Debugging" and "ADB over Network"
                </p>

                <h3 className="font-semibold mt-4">Step 3: Note Your TV's IP Address</h3>
                <p className="text-sm text-muted-foreground">
                  Go to Settings &gt; Network &gt; View your IP address and make note of it
                </p>

                <h3 className="font-semibold mt-4">Step 4: Add Your TV to the Admin Panel</h3>
                <p className="text-sm text-muted-foreground">
                  In the admin panel, add a new device with the TV's IP address and give it a name
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Method 2: Using the Helper App</h2>
              <p>
                This method uses a small helper app that you install on your TV. The app listens for commands from the
                admin panel.
              </p>

              <div className="space-y-2 pl-4 border-l-2 border-muted-foreground/20">
                <h3 className="font-semibold">Step 1: Download the Helper App</h3>
                <p className="text-sm text-muted-foreground">
                  Download our helper app APK file to a USB drive or directly on your TV.
                </p>
                <Button variant="outline" className="mt-2">
                  Download Helper App
                </Button>

                <h3 className="font-semibold mt-4">Step 2: Install the Helper App</h3>
                <p className="text-sm text-muted-foreground">
                  On your Xiaomi TV, go to Settings &gt; Apps &gt; Install from USB (or use a file manager to install
                  the APK)
                </p>

                <h3 className="font-semibold mt-4">Step 3: Configure the Helper App</h3>
                <p className="text-sm text-muted-foreground">
                  Open the helper app and enter the URL of your admin server. The app will generate a unique device ID.
                </p>

                <h3 className="font-semibold mt-4">Step 4: Add Your TV to the Admin Panel</h3>
                <p className="text-sm text-muted-foreground">
                  In the admin panel, add a new device with the device ID from the helper app
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Method 3: Using HDMI-CEC</h2>
              <p>
                If your TV supports HDMI-CEC, you can control it through an HDMI connection from another device like a
                Raspberry Pi.
              </p>

              <div className="space-y-2 pl-4 border-l-2 border-muted-foreground/20">
                <h3 className="font-semibold">Step 1: Enable HDMI-CEC on Your TV</h3>
                <p className="text-sm text-muted-foreground">
                  On your Xiaomi TV, go to Settings &gt; HDMI Settings &gt; Enable HDMI-CEC
                </p>

                <h3 className="font-semibold mt-4">Step 2: Connect a CEC-Compatible Device</h3>
                <p className="text-sm text-muted-foreground">
                  Connect a Raspberry Pi or other CEC-compatible device to your TV via HDMI
                </p>

                <h3 className="font-semibold mt-4">Step 3: Configure the CEC Device</h3>
                <p className="text-sm text-muted-foreground">
                  Set up the CEC device to receive commands from your admin server and relay them to the TV
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>Common issues and their solutions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">TV Not Responding to Commands</h3>
              <p className="text-sm text-muted-foreground">
                Ensure ADB debugging is enabled and the IP address is correct. Try rebooting the TV and reconnecting.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Browser Not Launching</h3>
              <p className="text-sm text-muted-foreground">
                Make sure a browser app is installed on the TV. Try specifying a different browser package name in the
                admin settings.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Wake-on-LAN Not Working</h3>
              <p className="text-sm text-muted-foreground">
                Ensure the MAC address is correct and Wake-on-LAN is enabled in your TV's network settings. Some TVs may
                not support Wake-on-LAN.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link href="/admin/tv-control">
            <Button size="lg">Go to TV Control Panel</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
