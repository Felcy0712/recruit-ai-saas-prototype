export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

const mammoth = require("mammoth");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- File Type Detection by Filename ---

function classifyFile(filename: string): "jd" | "resume" | "unknown" {
  const name = filename.toLowerCase().replace(/\s+/g, "_");

  if (
    name === "jd.pdf" ||
    name === "jd.docx" ||
    name === "jd.txt" ||
    name === "jd.doc" ||
    name.startsWith("jd_")
  )
    return "jd";

  if (
    name.startsWith("resume_") ||
    name.includes("_resume.") ||
    name.includes("_cv.")
  )
    return "resume";

  return "unknown";
}

function extractRoleFromJD(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, "");
  const parts = base.split(/_(.+)/);
  return parts[1]?.replace(/_/g, " ").trim() || "Position";
}

function extractNameFromResume(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, "").toLowerCase();
  return base
    .replace(/_resume$/, "")
    .replace(/^resume_/, "")
    .replace(/_cv$/, "")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- PDF Text Extraction using pdf2json ---

async function extractPdfText(buffer: Buffer): Promise<string> {
  const PDFParser = require("pdf2json");

  return new Promise<string>((resolve, reject) => {
    const parser = new PDFParser();

    const timeout = setTimeout(() => {
      reject(new Error("PDF parsing timed out after 15 seconds"));
    }, 15000);

    parser.on("pdfParser_dataReady", (data: any) => {
      clearTimeout(timeout);
      try {
        const text = data.Pages.flatMap((page: any) => page.Texts)
          .map((t: any) => {
            const raw = t.R.map((r: any) => r.T).join("");
            try {
              return decodeURIComponent(raw);
            } catch {
              return raw; // fallback if decoding fails
            }
          })
          .join(" ");
        resolve(text.trim());
      } catch (e: any) {
        reject(new Error(`Failed to process PDF data: ${e.message}`));
      }
    });

    parser.on("pdfParser_dataError", (err: any) => {
      clearTimeout(timeout);
      reject(new Error(err.parserError || "Unknown PDF parse error"));
    });

    parser.parseBuffer(buffer);
  });
}

// --- Text Extraction ---

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type;
  const name = file.name.toLowerCase();

  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return await extractPdfText(buffer);
  }

  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
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

// --- POST Handler ---

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const forward = new FormData();

  const jobId = (formData.get("job_id") as string) || `JOB-${Date.now()}`;
  const recruiterName = (formData.get("recruiter_name") as string) || "";
  const recruiterEmail = (formData.get("recruiter_email") as string) || "";
  const company = (formData.get("company") as string) || "";

  // --- Classify all uploaded files ---
  const allFiles: File[] = [];
  for (const [, value] of formData.entries()) {
    if (value instanceof File) allFiles.push(value);
  }

  console.log("All files received:", allFiles.map((f) => f.name));

  const jdFiles = allFiles.filter((f) => classifyFile(f.name) === "jd");
  const resumeFiles = allFiles.filter((f) => classifyFile(f.name) === "resume");
  const unknownFiles = allFiles.filter(
    (f) => classifyFile(f.name) === "unknown"
  );

  console.log("JD files detected:", jdFiles.map((f) => f.name));
  console.log("Resume files detected:", resumeFiles.map((f) => f.name));
  if (unknownFiles.length > 0) {
    console.warn(
      "Unclassified files (skipped):",
      unknownFiles.map((f) => f.name)
    );
  }

  // --- Validate ---
  if (jdFiles.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No JD file found. Name your file 'JD.pdf' or 'JD_RoleName.pdf' (e.g. JD_Fullstack.pdf)",
      },
      { status: 400 }
    );
  }

  if (resumeFiles.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No resume files found. Name resumes as 'Resume_1.pdf' or 'FirstName_LastName_resume.pdf'",
      },
      { status: 400 }
    );
  }

  // --- Process JD ---
  const jdFile = jdFiles[0];
  const jobTitle =
    (formData.get("job_title") as string) || extractRoleFromJD(jdFile.name);

  let jd_text: string;
  try {
    jd_text = await extractText(jdFile);
    console.log("JD text extracted, length:", jd_text.length);
  } catch (e: any) {
    console.error("JD extraction failed:", e);
    return NextResponse.json(
      { ok: false, error: `Failed to parse JD (${jdFile.name}): ${e.message}` },
      { status: 400 }
    );
  }

  forward.append("job_id", jobId);
  forward.append("job_title", jobTitle);
  forward.append("recruiter_name", recruiterName);
  forward.append("recruiter_email", recruiterEmail);
  forward.append("company", company);
  forward.append("jd_text_final", jd_text);
  forward.append("JD", jdFile, jdFile.name);

  // --- Process Resumes ---
  for (let i = 0; i < resumeFiles.length; i++) {
    const resume = resumeFiles[i];
    const inferredName = extractNameFromResume(resume.name);

    let resume_text: string;
    try {
      resume_text = await extractText(resume);
      console.log(`Resume ${i} (${resume.name}) extracted, length:`, resume_text.length);
    } catch (e: any) {
      console.error(`Resume extraction failed (${resume.name}):`, e);
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to parse resume (${resume.name}): ${e.message}`,
        },
        { status: 400 }
      );
    }

    forward.append(`resume_${i}`, resume, resume.name);
    forward.append(`resume_${i}_text`, resume_text);
    forward.append(`resume_${i}_inferred_name`, inferredName);
  }

  console.log("jobTitle:", jobTitle);
  console.log("jd_text length:", jd_text.length);
  console.log("resume count:", resumeFiles.length);

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

  console.log("n8n status:", n8nRes.status);
  console.log("n8n response text:", text);

  if (!text || text.trim() === "") {
    return NextResponse.json(
      {
        ok: false,
        error: "n8n returned empty response - check workflow is active",
      },
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

  // --- Save to Supabase ---
  const responseData = Array.isArray(data) ? data[0] : data;
  const rankedCandidates = responseData?.ranked_candidates || [];

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
      status:
        rc.score > 85
          ? "shortlisted"
          : rc.score > 70
          ? "review"
          : "rejected",
    }));

    const { error: insertError } = await supabase
      .from("comm_candidate")
      .insert(rows);

    if (insertError) {
      console.error("Failed to save candidates to Supabase:", insertError);
    } else {
      console.log(`Saved ${rows.length} candidate(s) to comm_candidate`);
    }
  }

  return NextResponse.json(data, { status: n8nRes.status });
}