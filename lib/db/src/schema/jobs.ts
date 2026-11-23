import { pgTable, text, serial, timestamp, integer, real, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  recruiterId: integer("recruiter_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  jobRole: text("job_role").notNull(),
  packageLpa: real("package_lpa").notNull(),
  location: text("location").notNull(),
  eligibilityCriteria: text("eligibility_criteria").notNull(),
  deadline: date("deadline", { mode: "string" }).notNull(),
  description: text("description").notNull(),
  requiredSkills: text("required_skills").array().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
