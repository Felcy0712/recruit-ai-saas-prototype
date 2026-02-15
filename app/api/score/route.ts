export async function POST(req: Request) {
  const body = await req.json();

  const r = await fetch(process.env.N8N_SCORE_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));
  return Response.json(data, { status: r.status });
}