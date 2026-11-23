import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/profile", authenticate, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      department: user.department, company: user.company,
      phone: user.phone, avatar: user.avatar, bio: user.bio,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Get profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profile", authenticate, async (req, res) => {
  try {
    const { name, phone, bio, avatar } = req.body;
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    
    const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.id)).returning();
    res.json({
      id: user.id, name: user.name, email: user.email, role: user.role,
      department: user.department, company: user.company,
      phone: user.phone, avatar: user.avatar, bio: user.bio,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Update profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
