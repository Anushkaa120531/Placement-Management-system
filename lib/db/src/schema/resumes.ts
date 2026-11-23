import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const resumesTable = pgTable("resumes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  atsScore: integer("ats_score").notNull().default(0),
  missingKeywords: text("missing_keywords").array().notNull().default([]),
  strengths: text("strengths").array().notNull().default([]),
  weaknesses: text("weaknesses").array().notNull().default([]),
  suggestions: text("suggestions").array().notNull().default([]),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResumeSchema = createInsertSchema(resumesTable).omit({ id: true, analyzedAt: true });
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumesTable.$inferSelect;
