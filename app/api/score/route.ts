export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 120; 

const pdf = require("pdf-parse");
const mammoth = require("mammoth");

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type;
  const name = file.name.toLowerCase();

  // PDF
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    const result = await pdf(buffer);
    return result.text.trim();
  }

  // Word .docx
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  // Word .doc (older format — mammoth has limited support, but tries)
  if (mime === "application/msword" || name.endsWith(".doc")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  // Plain text
  if (mime === "text/plain" || name.endsWith(".txt")) {
    return buffer.toString("utf-8").trim();
  }

  throw new Error(`Unsupported file type: ${file.name} (${mime})`);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const forward = new FormData();

  // --- JD ---
  const jdFile = formData.get("JD") as File | null;
  if (!jdFile) {
    return NextResponse.json(
      { ok: false, error: "No JD file uploaded" },
      { status: 400 }
    );
  }

  let jd_text: string;
  try {
    jd_text = await extractText(jdFile);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: `Failed to parse JD: ${e.message}` },
      { status: 400 }
    );
  }

  // Forward recruiter fields
  forward.append("recruiter_name", formData.get("recruiter_name") as string);
  forward.append("recruiter_email", formData.get("recruiter_email") as string);
  forward.append("company", formData.get("company") as string);
  forward.append("job_title", formData.get("job_title") as string);
  forward.append("jd_text_final", jd_text);

  // Forward JD binary
  forward.append("JD", jdFile, jdFile.name);

  // --- Resumes ---
  let i = 0;
  while (formData.get(`resume_${i}`)) {
    const resume = formData.get(`resume_${i}`) as File;

    let resume_text: string;
    try {
      resume_text = await extractText(resume);
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: `Failed to parse resume_${i} (${resume.name}): ${e.message}` },
        { status: 400 }
      );
    }

    forward.append(`resume_${i}`, resume, resume.name);
    forward.append(`resume_${i}_text`, resume_text);
    i++;
  }

  if (i === 0) {
    return NextResponse.json(
      { ok: false, error: "No resume files uploaded" },
      { status: 400 }
    );
  }

  // --- Forward to n8n ---
  let n8nRes: Response;
  try {
      const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200000); // 120 second timeout
    n8nRes = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: "POST",
      body: forward,
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (e: any) {
  if (e.name === "AbortError") {
    return NextResponse.json(
      { ok: false, error: "Request timed out waiting for n8n to respond. The workflow may still be running." },
      { status: 504 }
    );
  }
  return NextResponse.json(
    { ok: false, error: `Failed to reach n8n: ${e.message}` },
    { status: 502 }
  );
}

  const text = await n8nRes.text();

  if (!text || text.trim() === "") {
    return NextResponse.json(
      { ok: false, error: "n8n returned empty response — check workflow is active and has a Respond to Webhook node" },
      { status: 502 }
    );
  }

  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("n8n non-JSON response:", text);
    return NextResponse.json(
      { ok: false, error: "n8n response was not valid JSON", detail: text },
      { status: 502 }
    );
  }

  console.log("n8n response data:", data);

  return NextResponse.json(data, { status: n8nRes.status });
}