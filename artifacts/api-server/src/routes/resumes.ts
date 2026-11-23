import { Router } from "express";
import { db } from "@workspace/db";
import { resumesTable, studentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

// AI-powered ATS analysis (rule-based NLP simulation)
function analyzeATS(content: string, targetRole?: string): {
  atsScore: number;
  missingKeywords: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
} {
  const lowerContent = content.toLowerCase();
  
  const roleKeywords: Record<string, string[]> = {
    "software engineer": ["java", "python", "algorithms", "data structures", "git", "agile", "rest api", "sql", "unit testing", "ci/cd"],
    "full stack developer": ["react", "node.js", "typescript", "mongodb", "postgresql", "rest api", "html", "css", "git", "docker"],
    "data scientist": ["python", "machine learning", "pandas", "numpy", "scikit-learn", "tensorflow", "sql", "statistics", "visualization", "jupyter"],
    "ai engineer": ["python", "deep learning", "pytorch", "tensorflow", "nlp", "computer vision", "mlops", "docker", "kubernetes", "api"],
    "default": ["project", "experience", "skills", "education", "achievement", "team", "leadership", "communication", "problem solving"],
  };

  const keywords = roleKeywords[targetRole?.toLowerCase() ?? "default"] || roleKeywords["default"];
  const found = keywords.filter(k => lowerContent.includes(k));
  const missing = keywords.filter(k => !lowerContent.includes(k));

  const wordCount = content.split(/\s+/).length;
  const hasQuantifiedAchievements = /\d+%|\d+x|\d+ (years|months|projects|team|users)/i.test(content);
  const hasContactInfo = /(email|phone|linkedin|github)/i.test(lowerContent);
  const hasEducation = /(bachelor|master|b\.tech|m\.tech|degree|university|college)/i.test(lowerContent);
  const hasExperience = /(experience|internship|project|worked)/i.test(lowerContent);

  let score = 40;
  score += (found.length / keywords.length) * 25;
  if (wordCount > 300) score += 10;
  if (hasQuantifiedAchievements) score += 10;
  if (hasContactInfo) score += 5;
  if (hasEducation) score += 5;
  if (hasExperience) score += 5;
  score = Math.min(98, Math.max(20, Math.round(score)));

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (found.length >= keywords.length * 0.7) strengths.push(`Strong keyword match for ${targetRole || "the role"}`);
  if (hasQuantifiedAchievements) strengths.push("Good use of quantified achievements");
  if (hasEducation) strengths.push("Educational background clearly presented");
  if (hasExperience) strengths.push("Relevant experience highlighted");
  if (wordCount > 400) strengths.push("Comprehensive resume content");

  if (missing.length > 2) weaknesses.push(`Missing key skills: ${missing.slice(0, 3).join(", ")}`);
  if (!hasQuantifiedAchievements) weaknesses.push("Lacks quantified achievements (numbers, percentages)");
  if (wordCount < 200) weaknesses.push("Resume is too brief — needs more detail");
  if (missing.length > keywords.length * 0.5) weaknesses.push("Keyword density is low for ATS systems");

  if (missing.length > 0) suggestions.push(`Add these missing skills: ${missing.slice(0, 4).join(", ")}`);
  if (!hasQuantifiedAchievements) suggestions.push("Add metrics to achievements (e.g., 'Improved performance by 30%')");
  suggestions.push("Use action verbs: Developed, Implemented, Optimized, Led");
  suggestions.push("Ensure consistent formatting and bullet points");
  if (wordCount < 300) suggestions.push("Expand your project descriptions with impact and technologies used");

  return { atsScore: score, missingKeywords: missing, strengths, weaknesses, suggestions };
}

// Resolve actual student record ID from either a student.id or a user.id
async function resolveStudentId(rawId: number): Promise<number | null> {
  let [student] = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.id, rawId)).limit(1);
  if (!student) {
    [student] = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.userId, rawId)).limit(1);
  }
  return student?.id ?? null;
}

router.post("/analyze", authenticate, async (req, res) => {
  try {
    const { content, studentId: rawStudentId, targetRole } = req.body;
    if (!content || !rawStudentId) { res.status(400).json({ error: "content and studentId required" }); return; }

    const studentId = await resolveStudentId(parseInt(rawStudentId));
    if (!studentId) { res.status(404).json({ error: "Student not found" }); return; }

    const analysis = analyzeATS(content, targetRole);

    const existing = await db.select().from(resumesTable).where(eq(resumesTable.studentId, studentId)).limit(1);
    let result;
    if (existing.length > 0) {
      [result] = await db.update(resumesTable).set({
        content,
        ...analysis,
        analyzedAt: new Date(),
      }).where(eq(resumesTable.studentId, studentId)).returning();
    } else {
      [result] = await db.insert(resumesTable).values({ studentId, content, ...analysis }).returning();
    }

    await db.update(studentsTable).set({ atsScore: analysis.atsScore }).where(eq(studentsTable.id, studentId));

    res.json({
      studentId: result.studentId,
      atsScore: result.atsScore,
      missingKeywords: result.missingKeywords,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      suggestions: result.suggestions,
      analyzedAt: result.analyzedAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Analyze resume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/student/:studentId", authenticate, async (req, res) => {
  try {
    const studentId = await resolveStudentId(parseInt(req.params.studentId));
    if (!studentId) { res.status(404).json({ error: "Student not found" }); return; }

    const [resume] = await db.select().from(resumesTable).where(eq(resumesTable.studentId, studentId)).orderBy(desc(resumesTable.analyzedAt)).limit(1);
    if (!resume) { res.status(404).json({ error: "No resume analysis found" }); return; }
    res.json({
      studentId: resume.studentId,
      atsScore: resume.atsScore,
      missingKeywords: resume.missingKeywords,
      strengths: resume.strengths,
      weaknesses: resume.weaknesses,
      suggestions: resume.suggestions,
      analyzedAt: resume.analyzedAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Get student resume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
