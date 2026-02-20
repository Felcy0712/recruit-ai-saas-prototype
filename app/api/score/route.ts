export const runtime = "nodejs";


import { NextRequest, NextResponse } from "next/server"

import pdf from "pdf-parse";

export const maxDuration = 60; // seconds — requires Vercel Pro for >10s

//const pdf = require("pdf-parse");

async function pdfParse(buffer: Buffer): Promise<string> {
  //console.log('inside the function');
  const result = await pdf.default(buffer);
  return result.text.trim();
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const forward = new FormData()

      const jdFile = formData.get("JD") as File;
    if (!jdFile) {
      return Response.json({ ok: false, error: "No JD file uploaded" }, { status: 400 });
    }
    const jdBuffer = Buffer.from(await jdFile.arrayBuffer());
    // const jd_text = (await pdfParse(jdBuffer)).text.trim();
    const jd_text = await pdfParse(jdBuffer);

  // Forward recruiter fields
  forward.append("recruiter_name", formData.get("recruiter_name") as string)
  forward.append("recruiter_email", formData.get("recruiter_email") as string)
  forward.append("company", formData.get("company") as string)
  forward.append("job_title", formData.get("job_title") as string)
  forward.append("jd_text_final", jd_text);

  // Forward JD as binary blob with correct filename
  const jd = formData.get("JD") as File
  if (jd) {
    forward.append("JD", jd, jd.name)  // ← must pass filename
  }

  // Forward resumes as binary blobs with correct filenames
  let i = 0
  while (formData.get(`resume_${i}`)) {
    const resume = formData.get(`resume_${i}`) as File
    forward.append(`resume_${i}`, resume, resume.name)  // ← must pass filename
    i++
  }

  const n8nRes = await fetch(process.env.N8N_WEBHOOK_URL!, {
    method: "POST",
    body: forward,
  })

  const data = await n8nRes.json()
  return NextResponse.json(data, { status: n8nRes.status })
}