export async function POST(req: Request) {
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

  const text = await r.text();

  // pass through n8n JSON directly
  try {
    const data = JSON.parse(text);
    return Response.json(data, { status: r.status });
  } catch {
    // if n8n returns non-json error text
    return Response.json(
      { ok: false, error: "n8n returned non-JSON", raw: text },
      { status: 502 }
    );
  }
}