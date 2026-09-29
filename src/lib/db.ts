import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { seedIfEmpty } from "./seed";
import {
  type Assessment,
  type Course,
  type Resource,
  type Submission,
  assessments,
  courses,
  resources,
  submissions,
} from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");
client.pragma("foreign_keys = ON"); // required for schema.ts's ON DELETE CASCADE to take effect

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

// Unconditional: spec's fresh throwaway database needs this data too, and
// seedIfEmpty is a no-op once a database already has courses in it.
seedIfEmpty(db);

export type { Course, Assessment, Resource, Submission };

export function listCourses(): Course[] {
  return db.select().from(courses).orderBy(asc(courses.code)).all();
}

export function getCourseByCode(code: string): Course | undefined {
  return db.select().from(courses).where(eq(courses.code, code)).get();
}

export function getCourseById(id: number): Course | undefined {
  return db.select().from(courses).where(eq(courses.id, id)).get();
}

export function listAssessmentsForCourse(courseId: number): Assessment[] {
  return db
    .select()
    .from(assessments)
    .where(eq(assessments.courseId, courseId))
    .orderBy(asc(assessments.dueDate))
    .all();
}

export function getAssessmentById(id: number): Assessment | undefined {
  return db.select().from(assessments).where(eq(assessments.id, id)).get();
}

export function listResourcesForCourse(courseId: number): Resource[] {
  return db.select().from(resources).where(eq(resources.courseId, courseId)).orderBy(asc(resources.week)).all();
}

export type UpcomingAssessment = Assessment & { courseCode: string; courseTitle: string };

// Ascending due date puts overdue items first, then soonest-upcoming — a
// flat LIMIT already surfaces "what matters most" with no separate filter.
export function listUpcomingAssessments(limit = 8): UpcomingAssessment[] {
  return db
    .select({
      id: assessments.id,
      courseId: assessments.courseId,
      title: assessments.title,
      dueDate: assessments.dueDate,
      weight: assessments.weight,
      courseCode: courses.code,
      courseTitle: courses.title,
    })
    .from(assessments)
    .innerJoin(courses, eq(assessments.courseId, courses.id))
    .orderBy(asc(assessments.dueDate))
    .limit(limit)
    .all();
}

export function addAssessment(input: {
  courseId: number;
  title: string;
  dueDate: string;
  weight: number | null;
}): Assessment {
  return db.insert(assessments).values(input).returning().get();
}

export function getSubmissionById(id: number): Submission | undefined {
  return db.select().from(submissions).where(eq(submissions.id, id)).get();
}

export function listSubmissionsForAssessment(assessmentId: number): Submission[] {
  return db
    .select()
    .from(submissions)
    .where(eq(submissions.assessmentId, assessmentId))
    .orderBy(asc(submissions.id))
    .all();
}

export function addSubmission(input: {
  assessmentId: number;
  textContent: string | null;
  fileName: string | null;
  fileType: string | null;
  fileData: Buffer | null;
}): Submission {
  return db
    .insert(submissions)
    .values({ ...input, submittedAt: new Date().toISOString() })
    .returning()
    .get();
}
