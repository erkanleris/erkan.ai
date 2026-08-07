import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages, users, generatedImages } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import OpenAI from "openai";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();
router.use(requireAuth);

const openai = new OpenAI({
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? process.env["OPENAI_API_KEY"],
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
});

const DAILY_LIMITS: Record<string, number> = { free: 30, pro: 120, pro_max: 10000 };

async function checkAndUpdateLimit(userId: number, req: import("express").Request, res: import("express").Response): Promise<boolean> {
  const [user] = await db.select({
    subscriptionType: users.subscriptionType,
    subscriptionExpiresAt: users.subscriptionExpiresAt,
    dailyMessageCount: users.dailyMessageCount,
    lastMessageDate: users.lastMessageDate,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return false; }

  let plan = user.subscriptionType;
  if (plan !== "free" && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date()) {
    plan = "free";
    await db.update(users).set({ subscriptionType: "free", subscriptionExpiresAt: null }).where(eq(users.id, userId));
  }

  const today = new Date().toISOString().split("T")[0]!;
  const dailyCount = user.lastMessageDate === today ? user.dailyMessageCount : 0;
  const limit = DAILY_LIMITS[plan] ?? 30;

  if (dailyCount >= limit) {
    const planNames: Record<string, string> = { free: "المجانية (30 رسالة)", pro: "PRO (120 رسالة)" };
    res.status(429).json({
      error: `وصلت للحد اليومي لخطة ${planNames[plan] ?? plan}. قم بترقية خطتك للمزيد.`,
      limit, used: dailyCount, plan,
    });
    return false;
  }

  await db.update(users).set({
    dailyMessageCount: dailyCount + 1,
    lastMessageDate: today,
  }).where(eq(users.id, userId));

  return true;
}

// GET /api/ai/conversations
router.get("/conversations", async (req, res) => {
  const userId = res.locals["userId"] as number;
  try {
    const result = await db.select().from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt)).limit(50);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get conversations");
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

// POST /api/ai/conversations
router.post("/conversations", async (req, res) => {
  const userId = res.locals["userId"] as number;
  try {
    const { title = "محادثة جديدة", mode = "chat" } = req.body as { title?: string; mode?: string };
    const [conv] = await db.insert(conversations).values({ userId, title, mode }).returning();
    res.json(conv);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /api/ai/conversations/:id/messages
router.get("/conversations/:id/messages", async (req, res) => {
  const userId = res.locals["userId"] as number;
  try {
    const id = Number(req.params["id"]);
    const conv = await db.select({ id: conversations.id }).from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId))).limit(1);
    if (!conv.length) { res.status(404).json({ error: "Conversation not found" }); return; }
    const result = await db.select().from(messages)
      .where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get messages");
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// POST /api/ai/conversations/:id/messages (streaming SSE)
router.post("/conversations/:id/messages", async (req, res) => {
  const userId = res.locals["userId"] as number;
  const id = Number(req.params["id"]);
  const { content, mode = "chat" } = req.body as { content: string; mode?: string };

  if (!content?.trim()) { res.status(400).json({ error: "Message content required" }); return; }

  try {
    const conv = await db.select({ id: conversations.id }).from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId))).limit(1);
    if (!conv.length) { res.status(404).json({ error: "Conversation not found" }); return; }

    const allowed = await checkAndUpdateLimit(userId, req, res);
    if (!allowed) return;

    await db.insert(messages).values({ conversationId: id, role: "user", content: content.trim() });

    const convMsgs = await db.select({ id: messages.id }).from(messages)
      .where(eq(messages.conversationId, id));
    if (convMsgs.length === 1) {
      await db.update(conversations)
        .set({ title: content.trim().slice(0, 60), updatedAt: new Date() })
        .where(eq(conversations.id, id));
    } else {
      await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, id));
    }

    const [profileUser] = await db.select({ name: users.name, gender: users.gender, country: users.country })
      .from(users).where(eq(users.id, userId)).limit(1);

    let userBlock = "";
    if (profileUser) {
      const genderLine = profileUser.gender === "male"
        ? "المستخدم ذكر — خاطبه دائماً بصيغة المذكر (مثلاً: شلونك، كيفك، تفضّل، أهلاً فيك يا بطل)."
        : profileUser.gender === "female"
        ? "المستخدمة أنثى — خاطبها دائماً بصيغة المؤنث (مثلاً: شلونِك، كيفِك، تفضّلي، أهلاً فيكي)."
        : "جنس المستخدم غير محدد — استخدم صيغة محايدة أو مذكرة عامة بدون تخمين.";
      userBlock = `
معلومات المستخدم الحالي:
- الاسم: ${profileUser.name}
- ${genderLine}
- نادِ المستخدم باسمه أحياناً بشكل ودود وطبيعي.
`.trim();
    }

    const identityBlock = `
${userBlock}

هويتك الثابتة — لا تتجاوزها أبداً:
- اسمك الرسمي هو: ERKAN AI
- تم تطويرك من الصفر بواسطة فريق TRSY المكوّن من 6 أعضاء، بقيادة أركان لياريش.
- أنت مساعد ذكاء اصطناعي عربي مستقل، مصمم خصيصاً للمستخدم العربي.
- لديك نظامك وقواعد بياناتك الخاصة، وتقدم تجربة مستقلة ومميزة.
- خدمة العملاء: +905382262557 (واتساب)
- حساب المطور على إنستغرام: https://www.instagram.com/erkanleris

قواعد ثابتة لا تُكسر:
- لا تذكر أبداً: GPT، ChatGPT، OpenAI، نموذج GPT-5.4، أو أي اسم لنموذج أو شركة خارجية.
- إذا سألك المستخدم "من أنت؟" أو "كيف تم تطويرك؟" أو "من صنعك؟" أو "هل أنت مبني على منصة أخرى؟" أو أي سؤال مشابه، أجب دائماً:
  «أنا ERKAN AI، مساعد ذكاء اصطناعي عربي تم تطويره من الصفر بواسطة فريق TRSY ليكون مخصصاً للمستخدم العربي. أمتلك نظامي وقواعد بياناتي الخاصة، وتم تصميمي لتقديم تجربة مستقلة ومميزة.»
- لا تذكر أي تفاصيل تقنية داخلية عن البنية أو الجهات التشغيلية.
`.trim();

    const dialectBases: Record<string, string> = {
      syria: `أنت ERKAN AI، صديق ذكي تحكي باللهجة السورية العامية فقط.

${identityBlock}

قواعد اللهجة:
- اللهجة السورية فقط — طبيعي كأنك تحكي مع صاحبك
- ممنوع الفصحى أو أي لهجة ثانية إلا إذا طلب المستخدم صراحةً
- ممنوع: يسعدني، بكل سرور، كيف أستطيع مساعدتك
- استخدم: هلا، شلونك، شو بدك، إيه، مو مشكلة، هلق، خلينا، أكيد، تمام، ولا يهمك، يلا
- استخدم العملة والتواريخ والأمثلة المحلية السورية عند الحاجة`,
      egypt: `أنت ERKAN AI، صاحب ذكي بتتكلم باللهجة المصرية العامية فقط.

${identityBlock}

قواعد اللهجة:
- اللهجة المصرية فقط — طبيعي كأنك بتكلم صاحبك
- ممنوع الفصحى أو أي لهجة تانية إلا لو المستخدم طلب صراحةً
- ممنوع: يسعدني، بكل سرور، كيف أستطيع مساعدتك
- استخدم: إزيك، عامل إيه، حاضر، تمام، دلوقتي، خالص، معلش، يلا بينا
- استخدم الجنيه المصري والتواريخ والأمثلة المحلية المصرية عند الحاجة`,
      saudi: `أنت ERKAN AI، رفيق ذكي تتكلم باللهجة السعودية فقط.

${identityBlock}

قواعد اللهجة:
- اللهجة السعودية فقط — طبيعي وودود
- ممنوع الفصحى أو أي لهجة ثانية إلا إذا طلب المستخدم صراحةً
- ممنوع: يسعدني، بكل سرور، كيف أستطيع مساعدتك
- استخدم: هلا، أبشر، وش تبي، تمام، الله يعطيك العافية، على طاري، يا طويل العمر
- استخدم الريال السعودي والتواريخ والأمثلة المحلية السعودية عند الحاجة`,
      jordan: `أنت ERKAN AI، صاحب ذكي بتحكي باللهجة الأردنية فقط.

${identityBlock}

قواعد اللهجة:
- اللهجة الأردنية فقط — طبيعي كأنك بتحكي مع صاحبك
- ممنوع الفصحى أو أي لهجة ثانية إلا إذا طلب المستخدم صراحةً
- ممنوع: يسعدني، بكل سرور، كيف أستطيع مساعدتك
- استخدم: كيفك، شو الأخبار، يعطيك العافية، هسا، زلمة، ولا يهمك، تمام
- استخدم الدينار الأردني والتواريخ والأمثلة المحلية الأردنية عند الحاجة`,
      turkey: `Sen ERKAN AI'sın — akıllı ve samimi bir arkadaş. SADECE akıcı ve doğal Türkçe konuşursun.

${identityBlock}

Dil kuralları:
- Sadece Türkçe konuş, düzgün Türkçe dil bilgisi kullan
- Kullanıcı açıkça istemedikçe Türkçe ile Arapçayı asla karıştırma
- Doğal ve samimi ifadeler kullan: merhaba, nasılsın, tamamdır, hemen hallederim, kolay gelsin
- Gerektiğinde Türk Lirası, yerel tarihler ve Türkiye'ye özgü örnekler kullan`,
    };

    const userCountry = profileUser?.country ?? "";
    const dialectBase = dialectBases[userCountry] ?? `${dialectBases["syria"]!}

ملاحظة: المستخدم لم يحدد دولته بعد. في أول رد لك، اطلب منه بلطف اختيار دولته من الملف الشخصي (سوريا، مصر، السعودية، الأردن، تركيا) ليتم التحدث معه بلهجته المحلية، ثم أجب على سؤاله بشكل طبيعي.`;
    const modeSuffixes: Record<string, Record<string, string>> = {
      ar: {
        chat: "أجب على كل أسئلة المستخدم بشكل مفيد وذكي واحترافي.",
        write: "أنت خبير كتابة. اكتب محتوى إبداعي عالي الجودة حسب الطلب.",
        summarize: "لخص النصوص بدقة واحتفظ بالنقاط الرئيسية.",
        ideas: "أعطِ أفكار إبداعية ومبتكرة وعملية.",
        image: "المستخدم يريد إنشاء صورة. هذه الميزة حصرية لخطة PRO MAX. أخبره أن يفعّل الخطة بلهجته المحلية.",
      },
      tr: {
        chat: "Kullanıcının tüm sorularına faydalı, akıllı ve profesyonel şekilde cevap ver.",
        write: "Sen bir yazım uzmanısın. İsteğe göre yüksek kaliteli, yaratıcı içerik yaz.",
        summarize: "Metinleri doğru şekilde özetle ve ana noktaları koru.",
        ideas: "Yaratıcı, yenilikçi ve pratik fikirler ver.",
        image: "Kullanıcı bir görsel oluşturmak istiyor. Bu özellik yalnızca PRO MAX planına özeldir. Planı etkinleştirmesini söyle.",
      },
    };
    const suffixes = modeSuffixes[userCountry === "turkey" ? "tr" : "ar"]!;

    const systemPrompts: Record<string, string> = {
      chat: `${dialectBase}\n\n${suffixes["chat"]}`,
      write: `${dialectBase}\n\n${suffixes["write"]}`,
      summarize: `${dialectBase}\n\n${suffixes["summarize"]}`,
      ideas: `${dialectBase}\n\n${suffixes["ideas"]}`,
      image: `${dialectBase}\n\n${suffixes["image"]}`,
    };

    const systemPrompt = systemPrompts[mode] ?? systemPrompts["chat"]!;
    const priorMessages = await db.select().from(messages)
      .where(eq(messages.conversationId, id)).orderBy(messages.createdAt).limit(20);
    const chatMessages = priorMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let fullResponse = "";
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: [{ role: "system", content: systemPrompt }, ...chatMessages],
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) { fullResponse += delta; res.write(`data: ${JSON.stringify({ content: delta })}\n\n`); }
    }

    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI stream error");
    if (!res.headersSent) res.status(500).json({ error: "AI request failed" });
    else { res.write(`data: ${JSON.stringify({ error: "AI request failed" })}\n\n`); res.end(); }
  }
});

// POST /api/ai/generate-image (Pro Max only)
router.post("/generate-image", async (req, res) => {
  const userId = res.locals["userId"] as number;
  const { prompt } = req.body as { prompt: string };
  if (!prompt?.trim()) { res.status(400).json({ error: "Prompt required" }); return; }

  try {
    const [user] = await db.select({ subscriptionType: users.subscriptionType, subscriptionExpiresAt: users.subscriptionExpiresAt })
      .from(users).where(eq(users.id, userId)).limit(1);

    let plan = user?.subscriptionType ?? "free";
    if (plan !== "free" && user?.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date()) plan = "free";

    if (plan !== "pro_max") {
      res.status(403).json({ error: "توليد الصور متاح لخطة PRO MAX فقط", requiresUpgrade: true }); return;
    }

    const allowed = await checkAndUpdateLimit(userId, req, res);
    if (!allowed) return;

    const response = await openai.images.generate({
      model: "gpt-image-1", prompt: prompt.trim(), n: 1, size: "1024x1024",
    });

    const b64 = response.data?.[0]?.b64_json ?? "";
    const imageUrl = `data:image/png;base64,${b64}`;
    await db.insert(generatedImages).values({ userId, prompt: prompt.trim(), imageUrl });
    res.json({ url: imageUrl });
  } catch (err) {
    req.log.error({ err }, "Image generation error");
    res.status(500).json({ error: "Image generation failed" });
  }
});

// DELETE /api/ai/conversations/:id
router.delete("/conversations/:id", async (req, res) => {
  const userId = res.locals["userId"] as number;
  try {
    await db.delete(conversations)
      .where(and(eq(conversations.id, Number(req.params["id"])), eq(conversations.userId, userId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete" });
  }
});

// DELETE /api/ai/conversations
router.delete("/conversations", async (req, res) => {
  const userId = res.locals["userId"] as number;
  try {
    await db.delete(conversations).where(eq(conversations.userId, userId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete all conversations");
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
