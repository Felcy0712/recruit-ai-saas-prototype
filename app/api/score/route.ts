export async function POST(req: Request) {
  try {
    const url = process.env.N8N_SCORE_URL;
    if (!url) {
      return Response.json(
        { ok: false, error: "Missing env var: N8N_SCORE_URL" },
        { status: 500 }
      );
    }

    const incoming = await req.formData();
    const fd = new FormData();

    for (const [key, value] of incoming.entries()) {
      if (value instanceof File) {
        // ✅ Explicitly pass filename and force correct MIME type
        const mime =
          value.type ||
          (value.name.endsWith(".pdf")
            ? "application/pdf"
            : value.name.endsWith(".docx")
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/octet-stream");

        const blob = new Blob([await value.arrayBuffer()], { type: mime });
        fd.append(key, blob, value.name); // ← third arg (filename) is the fix
      } else {
        fd.append(key, value);
      }
    }

    const r = await fetch(url, {
      method: "POST",
      body: fd,
    });

    const text = await r.text();

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