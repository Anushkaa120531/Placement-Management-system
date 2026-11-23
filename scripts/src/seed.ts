import { db } from "@workspace/db";
import {
  usersTable,
  studentsTable,
  jobsTable,
  applicationsTable,
  notificationsTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const DEPARTMENTS = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"];
const COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Uber", "Airbnb", "Flipkart", "Infosys", "TCS", "Wipro"];
const ROLES = ["Software Engineer", "Full Stack Developer", "Data Scientist", "AI Engineer", "Product Manager", "Business Analyst", "DevOps Engineer", "Cloud Architect"];
const LOCATIONS = ["Bangalore", "Hyderabad", "Pune", "Mumbai", "Chennai", "Delhi", "Remote"];
const SKILLS_POOL = [
  ["Python", "Machine Learning", "TensorFlow", "SQL", "Data Analysis"],
  ["React", "Node.js", "TypeScript", "MongoDB", "Docker"],
  ["Java", "Spring Boot", "PostgreSQL", "Kubernetes", "AWS"],
  ["Python", "Django", "Redis", "Celery", "PostgreSQL"],
  ["JavaScript", "Vue.js", "GraphQL", "Firebase", "Tailwind CSS"],
  ["C++", "System Design", "Algorithms", "Data Structures", "Git"],
  ["Python", "PyTorch", "NLP", "Computer Vision", "MLOps"],
  ["Angular", "Java", "Microservices", "RabbitMQ", "Oracle"],
];

async function seed() {
  console.log("🌱 Starting seed...");
  const hash = await bcrypt.hash("password123", 10);

  // ─── Faculty (10) ──────────────────────────────────────────────────────────
  const facultyData = Array.from({ length: 10 }, (_, i) => ({
    name: `Prof. ${["Sharma", "Gupta", "Verma", "Singh", "Patel", "Kumar", "Mishra", "Joshi", "Nair", "Reddy"][i]}`,
    email: `faculty${i + 1}@campus.edu`,
    password: hash,
    role: "faculty" as const,
    department: DEPARTMENTS[i % DEPARTMENTS.length],
  }));
  for (const f of facultyData) {
    const [ex] = await db.select().from(usersTable).where(eq(usersTable.email, f.email)).limit(1);
    if (!ex) await db.insert(usersTable).values(f);
  }
  console.log("✅ Faculty seeded");

  // ─── Recruiters (10) ───────────────────────────────────────────────────────
  const recruiterNames = ["Alice Chen", "Bob Martinez", "Carol White", "David Kim", "Eva Patel", "Frank Liu", "Grace Park", "Henry Zhang", "Iris Roy", "James Wilson"];
  const recruiterData = Array.from({ length: 10 }, (_, i) => ({
    name: recruiterNames[i],
    email: `recruiter${i + 1}@hire.com`,
    password: hash,
    role: "recruiter" as const,
    company: COMPANIES[i % COMPANIES.length],
  }));
  for (const r of recruiterData) {
    const [ex] = await db.select().from(usersTable).where(eq(usersTable.email, r.email)).limit(1);
    if (!ex) await db.insert(usersTable).values(r);
  }
  console.log("✅ Recruiters seeded");

  // ─── Students (50) ─────────────────────────────────────────────────────────
  const firstNames = ["Aarav", "Priya", "Rahul", "Ananya", "Karan", "Sneha", "Arjun", "Pooja", "Vikram", "Divya", "Rohan", "Meera", "Aditya", "Kavya", "Nikhil", "Shreya", "Siddharth", "Anjali", "Akash", "Riya", "Varun", "Neha", "Amit", "Sonam", "Raj", "Pallavi", "Manish", "Swati", "Deepak", "Nisha", "Harish", "Deepika", "Suresh", "Ishita", "Rajan", "Komal", "Prakash", "Jyoti", "Manoj", "Sunita", "Abhishek", "Poonam", "Gaurav", "Shweta", "Vijay", "Anjana", "Ritesh", "Sarita", "Naveen", "Rekha"];
  const lastNames = ["Kumar", "Sharma", "Patel", "Singh", "Gupta", "Verma", "Joshi", "Mishra", "Nair", "Reddy", "Shah", "Mehta", "Iyer", "Pillai", "Rao", "Pandey", "Tiwari", "Chauhan", "Rajput", "Malhotra", "Kapoor", "Khanna", "Bose", "Das", "Ghosh"];

  for (let i = 0; i < 50; i++) {
    const email = `student${i + 1}@campus.edu`;
    const [ex] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (ex) continue;

    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const skills = SKILLS_POOL[i % SKILLS_POOL.length];
    const readiness = 45 + Math.floor(Math.random() * 50);
    const ats = 40 + Math.floor(Math.random() * 55);
    const cgpa = parseFloat((6.5 + Math.random() * 3).toFixed(2));
    const isPlaced = i < 15;

    const [user] = await db.insert(usersTable).values({
      name: `${firstNames[i]} ${lastNames[i % lastNames.length]}`,
      email,
      password: hash,
      role: "student",
      department: dept,
    }).returning();

    await db.insert(studentsTable).values({
      userId: user.id,
      department: dept,
      year: 3 + (i % 2),
      cgpa,
      readinessScore: readiness,
      atsScore: ats,
      skills,
      certifications: Math.floor(Math.random() * 5),
      projects: 1 + Math.floor(Math.random() * 6),
      placementStatus: isPlaced ? "placed" : (i < 25 ? "shortlisted" : "not_placed"),
      placedCompany: isPlaced ? COMPANIES[i % COMPANIES.length] : null,
      packageLpa: isPlaced ? parseFloat((6 + Math.random() * 30).toFixed(1)) : null,
    });
  }
  console.log("✅ Students seeded");

  // ─── Jobs (20) ─────────────────────────────────────────────────────────────
  const recruiterUsers = await db.select().from(usersTable).where(eq(usersTable.role, "recruiter"));
  const deadlines = ["2026-07-15", "2026-07-30", "2026-08-10", "2026-08-20", "2026-09-01", "2026-09-15", "2026-09-30", "2026-10-10", "2026-10-20", "2026-11-01"];

  for (let i = 0; i < 20; i++) {
    const recruiter = recruiterUsers[i % recruiterUsers.length];
    const role = ROLES[i % ROLES.length];
    const skills = SKILLS_POOL[i % SKILLS_POOL.length];
    const pkg = parseFloat((8 + Math.random() * 35).toFixed(1));
    
    await db.insert(jobsTable).values({
      recruiterId: recruiter.id,
      companyName: COMPANIES[i % COMPANIES.length],
      jobRole: role,
      packageLpa: pkg,
      location: LOCATIONS[i % LOCATIONS.length],
      eligibilityCriteria: `B.Tech/M.Tech in CS/IT/ECE. Min CGPA: ${(6 + (i % 3)).toFixed(1)}. No active backlogs.`,
      deadline: deadlines[i % deadlines.length],
      description: `We are looking for a talented ${role} to join our team. You will work on cutting-edge technology and solve complex problems. The ideal candidate should have strong fundamentals and a passion for building great products.`,
      requiredSkills: skills,
      isActive: i < 18,
    });
  }
  console.log("✅ Jobs seeded");

  // ─── Applications (random) ──────────────────────────────────────────────────
  const studentUsers = await db.select().from(studentsTable);
  const jobs = await db.select().from(jobsTable);
  const statuses: ("applied" | "shortlisted" | "interview_scheduled" | "selected" | "rejected")[] = ["applied", "shortlisted", "interview_scheduled", "selected", "rejected"];

  for (let i = 0; i < Math.min(studentUsers.length, 30); i++) {
    const student = studentUsers[i];
    const numApps = 1 + Math.floor(Math.random() * 4);
    const usedJobs = new Set<number>();

    for (let j = 0; j < numApps; j++) {
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      if (usedJobs.has(job.id)) continue;
      usedJobs.add(job.id);

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      await db.insert(applicationsTable).values({
        studentId: student.id,
        jobId: job.id,
        status,
        notes: status === "rejected" ? "Application reviewed. Thank you for your interest." : null,
      });
    }
  }
  console.log("✅ Applications seeded");

  // ─── Notifications ──────────────────────────────────────────────────────────
  const allStudentUsers = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.role, "student"));
  for (const user of allStudentUsers.slice(0, 20)) {
    await db.insert(notificationsTable).values([
      { userId: user.id, title: "Welcome to PlacePro!", message: "Your account has been set up. Start exploring job opportunities.", type: "general" },
      { userId: user.id, title: "New Drive Posted", message: "Google has posted a new SDE drive. Apply before the deadline!", type: "drive" },
    ]);
  }
  console.log("✅ Notifications seeded");

  console.log("\n🎉 Seed complete!");
  console.log("\n📋 Demo Credentials:");
  console.log("   Student:   student1@campus.edu  / password123");
  console.log("   Recruiter: recruiter1@hire.com  / password123");
  console.log("   Faculty:   faculty1@campus.edu  / password123");
}

seed().catch(console.error).finally(() => process.exit(0));
