import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createToken, getUserId, deleteToken } from "../lib/tokenStore";
import { getTokenFromRequest } from "../middleware/requireAuth";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, username, email, password } = req.body as {
    name?: string; username?: string; email?: string; password?: string;
  };

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    res.status(400).json({ error: "الاسم والبريد الإلكتروني وكلمة المرور مطلوبة" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    return;
  }

  const cleanUsername = (username?.trim() || email.split("@")[0]!)
    .toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30) || "user";

  try {
    const existing = await db.select({ id: users.id }).from(users)
      .where(or(eq(users.email, email.toLowerCase().trim()), eq(users.username, cleanUsername)))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: "البريد الإلكتروني أو اسم المستخدم مسجل مسبقاً" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({
      name: name.trim(),
      username: cleanUsername,
      email: email.toLowerCase().trim(),
      passwordHash,
      lastLoginAt: new Date(),
    }).returning();

    const token = createToken(user!.id);
    res.status(201).json({
      token,
      user: {
        id: user!.id, name: user!.name, username: user!.username,
        email: user!.email, bio: user!.bio, avatarUrl: user!.avatarUrl,
        subscriptionType: user!.subscriptionType,
        conversationCount: user!.conversationCount,
        imageCount: user!.imageCount,
        createdAt: user!.createdAt, lastLoginAt: user!.lastLoginAt,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء الحساب" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim() || !password?.trim()) {
    res.status(400).json({ error: "البريد الإلكتروني وكلمة المرور مطلوبان" });
    return;
  }

  try {
    const [user] = await db.select().from(users)
      .where(eq(users.email, email.toLowerCase().trim())).limit(1);

    if (!user) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      return;
    }

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    const token = createToken(user.id);

    res.json({
      token,
      user: {
        id: user.id, name: user.name, username: user.username,
        email: user.email, bio: user.bio, avatarUrl: user.avatarUrl,
        subscriptionType: user.subscriptionType,
        conversationCount: user.conversationCount,
        imageCount: user.imageCount,
        createdAt: user.createdAt, lastLoginAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "حدث خطأ أثناء تسجيل الدخول" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const token = getTokenFromRequest(req);
  if (token) deleteToken(token);
  res.json({ success: true });
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  const token = getTokenFromRequest(req);
  if (!token) { res.status(401).json({ error: "غير مسجل الدخول" }); return; }

  const userId = getUserId(token);
  if (!userId) { res.status(401).json({ error: "جلسة منتهية" }); return; }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) { res.status(401).json({ error: "المستخدم غير موجود" }); return; }

    res.json({
      id: user.id, name: user.name, username: user.username,
      email: user.email, bio: user.bio, avatarUrl: user.avatarUrl,
      subscriptionType: user.subscriptionType,
      conversationCount: user.conversationCount,
      imageCount: user.imageCount,
      createdAt: user.createdAt, lastLoginAt: user.lastLoginAt,
    });
  } catch (err) {
    req.log.error({ err }, "Auth me error");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

export default router;
