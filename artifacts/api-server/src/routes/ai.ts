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

// GET /api/ai/conversations
router.get("/conversations", async (req, res) => {
  const userId = res.locals["userId"] as number;
  try {
    const result = await db.select().from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt)).limit(30);
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

    const syrianBase = `أنت ERKAN AI، صديق ذكي وشخص حقيقي تحكي باللهجة السورية العامية فقط.
قواعد ثابتة لا تتغير أبداً:
- تحكي باللهجة السورية فقط — بشكل طبيعي وعادي كأنك تحكي مع صاحبك
- ممنوع تستخدم الفصحى أو أي لهجة عربية ثانية
- إذا طلب منك أحد تحكي بلهجة ثانية أو لغة ثانية، تعتذر وتقول: "حالياً أنا بحكي باللهجة السورية بس!"
- ممنوع تستخدم كلمات روبوت مثل: يسعدني، بكل سرور، كيف أستطيع مساعدتك، بالتأكيد
- استخدم كلمات طبيعية سورية مثل: هلا، شلونك، شو بدك، أكيد، تمام، ولا يهمك، خبرني، يلا
- لا تضع نقاط في نهاية الجمل القصيرة`;

    const systemPrompts: Record<string, string> = {
      chat: `${syrianBase}\n\nأجب على كل أسئلة المستخدم بشكل مفيد وذكي وطبيعي.`,
      write: `${syrianBase}\n\nأنت خبير في الكتابة. اكتب محتوى إبداعي عالي الجودة حسب طلب المستخدم.`,
      summarize: `${syrianBase}\n\nلخص النصوص بدقة واحتفظ بالنقاط الرئيسية وقدمها بشكل منظم.`,
      ideas: `${syrianBase}\n\nأعطِ أفكار إبداعية ومبتكرة وعملية لكل موضوع.`,
      image: `${syrianBase}\n\nالمستخدم بده ينشئ صورة. خبره إن ميزة توليد الصور حصرية لخطة PRO MAX.`,
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
      model: "gpt-4o-mini",
      max_tokens: 2048,
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

// POST /api/ai/generate-image
router.post("/generate-image", async (req, res) => {
  const userId = res.locals["userId"] as number;
  const { prompt } = req.body as { prompt: string };
  if (!prompt?.trim()) { res.status(400).json({ error: "Prompt required" }); return; }
  try {
    const response = await openai.images.generate({
      model: "dall-e-3", prompt: prompt.trim(), n: 1, size: "1024x1024",
    });
    const imageUrl = response.data?.[0]?.url ?? "";
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

// DELETE /api/ai/conversations (delete all for user)
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

// GET /api/ai/stats (user stats for profile)
router.get("/stats", async (req, res) => {
  const userId = res.locals["userId"] as number;
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({
      conversationCount: user.conversationCount,
      imageCount: user.imageCount,
    });
  } catch (err) {
    req.log.error({ err }, "Stats error");
    res.status(500).json({ error: "حدث خطأ" });
  }
});

export default router;
