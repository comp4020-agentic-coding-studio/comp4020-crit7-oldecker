import { blob, int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.
//
// Every course is the same shape on purpose: one row here, a fixed set of
// assessments and resources hanging off it, rendered by the one shared
// course template. There is no per-course customisation column to reach
// for — that's the point.
export const courses = sqliteTable("courses", {
  id: int().primaryKey({ autoIncrement: true }),
  code: text().notNull().unique(),
  title: text().notNull(),
  term: text().notNull(),
  overview: text().notNull(),
  // ISO date "YYYY-MM-DD", the Monday teaching starts. "Current week" is
  // derived from this at render time (see src/lib/dates.ts) — never stored,
  // so it can't drift out of sync with the calendar.
  termStart: text("term_start").notNull(),
});

export const assessments = sqliteTable("assessments", {
  id: int().primaryKey({ autoIncrement: true }),
  courseId: int("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text().notNull(),
  dueDate: text("due_date").notNull(), // ISO date "YYYY-MM-DD"
  weight: int(), // percent, nullable — not every assessment is graded
  kind: text().notNull().default("assignment"), // "assignment" | "exam" — how the calendar tells them apart
  description: text(), // nullable — what the assessment actually asks for
});

export const resources = sqliteTable("resources", {
  id: int().primaryKey({ autoIncrement: true }),
  courseId: int("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  week: int().notNull(),
  title: text().notNull(),
  url: text(), // nullable — not every resource links out
  kind: text().notNull().default("reading"), // "lecture" | "reading" | "lab"
});

// A student "turns in" work against a specific assessment — text, a file, or
// both. No login exists in this prototype, so there's no owner column: every
// visitor sees the same flat list of what's been submitted, same as everyone
// sees the same assessments.
export const submissions = sqliteTable("submissions", {
  id: int().primaryKey({ autoIncrement: true }),
  assessmentId: int("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  textContent: text("text_content"), // nullable — a file-only submission has none
  fileName: text("file_name"),
  fileType: text("file_type"), // MIME type, for Content-Type on download
  fileData: blob("file_data", { mode: "buffer" }), // nullable — a text-only submission has none
  submittedAt: text("submitted_at").notNull(), // ISO datetime, set at insert time
});

export type Course = typeof courses.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
