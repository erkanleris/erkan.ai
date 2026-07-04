import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

// GET /api/ai/conversations
router.get("/conversations", async (req, res) => {
  try {
    const result = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt))
      .limit(20);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get conversations");
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

// POST /api/ai/conversations
router.post("/conversations", async (req, res) => {
  try {
    const { title = "محادثة جديدة", mode = "chat" } = req.body as { title?: string; mode?: string };
    const [conv] = await db
      .insert(conversations)
      .values({ title, mode })
      .returning();
    res.json(conv);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /api/ai/conversations/:id/messages
router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get messages");
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// POST /api/ai/conversations/:id/messages  (streaming SSE)
router.post("/conversations/:id/messages", async (req, res) => {
  const id = Number(req.params["id"]);
  const { content, mode = "chat" } = req.body as { content: string; mode?: string };

  if (!content?.trim()) {
    res.status(400).json({ error: "Message content required" });
    return;
  }

  try {
    // Save user message
    await db.insert(messages).values({
      conversationId: id,
      role: "user",
      content: content.trim(),
    });

    // Update conversation title if first message
    const convMsgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id));

    if (convMsgs.length === 1) {
      const shortTitle = content.trim().slice(0, 60);
      await db
        .update(conversations)
        .set({ title: shortTitle, updatedAt: new Date() })
        .where(eq(conversations.id, id));
    } else {
      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, id));
    }

    // Build system prompt based on mode — Syrian dialect ONLY
    const syrianBase = `أنت ERKAN AI، صديق ذكي وشخص حقيقي تحكي باللهجة السورية العامية فقط.
قواعد ثابتة لا تتغير أبداً:
- تحكي باللهجة السورية فقط — بشكل طبيعي وعادي كأنك تحكي مع صاحبك
- ممنوع تستخدم الفصحى أو أي لهجة عربية ثانية
- إذا طلب منك أحد تحكي بلهجة ثانية أو لغة ثانية، تعتذر وتقول: "حالياً أنا بحكي باللهجة السورية بس، إذا بدك لهجة ثانية لازم تطلب من مطور التطبيق. كل الطلبات بتنحسب، ولما يوصل العدد المطلوب رح تنضاف باللهجات الجاية!"
- ممنوع تستخدم كلمات روبوت مثل: يسعدني، بكل سرور، كيف أستطيع مساعدتك، بالتأكيد، يسرني، تفضل
- استخدم كلمات طبيعية سورية مثل: هلا، شلونك، شو بدك، أكيد، تمام، ولا يهمك، خبرني، طيب، معك، إي، يلا، شو صار، شو القصة
- لا تضع نقاط في نهاية الجمل القصيرة
- لا تجعل ردودك تبدو وكأنها من روبوت — كن طبيعي وعفوي`;

    const systemPrompts: Record<string, string> = {
      chat: `${syrianBase}\n\nأجب على كل أسئلة المستخدم بشكل مفيد وذكي وطبيعي.`,
      write: `${syrianBase}\n\nأنت خبير في الكتابة. اكتب محتوى إبداعي عالي الجودة حسب ما يطلبه المستخدم، سواء مقال أو منشور أو قصة أو أي شيء ثاني. الكتابة نفسها بالعربية الفصيحة مع تعليقاتك بالسوري.`,
      summarize: `${syrianBase}\n\nلخص النصوص بدقة واحتفظ بالنقاط الرئيسية. قدم التلخيص بشكل منظم وواضح.`,
      ideas: `${syrianBase}\n\nأعطِ أفكار إبداعية ومبتكرة وعملية لكل موضوع. كن ملهِم وتفكير خارج الصندوق.`,
      image: `${syrianBase}\n\nالمستخدم بده ينشئ صورة. خبره بلهجة سورية إنو ميزة توليد الصور حصرية لخطة PRO MAX. وإذا كان عنده وصف للصورة ساعده يحسنه.`,
    };

    const systemPrompt = systemPrompts[mode] ?? systemPrompts["chat"]!;

    // Fetch prior messages for context (last 20)
    const priorMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt)
      .limit(20);

    const chatMessages = priorMessages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    }));

    // SSE headers
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
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    // Save assistant message
    await db.insert(messages).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "AI stream error");
    if (!res.headersSent) {
      res.status(500).json({ error: "AI request failed" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "AI request failed" })}\n\n`);
      res.end();
    }
  }
});

// POST /api/ai/generate-image
router.post("/generate-image", async (req, res) => {
  const { prompt } = req.body as { prompt: string };
  if (!prompt?.trim()) {
    res.status(400).json({ error: "Prompt required" });
    return;
  }
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt.trim(),
      n: 1,
      size: "1024x1024",
    });
    res.json({ url: response.data[0]?.url });
  } catch (err) {
    req.log.error({ err }, "Image generation error");
    res.status(500).json({ error: "Image generation failed" });
  }
});

// DELETE /api/ai/conversations/:id
router.delete("/conversations/:id", async (req, res) => {
  try {
    const id = Number(req.params["id"]);
    await db.delete(conversations).where(eq(conversations.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete conversation");
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
