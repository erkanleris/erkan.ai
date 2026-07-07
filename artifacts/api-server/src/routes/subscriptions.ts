import { Router } from "express";
import { db } from "@workspace/db";
import { subscriptionCodes, users } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();
router.use(requireAuth);

// GET /api/subscriptions/status
router.get("/status", async (req, res) => {
  const userId = res.locals["userId"] as number;
  try {
    const [user] = await db.select({
      subscriptionType: users.subscriptionType,
      subscriptionExpiresAt: users.subscriptionExpiresAt,
      dailyMessageCount: users.dailyMessageCount,
      lastMessageDate: users.lastMessageDate,
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }

    const today = new Date().toISOString().split("T")[0]!;
    const dailyCount = user.lastMessageDate === today ? user.dailyMessageCount : 0;

    let effectivePlan = user.subscriptionType;
    if (effectivePlan !== "free" && user.subscriptionExpiresAt) {
      if (new Date(user.subscriptionExpiresAt) < new Date()) effectivePlan = "free";
    }

    const limits: Record<string, number> = { free: 30, pro: 120, pro_max: 10000 };
    const limit = limits[effectivePlan] ?? 30;

    res.json({
      plan: effectivePlan,
      expiresAt: user.subscriptionExpiresAt,
      dailyUsed: dailyCount,
      dailyLimit: limit,
    });
  } catch (err) {
    req.log.error({ err }, "Subscription status error");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

// POST /api/subscriptions/activate
router.post("/activate", async (req, res) => {
  const userId = res.locals["userId"] as number;
  const { code } = req.body as { code?: string };

  if (!code?.trim()) { res.status(400).json({ error: "أدخل كود التفعيل" }); return; }

  const cleanCode = code.trim().replace(/-/g, "").toUpperCase();
  if (cleanCode.length !== 16) {
    res.status(400).json({ error: "يجب أن يتكون كود التفعيل من 16 حرفاً ورقماً" }); return;
  }

  try {
    // Check if code exists at all
    const [anyCode] = await db.select().from(subscriptionCodes)
      .where(eq(subscriptionCodes.code, cleanCode)).limit(1);

    if (!anyCode) { res.status(404).json({ error: "كود التفعيل غير صحيح" }); return; }
    if (anyCode.usedBy !== null) { res.status(409).json({ error: "تم استخدام هذا الكود مسبقاً" }); return; }

    const codeRow = anyCode;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + codeRow.durationDays * 24 * 60 * 60 * 1000);

    await db.transaction(async (tx) => {
      await tx.update(subscriptionCodes)
        .set({ usedBy: userId, usedAt: now })
        .where(eq(subscriptionCodes.id, codeRow.id));

      await tx.update(users)
        .set({
          subscriptionType: codeRow.plan,
          subscriptionExpiresAt: expiresAt,
          activationCode: codeRow.code,
        })
        .where(eq(users.id, userId));
    });

    const planNames: Record<string, string> = { free: "مجاني", pro: "برو", pro_max: "برو ماكس" };

    res.json({
      success: true,
      plan: codeRow.plan,
      planName: planNames[codeRow.plan] ?? codeRow.plan,
      expiresAt: expiresAt.toISOString(),
      durationDays: codeRow.durationDays,
    });
  } catch (err) {
    req.log.error({ err }, "Activate code error");
    res.status(500).json({ error: "حدث خطأ أثناء تفعيل الكود" });
  }
});

export default router;
