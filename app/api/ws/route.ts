import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  return new Response(
    JSON.stringify({
      message: "WebSocket functionality has been replaced with HTTP polling for better reliability.",
      info: "Check the /api/media/current endpoint for the current implementation.",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}
