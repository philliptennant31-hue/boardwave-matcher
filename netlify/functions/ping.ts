import type { Context } from "@netlify/functions"

export default async (_req: Request, _context: Context) => {
  return Response.json({
    ok: true,
    service: "boardwave-matcher",
    timestamp: new Date().toISOString(),
  })
}
