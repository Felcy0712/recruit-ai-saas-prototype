export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

const pdf = require("pdf-parse");
const mammoth = require("mammoth");

// Use service role key here since this is server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type;
  const name = file.name.toLowerCase();

  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    const result = await pdf(buffer);
    return result.text.trim();
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (mime === "application/msword" || name.endsWith(".doc")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

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
    return NextResponse.json({ ok: false, error: "No JD file uploaded" }, { status: 400 });
  }

  let jd_text: string;
  try {
    jd_text = await extractText(jdFile);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: `Failed to parse JD: ${e.message}` }, { status: 400 });
  }

  const jobId = (formData.get("job_id") as string) || `JOB-${Date.now()}`
  const jobTitle = (formData.get("job_title") as string) || "Position"
  const recruiterName = (formData.get("recruiter_name") as string) || ""
  const recruiterEmail = (formData.get("recruiter_email") as string) || ""
  const company = (formData.get("company") as string) || ""

  forward.append("recruiter_name", recruiterName)
  forward.append("recruiter_email", recruiterEmail)
  forward.append("company", company)
  forward.append("job_title", jobTitle)
  forward.append("jd_text_final", jd_text)
  forward.append("JD", jdFile, jdFile.name)

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
    return NextResponse.json({ ok: false, error: "No resume files uploaded" }, { status: 400 });
  }

  // --- Forward to n8n ---
  let n8nRes: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    n8nRes = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: "POST",
      body: forward,
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (e: any) {
    if (e.name === "AbortError") {
      return NextResponse.json(
        { ok: false, error: "Request timed out waiting for n8n to respond." },
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
      { ok: false, error: "n8n returned empty response — check workflow is active" },
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

  // --- Save each ranked candidate to comm_candidate ---
  const responseData = Array.isArray(data) ? data[0] : data
  const rankedCandidates = responseData?.ranked_candidates || []

  if (Array.isArray(rankedCandidates) && rankedCandidates.length > 0) {
    const rows = rankedCandidates.map((rc: any) => ({
      job_id: jobId,
      job_title: jobTitle,
      recruiter_name: recruiterName,
      recruiter_email: recruiterEmail,
      company: company,
      candidate_id: rc.candidate_id || null,
      candidate_name: rc.candidate_name || null,
      candidate_email: rc.candidate_email || null,
      phone: rc.phone || null,
      current_role: rc.current_role || null,
      score: rc.score || 0,
      summary: rc.summary || null,
      strengths: rc.strengths || [],
      gaps: rc.gaps || [],
      recommendation: rc.recommendation || null,
      email_subject: rc.email_draft?.subject || null,
      email_body: rc.email_draft?.body || null,
      status: rc.score > 85 ? "shortlisted" : rc.score > 70 ? "review" : "rejected",
    }))

    const { error: insertError } = await supabase
      .from("comm_candidate")
      .insert(rows)

    if (insertError) {
      console.error("Failed to save candidates to Supabase:", insertError)
      // Don't block the response — still return data to client
    } else {
      console.log(`Saved ${rows.length} candidate(s) to comm_candidate`)
    }
  }

  return NextResponse.json(data, { status: n8nRes.status });
}