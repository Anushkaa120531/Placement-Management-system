import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const { userId, unreadOnly } = req.query as Record<string, string>;
    const targetUserId = userId ? parseInt(userId) : req.user!.id;
    const conditions = [eq(notificationsTable.userId, targetUserId)];
    if (unreadOnly === "true") conditions.push(eq(notificationsTable.isRead, false));
    const notifications = await db.select().from(notificationsTable)
      .where(and(...conditions)).orderBy(desc(notificationsTable.createdAt)).limit(50);
    res.json(notifications.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
  } catch (err) {
    logger.error({ err }, "List notifications error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/read", authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [notification] = await db.update(notificationsTable).set({ isRead: true }).where(eq(notificationsTable.id, id)).returning();
    res.json({ ...notification, createdAt: notification.createdAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Mark notification read error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
