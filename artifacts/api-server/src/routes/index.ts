import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import studentsRouter from "./students";
import jobsRouter from "./jobs";
import applicationsRouter from "./applications";
import notificationsRouter from "./notifications";
import resumesRouter from "./resumes";
import skillsRouter from "./skills";
import interviewsRouter from "./interviews";
import achievementsRouter from "./achievements";
import analyticsRouter from "./analytics";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/students", studentsRouter);
router.use("/jobs", jobsRouter);
router.use("/applications", applicationsRouter);
router.use("/notifications", notificationsRouter);
router.use("/resumes", resumesRouter);
router.use("/skills", skillsRouter);
router.use("/interviews", interviewsRouter);
router.use("/achievements", achievementsRouter);
router.use("/analytics", analyticsRouter);
router.use("/users", usersRouter);

export default router;
