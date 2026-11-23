import { Router } from "express";
import { db } from "@workspace/db";
import { applicationsTable, studentsTable, jobsTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

async function getStudentForUser(userId: number) {
  const [s] = await db.select().from(studentsTable).where(eq(studentsTable.userId, userId)).limit(1);
  return s;
}

async function resolveStudentId(rawId: number): Promise<number | null> {
  let [s] = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.id, rawId)).limit(1);
  if (!s) [s] = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.userId, rawId)).limit(1);
  return s?.id ?? null;
}

router.get("/", authenticate, async (req, res) => {
  try {
    const { studentId: rawStudentId, jobId, recruiterId, status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = db.select({
      id: applicationsTable.id,
      studentId: applicationsTable.studentId,
      jobId: applicationsTable.jobId,
      status: applicationsTable.status,
      appliedAt: applicationsTable.appliedAt,
      updatedAt: applicationsTable.updatedAt,
      interviewDate: applicationsTable.interviewDate,
      notes: applicationsTable.notes,
    }).from(applicationsTable).$dynamic();

    const conditions = [];
    if (rawStudentId) {
      const resolvedId = await resolveStudentId(parseInt(rawStudentId));
      if (resolvedId) conditions.push(eq(applicationsTable.studentId, resolvedId));
    }
    if (jobId) conditions.push(eq(applicationsTable.jobId, parseInt(jobId)));
    if (status) conditions.push(eq(applicationsTable.status, status as "applied" | "shortlisted" | "interview_scheduled" | "selected" | "rejected"));
    if (recruiterId) {
      const recruiterJobs = await db.select({ id: jobsTable.id }).from(jobsTable).where(eq(jobsTable.recruiterId, parseInt(recruiterId)));
      const jobIds = recruiterJobs.map(j => j.id);
      if (jobIds.length === 0) { res.json({ applications: [], total: 0, page: pageNum, limit: limitNum }); return; }
      conditions.push(inArray(applicationsTable.jobId, jobIds));
    }
    if (conditions.length > 0) query = query.where(and(...conditions));

    const [totalRes, apps] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(conditions.length > 0 ? and(...conditions) : undefined),
      query.orderBy(desc(applicationsTable.appliedAt)).limit(limitNum).offset(offset),
    ]);

    const enriched = await Promise.all(apps.map(async (app) => {
      const [student] = await db.select({
        id: studentsTable.id, userId: studentsTable.userId, name: usersTable.name, email: usersTable.email,
        department: studentsTable.department, year: studentsTable.year, cgpa: studentsTable.cgpa,
        readinessScore: studentsTable.readinessScore, atsScore: studentsTable.atsScore, skills: studentsTable.skills,
        certifications: studentsTable.certifications, projects: studentsTable.projects,
        placementStatus: studentsTable.placementStatus, placedCompany: studentsTable.placedCompany,
        packageLpa: studentsTable.packageLpa, avatar: usersTable.avatar, createdAt: studentsTable.createdAt,
      }).from(studentsTable).innerJoin(usersTable, eq(studentsTable.userId, usersTable.id)).where(eq(studentsTable.id, app.studentId)).limit(1);

      const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId)).limit(1);
      const [appCount] = await db.select({ count: sql<number>`count(*)` }).from(applicationsTable).where(eq(applicationsTable.jobId, app.jobId));

      return {
        ...app,
        appliedAt: app.appliedAt.toISOString(),
        updatedAt: app.updatedAt?.toISOString(),
        interviewDate: app.interviewDate?.toISOString() ?? null,
        student: student ? { ...student, createdAt: student.createdAt.toISOString() } : null,
        job: job ? { ...job, totalApplications: Number(appCount?.count ?? 0), createdAt: job.createdAt.toISOString() } : null,
      };
    }));

    res.json({ applications: enriched, total: Number(totalRes[0]?.count ?? 0), page: pageNum, limit: limitNum });
  } catch (err) {
    logger.error({ err }, "List applications error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) { res.status(400).json({ error: "jobId required" }); return; }

    const student = await getStudentForUser(req.user!.id);
    if (!student) { res.status(403).json({ error: "Only students can apply" }); return; }

    const existing = await db.select().from(applicationsTable)
      .where(and(eq(applicationsTable.studentId, student.id), eq(applicationsTable.jobId, jobId))).limit(1);
    if (existing.length > 0) { res.status(409).json({ error: "Already applied to this job" }); return; }

    const [app] = await db.insert(applicationsTable).values({ studentId: student.id, jobId }).returning();

    await db.insert(notificationsTable).values({
      userId: req.user!.id,
      title: "Application Submitted",
      message: `Your application has been submitted successfully for job #${jobId}`,
      type: "application",
    });

    res.status(201).json({ ...app, appliedAt: app.appliedAt.toISOString(), updatedAt: app.updatedAt?.toISOString(), interviewDate: null, notes: null });
  } catch (err) {
    logger.error({ err }, "Create application error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [app] = await db.select().from(applicationsTable).where(eq(applicationsTable.id, id)).limit(1);
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
    res.json({ ...app, appliedAt: app.appliedAt.toISOString(), updatedAt: app.updatedAt?.toISOString(), interviewDate: app.interviewDate?.toISOString() ?? null });
  } catch (err) {
    logger.error({ err }, "Get application error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, interviewDate, notes } = req.body;
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (interviewDate) updates.interviewDate = new Date(interviewDate);
    if (notes !== undefined) updates.notes = notes;

    const [app] = await db.update(applicationsTable).set(updates).where(eq(applicationsTable.id, id)).returning();

    const [student] = await db.select({ userId: studentsTable.userId }).from(studentsTable).where(eq(studentsTable.id, app.studentId)).limit(1);
    if (student && status) {
      await db.insert(notificationsTable).values({
        userId: student.userId,
        title: "Application Update",
        message: `Your application status has been updated to: ${status.replace("_", " ")}`,
        type: "application",
      });
    }

    if (status === "selected") {
      const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, app.jobId)).limit(1);
      if (job) {
        await db.update(studentsTable).set({
          placementStatus: "placed",
          placedCompany: job.companyName,
          packageLpa: job.packageLpa,
        }).where(eq(studentsTable.id, app.studentId));
      }
    }

    res.json({ ...app, appliedAt: app.appliedAt.toISOString(), updatedAt: app.updatedAt?.toISOString(), interviewDate: app.interviewDate?.toISOString() ?? null });
  } catch (err) {
    logger.error({ err }, "Update application status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
