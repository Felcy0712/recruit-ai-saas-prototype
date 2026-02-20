export async function POST(req: Request) {
  try {
    const url = process.env.N8N_SCORE_URL;
    if (!url) {
      return Response.json(
        { ok: false, error: "Missing env var: N8N_SCORE_URL" },
        { status: 500 }
      );
    }

    // Read multipart form-data from browser
    const incoming = await req.formData();

    // Build a new FormData to forward to n8n
    const fd = new FormData();

    // Copy all fields (text + files) exactly as received
    for (const [key, value] of incoming.entries()) {
      // value can be string or File
      fd.append(key, value as any);
    }

    // Forward to n8n webhook
    const r = await fetch(url, {
      method: "POST",
      body: fd, // IMPORTANT: do not set Content-Type manually
    });

    const text = await r.text();

    // Return JSON if possible
    try {
      const data = JSON.parse(text);
      return Response.json(data, { status: r.status });
    } catch {
      return Response.json(
        { ok: false, error: "n8n returned non-JSON", raw: text },
        { status: 502 }
      );
    }
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}