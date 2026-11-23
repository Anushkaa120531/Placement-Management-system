import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

const TARGET_ROLES: Record<string, { required: string[]; courses: { name: string; platform: string; duration: string; level: string }[] }> = {
  "Data Scientist": {
    required: ["Python", "Machine Learning", "Pandas", "NumPy", "Scikit-learn", "SQL", "Statistics", "Data Visualization", "TensorFlow", "Jupyter"],
    courses: [
      { name: "Python for Data Science", platform: "Coursera", duration: "4 weeks", level: "Beginner" },
      { name: "Machine Learning A-Z", platform: "Udemy", duration: "6 weeks", level: "Intermediate" },
      { name: "Deep Learning Specialization", platform: "Coursera", duration: "12 weeks", level: "Advanced" },
      { name: "SQL for Data Analysis", platform: "Mode Analytics", duration: "2 weeks", level: "Beginner" },
    ],
  },
  "AI Engineer": {
    required: ["Python", "Deep Learning", "PyTorch", "TensorFlow", "NLP", "Computer Vision", "MLOps", "Docker", "Kubernetes", "REST API"],
    courses: [
      { name: "Deep Learning with PyTorch", platform: "fast.ai", duration: "8 weeks", level: "Intermediate" },
      { name: "MLOps Fundamentals", platform: "Google Cloud", duration: "4 weeks", level: "Intermediate" },
      { name: "NLP with Transformers", platform: "Hugging Face", duration: "6 weeks", level: "Advanced" },
      { name: "Docker & Kubernetes", platform: "Udemy", duration: "3 weeks", level: "Intermediate" },
    ],
  },
  "Software Engineer": {
    required: ["Java", "Python", "Data Structures", "Algorithms", "Git", "REST API", "SQL", "System Design", "Unit Testing", "CI/CD"],
    courses: [
      { name: "Data Structures & Algorithms", platform: "LeetCode", duration: "8 weeks", level: "Intermediate" },
      { name: "System Design Interview", platform: "educative.io", duration: "4 weeks", level: "Advanced" },
      { name: "Clean Code", platform: "Pluralsight", duration: "3 weeks", level: "Intermediate" },
      { name: "Git & GitHub Mastery", platform: "Udemy", duration: "1 week", level: "Beginner" },
    ],
  },
  "Full Stack Developer": {
    required: ["React", "Node.js", "TypeScript", "MongoDB", "PostgreSQL", "REST API", "HTML", "CSS", "Git", "Docker"],
    courses: [
      { name: "React - The Complete Guide", platform: "Udemy", duration: "6 weeks", level: "Intermediate" },
      { name: "Node.js & Express", platform: "Udemy", duration: "4 weeks", level: "Intermediate" },
      { name: "TypeScript Deep Dive", platform: "Frontend Masters", duration: "2 weeks", level: "Intermediate" },
      { name: "Docker for Web Developers", platform: "Udemy", duration: "2 weeks", level: "Beginner" },
    ],
  },
};

router.get("/roles", authenticate, (req, res) => {
  res.json(Object.keys(TARGET_ROLES));
});

router.post("/gap-analyze", authenticate, async (req, res) => {
  try {
    const { studentId, targetRole, currentSkills } = req.body;
    if (!targetRole || !currentSkills) { res.status(400).json({ error: "targetRole and currentSkills required" }); return; }

    const roleData = TARGET_ROLES[targetRole] || TARGET_ROLES["Software Engineer"];
    const requiredSkills = roleData.required;

    const normalizedCurrent = (currentSkills as string[]).map((s: string) => s.toLowerCase().trim());
    const matching = requiredSkills.filter(s => normalizedCurrent.some(c => c.includes(s.toLowerCase()) || s.toLowerCase().includes(c)));
    const missing = requiredSkills.filter(s => !normalizedCurrent.some(c => c.includes(s.toLowerCase()) || s.toLowerCase().includes(c)));
    const readinessPercentage = Math.round((matching.length / requiredSkills.length) * 100);

    const roadmap = missing.slice(0, 5).map((skill, i) => ({
      step: i + 1,
      description: `Learn ${skill} — essential for ${targetRole} role`,
      duration: ["2 weeks", "3 weeks", "4 weeks", "6 weeks", "8 weeks"][i] || "4 weeks",
    }));

    res.json({
      targetRole,
      matchingSkills: matching,
      missingSkills: missing,
      readinessPercentage,
      learningRoadmap: roadmap,
      recommendedCourses: roleData.courses,
    });
  } catch (err) {
    logger.error({ err }, "Skill gap analysis error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
