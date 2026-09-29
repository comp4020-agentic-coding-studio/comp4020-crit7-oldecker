import { asc } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { TEACHING_WEEKS, addDaysISO, currentWeekFor } from "./dates";
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
      {
        title: "Assignment 1: Prototype Proposal",
        dueDate: addDaysISO(-30),
        weight: 15,
        kind: "assignment",
        description:
          "Pitch the prototype you'll build across the static half of the studio: a one-page proposal " +
          "covering the idea, the stack you're choosing and why, and the first week's spec. Submit as a " +
          "PDF or plain text — a clear paragraph is enough.",
      },
      {
        title: "Assignment 2: Studio Crit Presentation",
        dueDate: addDaysISO(4),
        weight: 25,
        kind: "assignment",
        description:
          "Present the full-stack prototype from the dynamic half at a live studio crit: a short demo " +
          "plus the harness and process behind it. Turn in your slides or notes beforehand — the " +
          "presentation itself happens in the room.",
      },
      {
        title: "Final Prototype + Report",
        dueDate: addDaysISO(35),
        weight: 40,
        kind: "assignment",
        description:
          "The finished prototype from the whole studio, plus a written report connecting the brief to " +
          "what you actually shipped — architecture decisions, what changed under deadline pressure, and " +
          "what you'd do differently. Submit the report as a PDF alongside your repo link.",
      },
    ],
    lectures: [
      "Orientation & studio format",
      "Agentic coding fundamentals",
      "Working with LLM agents as collaborators",
      "State management patterns",
      "Prototyping under a deadline",
      "Assignment 1 retro & lessons",
      "Full-stack foundations (assignment 2 retro)",
      "Databases & persistence",
      "Deployment & infrastructure",
      "Design systems & UI polish",
      "Final project studio time",
      "Showcase & wrap-up",
    ],
  },
  {
    code: "ARTV2013",
    title: "Digital Media Arts",
    term: "Semester 2, 2026",
    overview: "Studio practice across sound, image and interactive installation.",
    termStart: "2026-07-27",
    assessments: [
      {
        title: "Concept Journal Submission",
        dueDate: addDaysISO(-12),
        weight: 20,
        kind: "assignment",
        description:
          "A running journal of ideas, sketches and experiments from the studio's first weeks — sound, " +
          "image and interaction tests, with a short note on what each one taught you. Submit as a PDF " +
          "scan or exported document.",
      },
      {
        title: "Studio Project Milestone 2",
        dueDate: addDaysISO(6),
        weight: 30,
        kind: "assignment",
        description:
          "A checkpoint on your main studio project: a working prototype plus a short statement of " +
          "what's resolved and what's still open going into install week.",
      },
      {
        title: "Exhibition Folio",
        dueDate: addDaysISO(40),
        weight: 50,
        kind: "assignment",
        description:
          "Documentation of your finished installation for the end-of-semester exhibition: photos or " +
          "video of the work running, plus an artist statement. Submit as a PDF folio.",
      },
    ],
    lectures: [
      "Orientation & studio safety",
      "Sound as material",
      "Generative image-making",
      "Interactive installation basics",
      "Sensors & physical computing",
      "Concept journal workshop",
      "Exhibition design principles",
      "Sound + image synthesis",
      "Audience & participation",
      "Critique & iteration",
      "Install week studio time",
      "Exhibition opening",
    ],
  },
  {
    code: "PSYC2005",
    title: "Cognitive Psychology",
    term: "Semester 2, 2026",
    overview: "How memory, attention and reasoning have been studied experimentally.",
    termStart: "2026-08-03",
    assessments: [
      {
        title: "Research Report Draft",
        dueDate: addDaysISO(-25),
        weight: 20,
        kind: "assignment",
        description:
          "A draft of your empirical research report in APA format: introduction, method, results and " +
          "discussion for the study run in the department's lab sessions. Submit as a PDF.",
      },
      {
        title: "Lab Report",
        dueDate: addDaysISO(1),
        weight: 30,
        kind: "assignment",
        description:
          "A short report analysing the data from this week's lab session — a write-up of the method " +
          "plus a stats appendix. Submit as a PDF or plain text.",
      },
      {
        title: "Exam Revision Quiz",
        dueDate: addDaysISO(21),
        weight: null,
        kind: "exam",
        description:
          "A low-stakes practice quiz covering memory, attention and reasoning — the same format as the " +
          "end-of-semester exam, worked through in your own time to check where the gaps are.",
      },
    ],
    lectures: [
      "Introduction to cognitive psychology",
      "Attention & perception",
      "Working memory models",
      "Long-term memory & encoding",
      "Forgetting & retrieval",
      "Research report workshop",
      "Language & cognition",
      "Reasoning & decision-making",
      "Problem solving",
      "Cognitive development",
      "Applied cognitive psychology",
      "Revision & exam prep",
    ],
  },
] as const;

// One lecture per teaching week, in order, plus two readings pinned relative
// to "now" — one to catch up on, one to get ahead with — so the resources
// list always has something plausible in both directions regardless of which
// week the app happens to be booted in.
function resourcesFor(termStart: string, lectures: readonly string[]) {
  const current = currentWeekFor(termStart) ?? 1;
  const items = lectures.map((title, i) => ({ week: i + 1, kind: "lecture", title, url: null as string | null }));
  items.push({
    week: Math.max(1, current - 2),
    kind: "reading",
    title: "Background reading",
    url: null,
  });
  items.push({
    week: Math.min(TEACHING_WEEKS, current + 1),
    kind: "reading",
    title: "Next week's reading (get ahead)",
    url: null,
  });
  return items;
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

      for (const r of resourcesFor(seed.termStart, seed.lectures)) {
        tx.insert(resources).values({ courseId: course.id, ...r }).run();
      }
      for (const a of seed.assessments) {
        tx.insert(assessments).values({ courseId: course.id, ...a }).run();
      }
    }
  });
}
