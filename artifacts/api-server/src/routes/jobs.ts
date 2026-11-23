import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable, applicationsTable } from "@workspace/db";
import { eq, and, gte, ilike, or, sql, desc } from "drizzle-orm";
import { authenticate, requireRole } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const { search, company, location, role, minPackage, active, recruiterId, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (recruiterId) conditions.push(eq(jobsTable.recruiterId, parseInt(recruiterId)));
    if (company) conditions.push(ilike(jobsTable.companyName, `%${company}%`));
    if (location) conditions.push(ilike(jobsTable.location, `%${location}%`));
    if (role) conditions.push(ilike(jobsTable.jobRole, `%${role}%`));
    if (minPackage) conditions.push(gte(jobsTable.packageLpa, parseFloat(minPackage)));
    if (active !== undefined && active !== "") conditions.push(eq(jobsTable.isActive, active === "true"));
    if (search) conditions.push(or(ilike(jobsTable.companyName, `%${search}%`), ilike(jobsTable.jobRole, `%${search}%`), ilike(jobsTable.location, `%${search}%`)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRes, jobs] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(whereClause),
      db.select().from(jobsTable).where(whereClause).orderBy(desc(jobsTable.createdAt)).limit(limitNum).offset(offset),
    ]);

    const jobsWithApps = await Promise.all(
      jobs.map(async (job) => {
        const [appCount] = await db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.jobId, job.id));
        return {
          ...job,
          totalApplications: Number(appCount?.count ?? 0),
          deadline: job.deadline,
          createdAt: job.createdAt.toISOString(),
        };
      })
    );

    res.json({ jobs: jobsWithApps, total: Number(totalRes[0]?.count ?? 0), page: pageNum, limit: limitNum });
  } catch (err) {
    logger.error({ err }, "List jobs error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, requireRole("recruiter"), async (req, res) => {
  try {
    const { companyName, jobRole, packageLpa, location, eligibilityCriteria, deadline, description, requiredSkills } = req.body;
    const [job] = await db.insert(jobsTable).values({
      recruiterId: req.user!.id,
      companyName, jobRole, packageLpa, location, eligibilityCriteria, deadline, description,
      requiredSkills: requiredSkills || [],
    }).returning();
    res.status(201).json({ ...job, totalApplications: 0, createdAt: job.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Create job error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    const [appCount] = await db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.jobId, id));
    res.json({ ...job, totalApplications: Number(appCount?.count ?? 0), createdAt: job.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Get job error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", authenticate, requireRole("recruiter"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = {};
    const fields = ["companyName", "jobRole", "packageLpa", "location", "eligibilityCriteria", "deadline", "description", "requiredSkills", "isActive"];
    for (const f of fields) { if (req.body[f] !== undefined) updates[f === "companyName" ? "companyName" : f] = req.body[f]; }
    const [job] = await db.update(jobsTable).set(updates).where(eq(jobsTable.id, id)).returning();
    const [appCount] = await db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.jobId, id));
    res.json({ ...job, totalApplications: Number(appCount?.count ?? 0), createdAt: job.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Update job error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticate, requireRole("recruiter"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(jobsTable).where(eq(jobsTable.id, id));
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Delete job error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/toggle", authenticate, requireRole("recruiter"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id)).limit(1);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    const [updated] = await db.update(jobsTable).set({ isActive: !job.isActive }).where(eq(jobsTable.id, id)).returning();
    const [appCount] = await db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.jobId, id));
    res.json({ ...updated, totalApplications: Number(appCount?.count ?? 0), createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Toggle job status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
