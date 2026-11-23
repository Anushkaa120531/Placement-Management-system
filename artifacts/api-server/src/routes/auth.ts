import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import { usersTable, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateToken, authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    res.status(400).json({ error: "email, password, and role are required" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.role !== role) {
      res.status(401).json({ error: `This account does not have ${role} access` });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        company: user.company,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Valid faculty codes issued by the university administration
const VALID_FACULTY_CODES = new Set([
  "FAC2024", "UNIV001", "CS2024", "IT2024", "ECE2024",
  "MECH2024", "CIVIL2024", "PROF2024", "DEPT001", "STAFF2024",
]);

router.post("/register", async (req, res) => {
  const { name, email, password, role, department, company, facultyCode } = req.body;
  if (!name || !email || !password || !role) {
    res.status(400).json({ error: "name, email, password, and role are required" });
    return;
  }
  if (role === "faculty") {
    if (!facultyCode) {
      res.status(400).json({ error: "Faculty code is required for faculty registration" });
      return;
    }
    if (!VALID_FACULTY_CODES.has(facultyCode.trim().toUpperCase())) {
      res.status(403).json({ error: "Invalid faculty code. Please contact the university administration." });
      return;
    }
  }

  const FREE_EMAIL_DOMAINS = new Set([
    "gmail.com","yahoo.com","yahoo.in","yahoo.co.in","hotmail.com","outlook.com",
    "live.com","icloud.com","protonmail.com","zoho.com","aol.com","ymail.com",
    "rediffmail.com","mail.com","gmx.com","inbox.com","fastmail.com","tutanota.com",
  ]);
  if (role === "recruiter") {
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain || FREE_EMAIL_DOMAINS.has(domain)) {
      res.status(400).json({ error: "Recruiters must register with a company email address. Free email providers are not accepted." });
      return;
    }
  }
  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      name, email, password: hashed, role, department, company,
    }).returning();

    if (role === "student") {
      await db.insert(studentsTable).values({
        userId: user.id,
        department: department || "Computer Science",
        skills: [],
      });
    }

    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    res.status(201).json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, role: user.role,
        department: user.department, company: user.company,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    logger.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      department: user.department, company: user.company,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "GetMe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
