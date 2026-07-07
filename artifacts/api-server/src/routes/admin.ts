import { Router } from "express";
import { db } from "@workspace/db";
import { subscriptionCodes, users } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

const ADMIN_KEY = process.env["ADMIN_KEY"] ?? "ERKAN-ADMIN-SECRET-2025";

function checkAdmin(req: import("express").Request, res: import("express").Response): boolean {
  const auth = req.headers["authorization"];
  const key = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (key !== ADMIN_KEY) {
    res.status(403).json({ error: "مفتاح المدير غير صحيح" });
    return false;
  }
  return true;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 16; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// POST /api/admin/codes — generate a new code
router.post("/codes", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { plan, durationDays, note } = req.body as {
    plan?: string; durationDays?: number; note?: string;
  };

  const validPlans = ["free", "pro", "pro_max"];
  if (!plan || !validPlans.includes(plan)) {
    res.status(400).json({ error: "خطة غير صحيحة. الخيارات: free, pro, pro_max" }); return;
  }

  const duration = Number(durationDays) || 30;
  if (duration < 1 || duration > 3650) {
    res.status(400).json({ error: "المدة يجب أن تكون بين 1 و 3650 يوم" }); return;
  }

  try {
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.select({ id: subscriptionCodes.id }).from(subscriptionCodes)
        .where(eq(subscriptionCodes.code, code)).limit(1);
      if (!existing.length) break;
      code = generateCode();
      attempts++;
    }

    const [created] = await db.insert(subscriptionCodes).values({
      code, plan, durationDays: duration, note: note?.trim() || null,
    }).returning();

    res.json({ success: true, code: created });
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء الكود" });
  }
});

// GET /api/admin/codes — list all codes
router.get("/codes", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const codes = await db.select({
      id: subscriptionCodes.id,
      code: subscriptionCodes.code,
      plan: subscriptionCodes.plan,
      durationDays: subscriptionCodes.durationDays,
      usedBy: subscriptionCodes.usedBy,
      usedAt: subscriptionCodes.usedAt,
      note: subscriptionCodes.note,
      createdAt: subscriptionCodes.createdAt,
    }).from(subscriptionCodes).orderBy(desc(subscriptionCodes.createdAt)).limit(200);
    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ" });
  }
});

// GET /api/admin/users — list all users
router.get("/users", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      subscriptionType: users.subscriptionType,
      subscriptionExpiresAt: users.subscriptionExpiresAt,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    }).from(users).orderBy(desc(users.createdAt)).limit(500);
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ" });
  }
});

// DELETE /api/admin/codes/:id — delete unused code
router.delete("/codes/:id", async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    await db.delete(subscriptionCodes).where(eq(subscriptionCodes.id, Number(req.params["id"])));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ" });
  }
});

export default router;
