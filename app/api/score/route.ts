import pdfParse from "pdf-parse";

export async function POST(req: Request) {
  try {
    const url = process.env.N8N_SCORE_URL;
    if (!url) {
      return Response.json({ ok: false, error: "Missing env var: N8N_SCORE_URL" }, { status: 500 });
    }

    const incoming = await req.formData();

    // Extract JD text
    const jdFile = incoming.get("JD") as File;
    if (!jdFile) {
      return Response.json({ ok: false, error: "No JD file uploaded" }, { status: 400 });
    }
    const jdBuffer = Buffer.from(await jdFile.arrayBuffer());
    const jd_text = (await pdfParse(jdBuffer)).text.trim();

    // Extract each resume text
    const resumes = [];
    let i = 0;
    while (incoming.get(`resume_${i}`)) {
      const file = incoming.get(`resume_${i}`) as File;
      const buffer = Buffer.from(await file.arrayBuffer());
      const text = (await pdfParse(buffer)).text.trim();
      resumes.push({ index: i, candidate_id: `cand_${i}`, text, fileName: file.name });
      i++;
    }

    if (!resumes.length) {
      return Response.json({ ok: false, error: "No resume files uploaded" }, { status: 400 });
    }

    const payload = {
      recruiter: {
        name: incoming.get("recruiter_name"),
        email: incoming.get("recruiter_email"),
        company: incoming.get("company"),
      },
      job_title: incoming.get("job_title"),
      jd_text,
      resumes,
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const rawText = await r.text();
    try {
      const data = JSON.parse(rawText);
      return Response.json(data, { status: r.status });
    } catch {
      return Response.json({ ok: false, error: "n8n returned non-JSON", raw: rawText }, { status: 502 });
    }

  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}