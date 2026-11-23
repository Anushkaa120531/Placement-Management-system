import { pgTable, text, serial, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";

export const interviewTypeEnum = pgEnum("interview_type", ["technical", "hr", "aptitude"]);

export const interviewSessionsTable = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  interviewType: interviewTypeEnum("interview_type").notNull(),
  questions: jsonb("questions").notNull().default([]),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInterviewSessionSchema = createInsertSchema(interviewSessionsTable).omit({ id: true, createdAt: true });
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type InterviewSession = typeof interviewSessionsTable.$inferSelect;
