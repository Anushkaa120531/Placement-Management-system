import { pgTable, text, serial, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const placementStatusEnum = pgEnum("placement_status", ["not_placed", "shortlisted", "placed"]);

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  department: text("department").notNull(),
  year: integer("year").default(3),
  cgpa: real("cgpa").default(7.5),
  readinessScore: integer("readiness_score").notNull().default(50),
  atsScore: integer("ats_score").notNull().default(50),
  skills: text("skills").array().notNull().default([]),
  certifications: integer("certifications").notNull().default(0),
  projects: integer("projects").notNull().default(0),
  placementStatus: placementStatusEnum("placement_status").notNull().default("not_placed"),
  placedCompany: text("placed_company"),
  packageLpa: real("package_lpa"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
