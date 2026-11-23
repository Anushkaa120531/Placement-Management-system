import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, studentsTable, applicationsTable, jobsTable } from "@workspace/db";
import { eq, and, gte, ilike, or, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const { department, search, minReadiness, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = db
      .select({
        id: studentsTable.id,
        userId: studentsTable.userId,
        name: usersTable.name,
        email: usersTable.email,
        department: studentsTable.department,
        year: studentsTable.year,
        cgpa: studentsTable.cgpa,
        readinessScore: studentsTable.readinessScore,
        atsScore: studentsTable.atsScore,
        skills: studentsTable.skills,
        certifications: studentsTable.certifications,
        projects: studentsTable.projects,
        placementStatus: studentsTable.placementStatus,
        placedCompany: studentsTable.placedCompany,
        packageLpa: studentsTable.packageLpa,
        avatar: usersTable.avatar,
        createdAt: studentsTable.createdAt,
      })
      .from(studentsTable)
      .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
      .$dynamic();

    const conditions = [];
    if (department) conditions.push(eq(studentsTable.department, department));
    if (minReadiness) conditions.push(gte(studentsTable.readinessScore, parseInt(minReadiness)));
    if (search) conditions.push(or(ilike(usersTable.name, `%${search}%`), ilike(usersTable.email, `%${search}%`)));
    if (conditions.length > 0) query = query.where(and(...conditions));

    const [total, students] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(studentsTable)
        .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
        .then(r => r[0]?.count ?? 0),
      query.limit(limitNum).offset(offset),
    ]);

    res.json({
      students: students.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })),
      total: Number(total),
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    logger.error({ err }, "List students error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [student] = await db
      .select({
        id: studentsTable.id,
        userId: studentsTable.userId,
        name: usersTable.name,
        email: usersTable.email,
        department: studentsTable.department,
        year: studentsTable.year,
        cgpa: studentsTable.cgpa,
        readinessScore: studentsTable.readinessScore,
        atsScore: studentsTable.atsScore,
        skills: studentsTable.skills,
        certifications: studentsTable.certifications,
        projects: studentsTable.projects,
        placementStatus: studentsTable.placementStatus,
        placedCompany: studentsTable.placedCompany,
        packageLpa: studentsTable.packageLpa,
        avatar: usersTable.avatar,
        createdAt: studentsTable.createdAt,
      })
      .from(studentsTable)
      .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
      .where(eq(studentsTable.id, id))
      .limit(1);

    if (!student) { res.status(404).json({ error: "Student not found" }); return; }
    res.json({ ...student, createdAt: student.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Get student error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, department, year, cgpa, skills, certifications, projects } = req.body;
    
    if (name) {
      const [student] = await db.select({ userId: studentsTable.userId }).from(studentsTable).where(eq(studentsTable.id, id)).limit(1);
      if (student) await db.update(usersTable).set({ name }).where(eq(usersTable.id, student.userId));
    }
    
    const updates: Record<string, unknown> = {};
    if (department !== undefined) updates.department = department;
    if (year !== undefined) updates.year = year;
    if (cgpa !== undefined) updates.cgpa = cgpa;
    if (skills !== undefined) updates.skills = skills;
    if (certifications !== undefined) updates.certifications = certifications;
    if (projects !== undefined) updates.projects = projects;
    if (Object.keys(updates).length > 0) {
      await db.update(studentsTable).set(updates).where(eq(studentsTable.id, id));
    }

    const [updated] = await db
      .select({
        id: studentsTable.id, userId: studentsTable.userId,
        name: usersTable.name, email: usersTable.email,
        department: studentsTable.department, year: studentsTable.year, cgpa: studentsTable.cgpa,
        readinessScore: studentsTable.readinessScore, atsScore: studentsTable.atsScore,
        skills: studentsTable.skills, certifications: studentsTable.certifications,
        projects: studentsTable.projects, placementStatus: studentsTable.placementStatus,
        placedCompany: studentsTable.placedCompany, packageLpa: studentsTable.packageLpa,
        avatar: usersTable.avatar, createdAt: studentsTable.createdAt,
      })
      .from(studentsTable).innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
      .where(eq(studentsTable.id, id)).limit(1);

    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Update student error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/dashboard", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Support lookup by userId (JWT id) OR by student record id
    let [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, id)).limit(1);
    if (!student) {
      [student] = await db.select().from(studentsTable).where(eq(studentsTable.userId, id)).limit(1);
    }
    if (!student) { res.status(404).json({ error: "Student not found" }); return; }

    const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.studentId, student.id));
    const activeJobs = await db.select({ count: sql<number>`count(*)` }).from(jobsTable).where(eq(jobsTable.isActive, true));

    const totalApps = apps.length;
    const shortlisted = apps.filter(a => a.status === "shortlisted").length;
    const interviewed = apps.filter(a => a.status === "interview_scheduled").length;
    const selected = apps.filter(a => a.status === "selected").length;
    const rejected = apps.filter(a => a.status === "rejected").length;

    const recentActivity = apps.slice(-5).map((a, i) => ({
      id: a.id,
      description: `Application ${a.status.replace("_", " ")} for job #${a.jobId}`,
      timestamp: a.appliedAt.toISOString(),
      type: a.status,
    }));

    const skillProgress = (student.skills || []).slice(0, 6).map((skill, i) => ({
      skill,
      level: Math.min(90, 50 + i * 8 + Math.floor(student.readinessScore / 10)),
    }));

    const placementTimeline = [
      { date: "2025-01", event: "Profile Created", status: "completed" },
      { date: "2025-02", event: "Resume Submitted", status: student.atsScore > 0 ? "completed" : "pending" },
      { date: "2025-03", event: "First Application", status: totalApps > 0 ? "completed" : "pending" },
      { date: "2025-04", event: "Interview Round", status: interviewed > 0 || selected > 0 ? "completed" : "pending" },
      { date: "2025-05", event: "Placement", status: student.placementStatus === "placed" ? "completed" : "pending" },
    ];

    res.json({
      readinessScore: student.readinessScore,
      activeJobs: Number(activeJobs[0]?.count ?? 0),
      upcomingDrives: 3,
      totalApplications: totalApps,
      shortlisted, interviewed, selected, rejected,
      recentActivity,
      skillProgress,
      placementTimeline,
    });
  } catch (err) {
    logger.error({ err }, "Student dashboard error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
