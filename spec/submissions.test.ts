import { beforeAll, describe, expect, inject, it } from "vitest";

// Drives the running app over HTTP to prove the student-side write path:
// turning work in against an assessment persists across a reload on the
// student course page. Mirrors spec/assessments.test.ts's idiom. File
// uploads are verified manually in the browser, not here — this covers the
// text-only path, which exercises the same insert/redirect/render loop.
const baseUrl = inject("baseUrl");

// COMP4020's first seeded assessment (src/lib/seed.ts inserts it first into
// an empty database), so it always gets id 1 — same determinism reasoning as
// COURSE_ID in spec/assessments.test.ts. If seed.ts's insertion order ever
// changes, update this to match.
const ASSESSMENT_ID = 1;
const COURSE_CODE = "COMP4020";

describe("submissions", () => {
  let text: string;

  beforeAll(() => {
    text = `spec submission ${process.hrtime.bigint()}`;
  });

  // Astro checks form POSTs carry a same-origin Origin header (CSRF
  // protection); browsers send it automatically, a bare fetch doesn't.
  const post = (body: URLSearchParams) =>
    fetch(new URL("/api/submissions", baseUrl), {
      method: "POST",
      headers: { origin: baseUrl },
      body,
      redirect: "manual",
    });

  it("accepts a text submission and redirects back to the student course page", async () => {
    const res = await post(new URLSearchParams({ assessmentId: String(ASSESSMENT_ID), text }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`/courses/${COURSE_CODE}/`);
  });

  it("persists on the course page after a fresh load", async () => {
    const res = await fetch(new URL(`/courses/${COURSE_CODE}/`, baseUrl));
    expect(await res.text()).toContain(text);
  });
});
