import { Router } from "express";
import { db } from "@workspace/db";
import { users, conversations, generatedImages } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();
router.use(requireAuth);

// GET /api/users/me — full profile with live stats
router.get("/me", async (req, res) => {
  try {
    const userId = req.session.userId!;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }

    const [[convRow], [imgRow]] = await Promise.all([
      db.select({ total: count() }).from(conversations).where(eq(conversations.userId, userId)),
      db.select({ total: count() }).from(generatedImages).where(eq(generatedImages.userId, userId)),
    ]);

    const convCount = convRow?.total ?? 0;
    const imgCount = imgRow?.total ?? 0;

    await db.update(users)
      .set({ conversationCount: convCount, imageCount: imgCount })
      .where(eq(users.id, userId));

    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      subscriptionType: user.subscriptionType,
      conversationCount: convCount,
      imageCount: imgCount,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (err) {
    req.log.error({ err }, "Get profile error");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

// PUT /api/users/me — update name, username, bio, avatarUrl
router.put("/me", async (req, res) => {
  const userId = req.session.userId!;
  const { name, username, bio, avatarUrl } = req.body as {
    name?: string; username?: string; bio?: string; avatarUrl?: string;
  };

  if (name !== undefined && !name.trim()) {
    res.status(400).json({ error: "الاسم لا يمكن أن يكون فارغاً" });
    return;
  }
  if (username !== undefined && !username.trim()) {
    res.status(400).json({ error: "اسم المستخدم لا يمكن أن يكون فارغاً" });
    return;
  }

  try {
    const updates: Partial<typeof users.$inferInsert> = {};
    if (name !== undefined) updates.name = name.trim();
    if (username !== undefined) updates.username = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (bio !== undefined) updates.bio = bio.trim() || null;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl || null;

    const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
    if (!updated) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }

    res.json({
      id: updated.id, name: updated.name, username: updated.username,
      email: updated.email, bio: updated.bio, avatarUrl: updated.avatarUrl,
      subscriptionType: updated.subscriptionType,
    });
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes("unique")) {
      res.status(409).json({ error: "اسم المستخدم مستخدم مسبقاً" });
      return;
    }
    req.log.error({ err }, "Update profile error");
    res.status(500).json({ error: "حدث خطأ أثناء الحفظ" });
  }
});

// PUT /api/users/me/password — change password
router.put("/me/password", async (req, res) => {
  const userId = req.session.userId!;
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "كلمة المرور الحالية والجديدة مطلوبتان" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
    return;
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Change password error");
    res.status(500).json({ error: "حدث خطأ أثناء تغيير كلمة المرور" });
  }
});

// DELETE /api/users/me — delete account + all data (cascade handles conversations, images)
router.delete("/me", async (req, res) => {
  const userId = req.session.userId!;
  try {
    await db.delete(users).where(eq(users.id, userId));
    req.session.destroy(() => {});
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete account error");
    res.status(500).json({ error: "حدث خطأ أثناء حذف الحساب" });
  }
});

// GET /api/users/me/images — list generated images
router.get("/me/images", async (req, res) => {
  try {
    const imgs = await db
      .select()
      .from(generatedImages)
      .where(eq(generatedImages.userId, req.session.userId!))
      .orderBy(generatedImages.createdAt);
    res.json(imgs);
  } catch (err) {
    req.log.error({ err }, "Get images error");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

// DELETE /api/users/me/images/:id
router.delete("/me/images/:id", async (req, res) => {
  try {
    const imgId = Number(req.params["id"]);
    await db.delete(generatedImages)
      .where(eq(generatedImages.id, imgId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete image error");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

export default router;
