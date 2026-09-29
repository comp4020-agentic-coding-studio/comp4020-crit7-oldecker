import { beforeAll, describe, expect, inject, it } from "vitest";

// Drives the running app over HTTP to prove the one interactive claim this
// prototype makes: adding an assessment persists across a reload, both on
// its own course page and on the cross-course home dashboard. Replaces
// spec/guestbook.test.ts, which described the starter's demo.
const baseUrl = inject("baseUrl");

// COMP4020 is the first course src/lib/seed.ts inserts, so it always gets
// id 1 on the fresh, empty database spec/global-setup.ts boots against. If
// seed.ts's insertion order ever changes, update this to match.
const COURSE_ID = 1;
const COURSE_CODE = "COMP4020";

describe("assessments", () => {
  let title: string;
  let dueDate: string;

  beforeAll(() => {
    title = `spec probe ${process.hrtime.bigint()}`;
    // A near-term date reliably sorts inside the home dashboard's top-8
    // "due soon" window regardless of the exact seed offsets in seed.ts.
    dueDate = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
  });

  // Astro checks form POSTs carry a same-origin Origin header (CSRF
  // protection); browsers send it automatically, a bare fetch doesn't.
  const post = (body: URLSearchParams) =>
    fetch(new URL("/api/assessments", baseUrl), {
      method: "POST",
      headers: { origin: baseUrl },
      body,
      redirect: "manual",
    });

  it("accepts an assessment and redirects back to the teacher-mode course page", async () => {
    const res = await post(new URLSearchParams({ courseId: String(COURSE_ID), title, dueDate }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(`/courses/${COURSE_CODE}/teacher/`);
  });

  it("persists on the course page after a fresh load", async () => {
    const res = await fetch(new URL(`/courses/${COURSE_CODE}/`, baseUrl));
    expect(await res.text()).toContain(title);
  });

  it("surfaces on the home dashboard's due-soon list", async () => {
    const res = await fetch(baseUrl);
    expect(await res.text()).toContain(title);
  });

  it("rejects a weight that would push the course's assessments over 100%", async () => {
    // COMP4020's seeded assessments already total 80% (src/lib/seed.ts), so
    // there's only 20% left to allocate — 50% must be refused even though a
    // flat 0-100 range would allow it on its own.
    const overweightTitle = `spec overweight probe ${process.hrtime.bigint()}`;
    const res = await post(
      new URLSearchParams({ courseId: String(COURSE_ID), title: overweightTitle, dueDate, weight: "50" }),
    );
    expect(res.status).toBe(303);

    const page = await fetch(new URL(`/courses/${COURSE_CODE}/`, baseUrl));
    expect(await page.text()).not.toContain(overweightTitle);
  });
});
