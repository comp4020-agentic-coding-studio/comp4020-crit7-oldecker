import type { APIRoute } from "astro";
import { addAssessment, getCourseById } from "../../lib/db";

const isValidISODate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

// Mirrors the starter's guestbook write path: a plain HTML form POSTs here,
// the row goes into SQLite, and a 303 redirect re-renders the course page
// from the database — no client-side JavaScript required.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courseId = Number(form.get("courseId"));
  const title = String(form.get("title") ?? "").trim();
  const dueDate = String(form.get("dueDate") ?? "").trim();
  const weightRaw = form.get("weight");
  const weight = weightRaw && String(weightRaw).trim() !== "" ? Number(weightRaw) : null;

  // Re-resolve the course server-side rather than trusting the hidden field
  // as-is — a POST body is user-editable regardless of what the form
  // renders — and this is also where the redirect target's `code` comes from.
  const course = Number.isInteger(courseId) ? getCourseById(courseId) : undefined;
  if (!course) {
    return redirect("/", 303);
  }

  const weightValid = weight === null || (Number.isFinite(weight) && weight >= 0 && weight <= 100);
  if (!title || !isValidISODate(dueDate) || !weightValid) {
    return redirect(`/courses/${course.code}/teacher/`, 303);
  }

  addAssessment({ courseId: course.id, title: title.slice(0, 200), dueDate, weight });
  return redirect(`/courses/${course.code}/teacher/`, 303);
};
