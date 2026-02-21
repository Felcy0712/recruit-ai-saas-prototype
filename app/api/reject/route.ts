import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const n8nUrl = process.env.N8N_REJECT_WEBHOOK_URL
    if (!n8nUrl) throw new Error("N8N_REJECT_WEBHOOK_URL not set")

    const res = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || "n8n rejected the request")

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}