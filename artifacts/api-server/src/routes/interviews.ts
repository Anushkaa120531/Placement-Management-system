import { Router } from "express";
import { db } from "@workspace/db";
import { interviewSessionsTable, studentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";

async function resolveStudentId(rawId: number): Promise<number | null> {
  let [s] = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.id, rawId)).limit(1);
  if (!s) [s] = await db.select({ id: studentsTable.id }).from(studentsTable).where(eq(studentsTable.userId, rawId)).limit(1);
  return s?.id ?? null;
}

const router = Router();

const QUESTION_BANK: Record<string, string[]> = {
  technical: [
    "Explain the difference between Stack and Queue data structures.",
    "What is the time complexity of binary search?",
    "Describe the principles of Object-Oriented Programming.",
    "What is a RESTful API and how does it work?",
    "Explain the concept of database normalization.",
    "What is the difference between process and thread?",
    "How does garbage collection work in Java?",
    "Explain SOLID principles in software engineering.",
    "What is the difference between SQL and NoSQL databases?",
    "Describe how HTTP/HTTPS works.",
    "What is a closure in JavaScript?",
    "Explain the concept of recursion with an example.",
    "What are design patterns? Name a few commonly used ones.",
    "How would you optimize a slow database query?",
    "Explain the concept of microservices architecture.",
  ],
  hr: [
    "Tell me about yourself.",
    "Why do you want to join our company?",
    "Where do you see yourself in 5 years?",
    "What are your greatest strengths and weaknesses?",
    "Describe a challenging situation you faced and how you handled it.",
    "How do you handle pressure and tight deadlines?",
    "Tell me about a time you worked in a team and had a conflict.",
    "Why should we hire you over other candidates?",
    "What motivates you to do your best work?",
    "Describe your ideal work environment.",
    "How do you prioritize tasks when you have multiple deadlines?",
    "Tell me about a failure and what you learned from it.",
    "What are your salary expectations?",
    "How do you stay updated with the latest technology trends?",
    "Describe a project you are most proud of.",
  ],
  aptitude: [
    "If a train travels 120 km in 2 hours, what is its speed in km/h?",
    "What is the next number in the series: 2, 6, 12, 20, 30, ?",
    "A person can do a job in 10 days. Another can do it in 15 days. How long will they take together?",
    "If APPLE is coded as 12234, how is PLEA coded?",
    "Find the odd one out: 3, 5, 7, 9, 11, 13",
    "What percentage is 45 of 180?",
    "If 8 workers can build a wall in 6 days, how many workers are needed to build it in 4 days?",
    "A shopkeeper sells goods at 20% profit. What is the cost price if selling price is ₹1200?",
    "Arrange in ascending order: 5/8, 3/4, 7/12, 11/16",
    "If today is Monday, what day will it be after 100 days?",
  ],
};

const FEEDBACK_TEMPLATES = {
  excellent: [
    "Excellent answer! You demonstrated deep understanding of the concept.",
    "Outstanding response with clear explanation and relevant examples.",
    "Your answer shows strong technical knowledge and clear communication.",
  ],
  good: [
    "Good answer! Consider adding more specific examples to strengthen it.",
    "Solid response. You covered the main points effectively.",
    "Good explanation. Adding real-world application examples would make it even better.",
  ],
  average: [
    "Decent answer, but could use more depth. Focus on core concepts.",
    "You covered the basics. Try to elaborate more on the technical aspects.",
    "Average response. Practice explaining this concept with concrete examples.",
  ],
  poor: [
    "The answer needs improvement. Review the fundamental concepts of this topic.",
    "Insufficient detail. Study the topic more thoroughly and try again.",
    "This needs work. Focus on understanding the core concepts first.",
  ],
};

function getFeedback(answer: string, interviewType: string): { feedback: string; confidenceScore: number; improvements: string[] } {
  const wordCount = answer.trim().split(/\s+/).length;
  const hasExamples = /example|instance|such as|for instance|like/i.test(answer);
  const hasTechnicalTerms = /\b(algorithm|complexity|architecture|pattern|framework|database|api|server|client|function|class|object)\b/i.test(answer);

  let score = 40;
  if (wordCount > 50) score += 20;
  if (wordCount > 100) score += 10;
  if (hasExamples) score += 15;
  if (hasTechnicalTerms && interviewType === "technical") score += 15;
  score = Math.min(95, Math.max(25, score));

  const tier = score >= 80 ? "excellent" : score >= 65 ? "good" : score >= 45 ? "average" : "poor";
  const feedbacks = FEEDBACK_TEMPLATES[tier];
  const feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];

  const improvements: string[] = [];
  if (wordCount < 50) improvements.push("Provide more detailed explanations (aim for 50+ words)");
  if (!hasExamples) improvements.push("Include concrete examples to illustrate your points");
  if (interviewType === "technical" && !hasTechnicalTerms) improvements.push("Use proper technical terminology");
  improvements.push("Structure your answer with a clear beginning, middle, and conclusion");
  if (interviewType === "hr") improvements.push("Use the STAR method: Situation, Task, Action, Result");

  return { feedback, confidenceScore: score, improvements };
}

router.get("/", authenticate, async (req, res) => {
  try {
    const { studentId: rawStudentId } = req.query as Record<string, string>;
    let resolvedId: number | undefined;
    if (rawStudentId) {
      const sid = await resolveStudentId(parseInt(rawStudentId));
      resolvedId = sid ?? undefined;
    }
    const conditions = resolvedId !== undefined ? eq(interviewSessionsTable.studentId, resolvedId) : undefined;
    const sessions = await db.select().from(interviewSessionsTable).where(conditions).orderBy(desc(interviewSessionsTable.createdAt)).limit(20);
    res.json(sessions.map(s => ({
      ...s,
      questions: s.questions as { question: string; studentAnswer?: string; aiFeedback?: string; confidenceScore?: number }[],
      createdAt: s.createdAt.toISOString(),
    })));
  } catch (err) {
    logger.error({ err }, "List interviews error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { studentId: rawStudentId, interviewType } = req.body;
    if (!rawStudentId || !interviewType) { res.status(400).json({ error: "studentId and interviewType required" }); return; }
    const studentId = await resolveStudentId(parseInt(rawStudentId));
    if (!studentId) { res.status(404).json({ error: "Student not found" }); return; }
    const [session] = await db.insert(interviewSessionsTable).values({
      studentId, interviewType, questions: [], score: 0,
    }).returning();
    res.status(201).json({ ...session, questions: [], createdAt: session.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Create interview session error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/generate-questions", authenticate, async (req, res) => {
  try {
    const { interviewType, count = 5, topic } = req.body;
    const bank = QUESTION_BANK[interviewType] || QUESTION_BANK.technical;
    const shuffled = [...bank].sort(() => Math.random() - 0.5);
    const questions = shuffled.slice(0, Math.min(count, bank.length));
    res.json({ questions });
  } catch (err) {
    logger.error({ err }, "Generate questions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/evaluate", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { question, answer, interviewType } = req.body;
    if (!question || !answer) { res.status(400).json({ error: "question and answer required" }); return; }

    const evaluation = getFeedback(answer, interviewType || "technical");

    const [session] = await db.select().from(interviewSessionsTable).where(eq(interviewSessionsTable.id, id)).limit(1);
    if (session) {
      const questions = (session.questions as { question: string; studentAnswer?: string; aiFeedback?: string; confidenceScore?: number }[]) || [];
      const existingQ = questions.find(q => q.question === question);
      if (existingQ) {
        existingQ.studentAnswer = answer;
        existingQ.aiFeedback = evaluation.feedback;
        existingQ.confidenceScore = evaluation.confidenceScore;
      } else {
        questions.push({ question, studentAnswer: answer, aiFeedback: evaluation.feedback, confidenceScore: evaluation.confidenceScore });
      }
      const avgScore = questions.filter(q => q.confidenceScore).reduce((sum, q) => sum + (q.confidenceScore || 0), 0) / (questions.filter(q => q.confidenceScore).length || 1);
      await db.update(interviewSessionsTable).set({ questions, score: Math.round(avgScore) }).where(eq(interviewSessionsTable.id, id));
    }

    res.json(evaluation);
  } catch (err) {
    logger.error({ err }, "Evaluate answer error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
