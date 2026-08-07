import { Router } from "express";
import { db } from "@workspace/db";
import { users, conversations, generatedImages } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();
router.use(requireAuth);

type DbUser = typeof users.$inferSelect;
function userResponse(u: DbUser, extra?: { conversationCount?: number; imageCount?: number }) {
  return {
    id: u.id,
    userId: u.userId,
    name: u.name,
    username: u.username,
    email: u.email,
    bio: u.bio,
    gender: u.gender,
    country: u.country,
    avatarUrl: u.avatarUrl,
    subscriptionType: u.subscriptionType,
    subscriptionExpiresAt: u.subscriptionExpiresAt,
    activationCode: u.activationCode,
    conversationCount: extra?.conversationCount ?? u.conversationCount,
    imageCount: extra?.imageCount ?? u.imageCount,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  };
}

// GET /api/users/me
router.get("/me", async (req, res) => {
  const userId = res.locals["userId"] as number;
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }

    const [[convRow], [imgRow]] = await Promise.all([
      db.select({ total: count() }).from(conversations).where(eq(conversations.userId, userId)),
      db.select({ total: count() }).from(generatedImages).where(eq(generatedImages.userId, userId)),
    ]);

    res.json(userResponse(user, {
      conversationCount: convRow?.total ?? 0,
      imageCount: imgRow?.total ?? 0,
    }));
  } catch (err) {
    req.log.error({ err }, "Get profile error");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

// PUT /api/users/me
router.put("/me", async (req, res) => {
  const userId = res.locals["userId"] as number;
  const { name, username, bio, avatarUrl, gender, country } = req.body as {
    name?: string; username?: string; bio?: string; avatarUrl?: string; gender?: string; country?: string;
  };

  if (gender !== undefined && gender !== null && gender !== "" && gender !== "male" && gender !== "female") {
    res.status(400).json({ error: "قيمة الجنس غير صالحة" }); return;
  }

  const VALID_COUNTRIES = ["syria", "egypt", "saudi", "jordan", "turkey"];
  if (country !== undefined && country !== null && country !== "" && !VALID_COUNTRIES.includes(country)) {
    res.status(400).json({ error: "قيمة الدولة غير صالحة" }); return;
  }

  if (name !== undefined && !name.trim()) {
    res.status(400).json({ error: "الاسم لا يمكن أن يكون فارغاً" }); return;
  }

  try {
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates["name"] = name.trim();
    if (username !== undefined) updates["username"] = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (bio !== undefined) updates["bio"] = bio.trim() || null;
    if (avatarUrl !== undefined) updates["avatarUrl"] = avatarUrl || null;
    if (gender !== undefined) updates["gender"] = gender || null;
    if (country !== undefined) updates["country"] = country || null;

    const [updated] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
    if (!updated) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }
    res.json(userResponse(updated));
  } catch (err: unknown) {
    if (String(err).includes("unique")) {
      res.status(409).json({ error: "اسم المستخدم مستخدم مسبقاً" }); return;
    }
    req.log.error({ err }, "Update profile error");
    res.status(500).json({ error: "حدث خطأ أثناء الحفظ" });
  }
});

// PUT /api/users/me/password
router.put("/me/password", async (req, res) => {
  const userId = res.locals["userId"] as number;
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "كلمة المرور الحالية والجديدة مطلوبتان" }); return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" }); return;
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) { res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" }); return; }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Change password error");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

// DELETE /api/users/me
router.delete("/me", async (req, res) => {
  const userId = res.locals["userId"] as number;
  try {
    await db.delete(users).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Delete account error");
    res.status(500).json({ error: "حدث خطأ أثناء حذف الحساب" });
  }
});

// GET /api/users/me/images
router.get("/me/images", async (req, res) => {
  const userId = res.locals["userId"] as number;
  try {
    const imgs = await db.select().from(generatedImages)
      .where(eq(generatedImages.userId, userId))
      .orderBy(generatedImages.createdAt);
    res.json(imgs);
  } catch (err) {
    req.log.error({ err }, "Get images error");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

export default router;
