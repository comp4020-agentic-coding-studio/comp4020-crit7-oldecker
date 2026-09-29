import { asc } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { addDaysISO, currentWeekFor } from "./dates";
import { assessments, courses, resources } from "./schema";

// Due dates are offsets from "now" at seed time, not hardcoded literals, so
// the demo reads correctly whenever the app happens to be booted — dev,
// marking day, or a spec run months from now — rather than being silently
// wrong the moment the actual calendar moves past a fixed date. termStart
// stays a real literal: it's a fact about the course, not something that
// should track "now". COMP4020 is inserted first, so it always gets id = 1
// on a fresh database — spec/assessments.test.ts depends on that ordering.
const SEED_COURSES = [
  {
    code: "COMP4020",
    title: "Creative Computing Studio",
    term: "Semester 2, 2026",
    overview:
      "A studio-format course: build a full-stack prototype each week and defend it in a live crit.",
    termStart: "2026-07-20",
    assessments: [
      { title: "Assignment 1: Prototype Proposal", dueDate: addDaysISO(-30), weight: 15 },
      { title: "Assignment 2: Studio Crit Presentation", dueDate: addDaysISO(4), weight: 25 },
      { title: "Final Prototype + Report", dueDate: addDaysISO(35), weight: 40 },
    ],
  },
  {
    code: "ARTV2013",
    title: "Digital Media Arts",
    term: "Semester 2, 2026",
    overview: "Studio practice across sound, image and interactive installation.",
    termStart: "2026-07-27",
    assessments: [
      { title: "Concept Journal Submission", dueDate: addDaysISO(-12), weight: 20 },
      { title: "Studio Project Milestone 2", dueDate: addDaysISO(6), weight: 30 },
      { title: "Exhibition Folio", dueDate: addDaysISO(40), weight: 50 },
    ],
  },
  {
    code: "PSYC2005",
    title: "Cognitive Psychology",
    term: "Semester 2, 2026",
    overview: "How memory, attention and reasoning have been studied experimentally.",
    termStart: "2026-08-03",
    assessments: [
      { title: "Research Report Draft", dueDate: addDaysISO(-25), weight: 20 },
      { title: "Lab Report", dueDate: addDaysISO(1), weight: 30 },
      { title: "Exam Revision Quiz", dueDate: addDaysISO(21), weight: null },
    ],
  },
];

function resourcesFor(termStart: string) {
  const current = currentWeekFor(termStart) ?? 1;
  return [
    { week: 1, kind: "lecture", title: "Orientation & course outline", url: null },
    { week: Math.max(2, current - 2), kind: "reading", title: "Background reading", url: null },
    { week: current, kind: "lecture", title: "This week's material", url: null },
    { week: current + 1, kind: "reading", title: "Next week's reading (get ahead)", url: null },
  ];
}

// Called once at boot, right after migrate(). Guarded on an empty-table
// check so it's idempotent across dev restarts, and runs unconditionally
// against the fresh throwaway database spec/global-setup.ts boots each run.
export function seedIfEmpty(db: BetterSQLite3Database): void {
  const existing = db.select({ id: courses.id }).from(courses).orderBy(asc(courses.id)).limit(1).all();
  if (existing.length > 0) return;

  db.transaction((tx) => {
    for (const seed of SEED_COURSES) {
      const course = tx
        .insert(courses)
        .values({
          code: seed.code,
          title: seed.title,
          term: seed.term,
          overview: seed.overview,
          termStart: seed.termStart,
        })
        .returning()
        .get();

      for (const r of resourcesFor(seed.termStart)) {
        tx.insert(resources).values({ courseId: course.id, ...r }).run();
      }
      for (const a of seed.assessments) {
        tx.insert(assessments).values({ courseId: course.id, ...a }).run();
      }
    }
  });
}
