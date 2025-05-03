"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function AdbTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const testAdb = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/test-adb")
      const data = await response.json()
      setTestResult(data)

      if (data.success) {
        toast({
          title: "ADB Test Successful",
          description: "ADB is installed and working correctly.",
        })
      } else {
        toast({
          title: "ADB Test Failed",
          description: data.message || "ADB is not installed or not working correctly.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("ADB test error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test ADB",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ADB Configuration Test</CardTitle>
        <CardDescription>Test if ADB is properly configured on your server</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This test will check if ADB (Android Debug Bridge) is installed and accessible to the application. It will
          also list any connected devices.
        </p>

        {testResult && (
          <div className="mt-4 space-y-4">
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>{testResult.success ? "ADB is working" : "ADB test failed"}</AlertTitle>
              </div>
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>

            {testResult.success && (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>ADB Path:</strong> {testResult.adbPath}
                </div>
                <div>
                  <strong>Version:</strong>
                  <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto">{testResult.version}</pre>
                </div>
                <div>
                  <strong>Connected Devices:</strong>
                  <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto">{testResult.devices}</pre>
                </div>
              </div>
            )}

            {!testResult.success && testResult.possibleSolutions && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Possible Solutions:</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {testResult.possibleSolutions.map((solution: string, index: number) => (
                    <li key={index}>{solution}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testAdb} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing ADB...
            </>
          ) : (
            "Test ADB Configuration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
