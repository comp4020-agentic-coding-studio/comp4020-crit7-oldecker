import type { APIRoute } from "astro";
import { addSubmission, getAssessmentById, getCourseById } from "../../lib/db";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

// The student-side mirror of api/assessments.ts: a plain HTML form (this one
// multipart, so it can carry a file) POSTs here, the row goes into SQLite,
// and a 303 redirect re-renders the course page — no client-side JS.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const assessmentId = Number(form.get("assessmentId"));
  const textRaw = String(form.get("text") ?? "").trim();
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;

  // Re-resolve the assessment (and via it, the course) server-side rather
  // than trusting the hidden field as-is — same reasoning as
  // api/assessments.ts, and it's also where the redirect target comes from.
  const assessment = Number.isInteger(assessmentId) ? getAssessmentById(assessmentId) : undefined;
  if (!assessment) {
    return redirect("/", 303);
  }
  const course = getCourseById(assessment.courseId)!;

  if ((!textRaw && !hasFile) || (hasFile && file.size > MAX_FILE_BYTES)) {
    return redirect(`/courses/${course.code}/`, 303);
  }

  addSubmission({
    assessmentId: assessment.id,
    textContent: textRaw || null,
    fileName: hasFile ? file.name.slice(0, 200) : null,
    fileType: hasFile ? file.type || "application/octet-stream" : null,
    fileData: hasFile ? Buffer.from(await file.arrayBuffer()) : null,
  });
  return redirect(`/courses/${course.code}/`, 303);
};
