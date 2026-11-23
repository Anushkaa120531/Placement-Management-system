import { Router } from "express";
import { db } from "@workspace/db";
import { studentsTable, usersTable } from "@workspace/db";
import { eq, desc, asc, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/leaderboard", authenticate, async (req, res) => {
  try {
    const { type = "readiness", department } = req.query as Record<string, string>;

    let query = db.select({
      studentId: studentsTable.id,
      name: usersTable.name,
      department: studentsTable.department,
      readinessScore: studentsTable.readinessScore,
      atsScore: studentsTable.atsScore,
      placedCompany: studentsTable.placedCompany,
      packageLpa: studentsTable.packageLpa,
      placementStatus: studentsTable.placementStatus,
      avatar: usersTable.avatar,
    }).from(studentsTable)
      .innerJoin(usersTable, eq(studentsTable.userId, usersTable.id))
      .$dynamic();

    if (department) query = query.where(eq(studentsTable.department, department));

    const orderCol = type === "readiness"
      ? desc(studentsTable.readinessScore)
      : sql`${studentsTable.packageLpa} DESC NULLS LAST`;

    const students = await query.orderBy(orderCol).limit(50);

    const leaderboard = students
      .filter(s => type === "readiness" || (s.packageLpa != null && s.packageLpa > 0))
      .map((s, i) => ({
        rank: i + 1,
        studentId: s.studentId,
        name: s.name,
        department: s.department,
        score: type === "readiness" ? s.readinessScore : parseFloat((s.packageLpa || 0).toFixed(1)),
        packageLpa: s.packageLpa,
        placedCompany: s.placedCompany,
        placementStatus: s.placementStatus,
        avatar: s.avatar,
      }));

    res.json(leaderboard);
  } catch (err) {
    logger.error({ err }, "Leaderboard error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
