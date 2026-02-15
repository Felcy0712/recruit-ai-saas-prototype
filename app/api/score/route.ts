export async function POST(req: Request) {
  try {
    const body = await req.json();

    const url = process.env.N8N_SCORE_URL;
    if (!url) {
      return Response.json(
        { ok: false, error: "Missing env var: N8N_SCORE_URL" },
        { status: 500 }
      );
    }

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await r.text(); // important: read raw
    return Response.json(
      { ok: r.ok, n8n_status: r.status, n8n_raw: raw.slice(0, 2000) },
      { status: r.ok ? 200 : 502 }
    );
  } catch (e: any) {
    return Response.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}