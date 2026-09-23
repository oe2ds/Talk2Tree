import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Modality, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { TREES } from "./src/data/trees";
import { extractUserName } from "./src/utils/nameParser";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Fallback botanical response generator
function generateBotanicalFallback(
  treeId: string,
  userMessage: string,
  userName?: string,
  newlyDetectedName?: string | null
): string {
  const tree = TREES[treeId] || TREES.mango;
  const msg = userMessage.toLowerCase();
  const pronoun = tree.name.startsWith("ปู่") || tree.name.startsWith("ลุง")
    ? "หลาน"
    : tree.name.startsWith("ป้า") || tree.name.startsWith("ยาย")
    ? "หลาน"
    : "น้อง";

  // If user just introduced themselves
  if (newlyDetectedName) {
    return `ยินดีที่ได้รู้จักนะจ๊ะ${pronoun}${newlyDetectedName}! ${tree.name}ดีใจมากที่ได้คุยกับหนู... วันนี้อยากรู้ความลับทางพฤกษศาสตร์เรื่องไหนของพี่ ถามได้เลยนะจ๊ะ 🌱✨`;
  }

  // If user asks if tree remembers their name or asks for their own name
  if (
    (msg.includes("ชื่อ") || msg.includes("ลืม") || msg.includes("จำ")) &&
    (msg.includes("อะไร") || msg.includes("ไหม") || msg.includes("เหรอ") || msg.includes("ยัง") || msg.includes("ใคร"))
  ) {
    if (userName) {
      return `จำได้แม่นเลยสิจ๊ะ! หนูคือ${pronoun}${userName} คนเก่งไงล่ะ... ${tree.name}ไม่มีวันลืมชื่อเพื่อนตัวน้อยหรอกนะจ๊ะ 🌿💚`;
    }
    return `เอ... หนูกับพี่ยังไม่ได้แนะนำชื่อกันเลยนะจ๊ะ! หนูชื่ออะไรเหรอ บอกชื่อพี่ได้นะ จะได้เรียกชื่อกันสนิทสนมขึ้นจ้ะ 🌱`;
  }

  const userAddressed = userName ? `${pronoun}${userName}` : "หนู";

  if (msg.includes("โต") || msg.includes("ปลูก") || msg.includes("เกิด") || msg.includes("ขยายพันธุ์")) {
    if (treeId === "mango") return `${userAddressed}จ๋า พี่เกิดมาได้ทั้งจากเพาะเมล็ดและกิ่งตอนจ้ะ... ถ้ากิ่งตอน 3-4 ปีก็ให้ผลหวานฉ่ำแล้ว แต่ถ้าเพาะเมล็ดต้องรอ 5-8 ปีเลยนะจ๊ะ 🌱`;
    if (treeId === "banana") return `หนูเป็นไม้ล้มลุกจ้ะ${userAddressed}... ไม่มีเนื้อไม้จริง ที่เห็นลำต้นคือ 'ลำต้นเทียม' จากกาบใบซ้อนแน่น ลำต้นจริงเป็นเหง้าอยู่ใต้ดินจ้ะ! 🍌`;
    if (treeId === "fern") return `พี่ขยายพันธุ์ด้วยสปอร์เม็ดจิ๋วสีน้ำตาลใต้ใบจ้ะ${userAddressed}... ไม่มีดอกไม่มีเมล็ด เกาะอาศัยตามต้นไม้ใหญ่โดยไม่แย่งอาหารใครเลยนะ 🌿`;
    if (treeId === "cactus") return `หนูโตในทะเลทรายแดดจัดจ้ะ ปรับใบเป็นหนามเพื่อลดการคายน้ำ... สะสมน้ำในลำต้นอวบๆ ทนแล้งเก่งสุดๆ เลยนะ${userAddressed}! 🌵`;
    if (treeId === "sattaban" || treeId === "devil") return `พี่โตเร็วมากจ้ะ ปลูกง่ายด้วยการเพาะเมล็ด... โตสูงใหญ่ 15-30 เมตร กลิ่นดอกหอมเย็นคลุ้งช่วงต้นฤดูหนาวเลยนะ${userAddressed} 🍃`;
    if (treeId === "anchan" || treeId === "butterfly_pea") return `น้องเพาะง่ายจากเมล็ดฝักแก่จ้ะ ขึ้นเลื้อยตามรั้ว... มีดอกสีน้ำเงินม่วงสวยๆ ให้${userAddressed}นำไปทำน้ำอัญชันมะนาวด้วยนะ 🌺`;
    if (treeId === "ficus_general" || treeId === "banyan") return `ปู่มีรากอากาศห้อยย้อยลงมาหยั่งถึงพื้นดินกลายเป็นเสาค้ำ... แผ่กิ่งก้านให้ร่มเงาได้กว้างขวางเป็นร้อยๆ ปีเลยนะ${userAddressed} 🌳`;
  }

  if (msg.includes("รู้สึก") || msg.includes("สบาย") || msg.includes("เป็นไง") || msg.includes("เหนื่อยไหม")) {
    return `ตอนนี้${tree.name}สดชื่นดีมากเลยจ้ะ${userAddressed}! ได้สังเคราะห์แสงรับแดดอุ่นๆ และดูดน้ำใต้ดินมาเลี้ยงกิ่งก้านใบ ดีใจที่${userAddressed}แวะมาทักทายกันนะ 🌿✨`;
  }

  if (msg.includes("กลัว") || msg.includes("ภัย") || msg.includes("อันตราย")) {
    return `${tree.name}กลัวคนมาหักกิ่ง หรือทิ้งขยะใส่โคนต้นจ้ะ ถ้า${userAddressed}ช่วยกันรดน้ำ พรวนดิน และดูแลธรรมชาติ พี่ก็มีความสุขมากแล้วจ้ะ! 💚`;
  }

  if (msg.includes("ใคร") || msg.includes("เยี่ยม") || msg.includes("เพื่อน")) {
    return `มีทั้งเพื่อนนก กระรอก ผีเสื้อ และ${userAddressed}แวะมานั่งเล่นใต้ร่มเงาของ${tree.name}ทุกวันเลยจ้ะ อบอุ่นหัวใจมากๆ เลย 🌸`;
  }

  // Pick botanical fact
  const factSentences = tree.facts
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.includes("ข้อมูลจริงเกี่ยวกับตัวเอง:"));
  if (factSentences.length > 0) {
    const picked = factSentences[Math.floor(Math.random() * factSentences.length)].replace(/^-\s*/, "");
    return `เรื่องน่ารู้ของ${tree.name}ที่อยากเล่าให้${userAddressed}ฟังก็คือ: ${picked} มีคำถามเกี่ยวกับพฤกษศาสตร์ส่วนไหนอีกไหมจ๊ะ? 🌱`;
  }

  return `สวัสดีจ้ะ${userAddressed}! ${tree.name}พร้อมเล่าเรื่องวิทยาศาสตร์และธรรมชาติในโรงเรียนให้ฟังแล้วจ้ะ ถามได้เลยนะ 🌿`;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "tree-chatbot-gemini" });
});

function sanitizeTreeReply(reply: string): string {
  if (!reply || typeof reply !== "string") return "";

  let text = reply
    .replace(/\[\/?pause[s]?\]/gi, "...")
    .replace(/\(\/?pause[s]?\)/gi, "...");

  // Discard any leading lines that have no Thai text (English meta instructions like * Tone:, /Pauses:, etc.)
  const lines = text.split("\n");
  const thaiLineIndex = lines.findIndex((l) => /[\u0E00-\u0E7F]/.test(l));
  if (thaiLineIndex > 0) {
    text = lines.slice(thaiLineIndex).join("\n");
  }

  // Remove leading /Pauses:** Use or **Pauses:** Use or Pauses: ...
  text = text.replace(
    /^[ \t]*(\*|\/|-|>)*[ \t]*\**[Pp]auses?:?\**([ \t]*(Use[^\u0E00-\u0E7F]*))?[ \t]*/i,
    ""
  );
  // Remove leading meta tags like * Tone: ... or **Style:** ...
  text = text.replace(
    /^[ \t]*(\*|\/|-|>)*[ \t]*\**([A-Za-z]+:?\**|[A-Za-z]+[\s]+[A-Za-z]+:?\**)[ \t]*/,
    ""
  );
  text = text.replace(
    /^[ \t]*(\*|\/|-|>)*[ \t]*\**(คำตอบ|บทสนทนา|สไตล์|น้ำเสียง):?\**[ \t]*/,
    ""
  );

  text = text.replace(/^["'“”«»]+|["'“”«»]+$/g, "").trim();
  return text;
}

// Helper to build prompt and sanitized history payload
function prepareChatContext(params: {
  treeId?: string;
  message: string;
  history?: any[];
  userName?: string;
}) {
  const { treeId = "mango", message, history = [], userName } = params;

  // Proactively detect if the user introduced their name in this message
  const newlyDetectedName = extractUserName(message);
  const effectiveUserName =
    newlyDetectedName ||
    (typeof userName === "string" && userName.trim() ? userName.trim() : "");

  const tree = TREES[treeId] || TREES.mango;
  const voice = tree.voice;

  const pronoun = tree.name.startsWith("ปู่") || tree.name.startsWith("ลุง")
    ? "หลาน"
    : tree.name.startsWith("ป้า") || tree.name.startsWith("ยาย")
    ? "หลาน"
    : "น้อง";

  const nameInstruction = effectiveUserName
    ? `\n\nการจดจำชื่อผู้ใช้ (USER MEMORY):
- ผู้ใช้ที่กำลังคุยมีชื่อว่า "${effectiveUserName}"
- เรียกชื่อผู้ใช้ด้วยความเอ็นดู เช่น "${pronoun}${effectiveUserName}"
${
  newlyDetectedName
    ? `- ผู้ใช้เพิ่งบอกชื่อ ("${newlyDetectedName}")! ทักทายต้อนรับและขานชื่อ "${pronoun}${newlyDetectedName}" ด้วยความยินดีทันที`
    : ""
}
- หากผู้ใช้ถามว่า "ฉันชื่ออะไร" หรือ "จำชื่อได้ไหม" ให้ตอบขานชื่อ "${pronoun}${effectiveUserName}" มั่นใจและอบอุ่น`
    : `\n\nการจดจำชื่อผู้ใช้ (USER MEMORY):
- หากผู้ใช้บอกชื่อตนเอง ให้ทักทายตอบรับและขานชื่อผู้ใช้ทันที`;

  const systemPrompt = `คุณคือ ${tree.name} ตัวละครต้นไม้มีชีวิตในสวนพฤกษศาสตร์ของโรงเรียนตันตรารักษ์ กำลังคุยสดกับนักเรียน
บุคลิกและสไตล์น้ำเสียง: ${voice?.voiceStylePrompt || "อบอุ่น เป็นกันเอง อารมณ์ดี"}
ใช้สรรพนามแทนตัวเองตามชื่อต้นไม้ (เช่น ${tree.name.startsWith("ปู่") ? '"ปู่"' : tree.name.startsWith("ป้า") ? '"ป้า"' : tree.name.startsWith("น้อง") ? '"หนู" หรือ "น้อง"' : '"พี่"'}) และเรียกเด็กนักเรียนว่า "${pronoun}" หรือ "เธอ"${nameInstruction}

สไตล์การตอบแบบคุยสดตอบกลับทันใจ (Instant Responsive & Engaging):
- ตอบกลับทันที ไม่คิดนาน สั้นกระชับ 1-2 ประโยค (ความยาวประมาณ 80-140 ตัวอักษร) เพื่อให้นักเรียนได้คำตอบรวดเร็วทันใจ
- เล่าเรื่องเหมือนเพื่อนสนิทหรือผู้ใหญ่ใจดีในบรรยากาศอบอุ่นใต้ร่มไม้
- ใช้น้ำเสียงเป็นกันเอง ใส่ "..." คั่นจังหวะหายใจสั้นๆ ระหว่างประโยค
- ใช้คำลงท้ายน้ำเสียงที่เข้ากับบุคลิก เช่น จ้ะ, จ้า, นะครับ, หลานเอ๊ย
- ใช้ข้อมูลพฤกษศาสตร์ที่เป็นความจริงตามที่ให้ไว้ด้านล่างเท่านั้น

กฎสำคัญที่สุด:
- ตอบเฉพาะคำพูดของ ${tree.name} โดยตรงเท่านั้น ห้ามมีบทบรรยายกำกับฉากหรือคำว่า Pause ใดๆ ทั้งสิ้น

ข้อมูลพฤกษศาสตร์:
ชื่อวิทยาศาสตร์: ${tree.scientific?.scientificName || tree.sub}
ลักษณะ: ${tree.scientific?.plantHabit || ""}
${tree.facts}`;

  // Keep only the recent 4 turns to eliminate prefill latency
  const rawHistory = Array.isArray(history) ? history : [];
  const sanitizedTurns: Array<{ role: "user" | "model"; text: string }> = [];

  for (let i = 0; i < rawHistory.length; i++) {
    const item = rawHistory[i];
    if (!item || typeof item.content !== "string" || !item.content.trim()) continue;

    if (
      i >= rawHistory.length - 2 &&
      item.role === "user" &&
      item.content.trim() === message.trim()
    ) {
      continue;
    }

    const role = item.role === "assistant" || item.role === "tree" ? "model" : "user";
    const cleanContent = sanitizeTreeReply(item.content.trim());
    if (cleanContent) {
      sanitizedTurns.push({ role, text: cleanContent });
    }
  }

  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  const recentTurns = sanitizedTurns.slice(-4);

  for (const turn of recentTurns) {
    if (contents.length === 0) {
      if (turn.role === "user") {
        contents.push({ role: "user", parts: [{ text: turn.text }] });
      }
    } else {
      const lastRole = contents[contents.length - 1].role;
      if (turn.role !== lastRole) {
        contents.push({ role: turn.role, parts: [{ text: turn.text }] });
      }
    }
  }

  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1] = {
      role: "user",
      parts: [{ text: message.trim() }],
    };
  } else {
    contents.push({
      role: "user",
      parts: [{ text: message.trim() }],
    });
  }

  // Priority order: ultra-low latency sub-second models first
  const candidateModels: Array<{ model: string; thinkingConfig?: any }> = [
    { model: "gemini-3.5-flash-lite" },
    { model: "gemini-3.1-flash-lite", thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } },
    { model: "gemini-3.8-flash", thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } },
  ];

  return {
    tree,
    treeId,
    newlyDetectedName,
    effectiveUserName,
    systemPrompt,
    contents,
    candidateModels,
  };
}

// SSE Streaming chat endpoint for instant live typing response
app.post("/api/chat/stream", async (req, res) => {
  const { treeId = "mango", message, history = [], userName } = req.body || {};

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Missing message" });
  }

  const ctx = prepareChatContext({ treeId, message, history, userName });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const ai = getGenAI();

  if (!ai) {
    const fallbackReply = sanitizeTreeReply(
      generateBotanicalFallback(ctx.treeId, message, ctx.effectiveUserName, ctx.newlyDetectedName)
    );
    res.write(`data: ${JSON.stringify({ type: "chunk", text: fallbackReply })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done", fullReply: fallbackReply, detectedName: ctx.newlyDetectedName || (ctx.effectiveUserName || undefined), source: "botanical-engine" })}\n\n`);
    return res.end();
  }

  for (const candidate of ctx.candidateModels) {
    try {
      const config: any = {
        systemInstruction: ctx.systemPrompt,
        temperature: 0.6,
        maxOutputTokens: 150,
      };

      if (candidate.thinkingConfig) {
        config.thinkingConfig = candidate.thinkingConfig;
      }

      const stream = await ai.models.generateContentStream({
        model: candidate.model,
        contents: ctx.contents,
        config,
      });

      let accumulatedText = "";
      for await (const chunk of stream) {
        const textChunk = chunk.text || "";
        if (textChunk) {
          accumulatedText += textChunk;
          res.write(
            `data: ${JSON.stringify({
              type: "chunk",
              text: textChunk,
              detectedName: ctx.newlyDetectedName || (ctx.effectiveUserName || undefined),
            })}\n\n`
          );
        }
      }

      const finalReply = sanitizeTreeReply(accumulatedText);
      if (finalReply && finalReply.length > 5) {
        res.write(
          `data: ${JSON.stringify({
            type: "done",
            fullReply: finalReply,
            detectedName: ctx.newlyDetectedName || (ctx.effectiveUserName || undefined),
            modelUsed: candidate.model,
            source: "gemini-stream",
          })}\n\n`
        );
        return res.end();
      }
    } catch (err: any) {
      console.warn(`Streaming attempt with ${candidate.model} failed:`, err?.message || err);
      continue;
    }
  }

  // Fallback if all streams fail
  const fallbackReply = sanitizeTreeReply(
    generateBotanicalFallback(ctx.treeId, message, ctx.effectiveUserName, ctx.newlyDetectedName)
  );
  res.write(`data: ${JSON.stringify({ type: "chunk", text: fallbackReply })}\n\n`);
  res.write(
    `data: ${JSON.stringify({
      type: "done",
      fullReply: fallbackReply,
      detectedName: ctx.newlyDetectedName || (ctx.effectiveUserName || undefined),
      source: "fallback-botanical-resilient",
    })}\n\n`
  );
  res.end();
});

// Chat endpoint (Standard JSON) with instant sub-second model prioritization
app.post("/api/chat", async (req, res) => {
  try {
    const { treeId = "mango", message, history = [], userName } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Missing treeId or message" });
    }

    const ctx = prepareChatContext({ treeId, message, history, userName });
    const ai = getGenAI();

    if (!ai) {
      const fallbackReply = sanitizeTreeReply(
        generateBotanicalFallback(ctx.treeId, message, ctx.effectiveUserName, ctx.newlyDetectedName)
      );
      return res.json({
        reply: fallbackReply,
        source: "botanical-engine",
        detectedName: ctx.newlyDetectedName || (ctx.effectiveUserName || undefined),
      });
    }

    for (const candidate of ctx.candidateModels) {
      try {
        const config: any = {
          systemInstruction: ctx.systemPrompt,
          temperature: 0.6,
          maxOutputTokens: 150,
        };

        if (candidate.thinkingConfig) {
          config.thinkingConfig = candidate.thinkingConfig;
        }

        // Fast race timeout (4.0s) for prompt failover
        const responsePromise = ai.models.generateContent({
          model: candidate.model,
          contents: ctx.contents,
          config,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Model request timeout")), 4000)
        );

        const response: any = await Promise.race([responsePromise, timeoutPromise]);
        const rawReply = response.text?.trim();
        if (rawReply) {
          const cleanReply = sanitizeTreeReply(rawReply);
          if (cleanReply && cleanReply.length > 5) {
            return res.json({
              reply: cleanReply,
              source: "gemini",
              modelUsed: candidate.model,
              detectedName: ctx.newlyDetectedName || (ctx.effectiveUserName || undefined),
            });
          }
        }
      } catch (err: any) {
        console.warn(`Model ${candidate.model} failed or timed out:`, err?.message || err);
        continue;
      }
    }

    const fallbackReply = sanitizeTreeReply(
      generateBotanicalFallback(ctx.treeId, message, ctx.effectiveUserName, ctx.newlyDetectedName)
    );
    return res.json({
      reply: fallbackReply,
      source: "fallback-botanical-resilient",
      detectedName: ctx.newlyDetectedName || (ctx.effectiveUserName || undefined),
    });
  } catch (outerError: any) {
    console.error("Critical error in /api/chat:", outerError);
    const treeId = req.body?.treeId || "mango";
    const userMessage = req.body?.message || "";
    const userName = req.body?.userName;
    const detectedName = extractUserName(userMessage);
    const effective = detectedName || (typeof userName === "string" ? userName.trim() : "");
    const fallbackReply = sanitizeTreeReply(
      generateBotanicalFallback(treeId, userMessage, effective, detectedName)
    );
    return res.json({
      reply: fallbackReply,
      source: "catastrophic-fallback",
      detectedName: detectedName || (effective || undefined),
    });
  }
});

// Human-like voice synthesis endpoint using Gemini TTS API with speed acceleration
app.post("/api/tts", async (req, res) => {
  const { text, treeId } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing text to synthesize" });
  }

  const tree = TREES[treeId] || TREES.mango;
  const voice = tree.voice;
  const ai = getGenAI();

  // Clean text for speech: strip emojis, asterisks, markdown
  const cleanSpeechText = text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[*_#`~[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!ai || !cleanSpeechText) {
    return res.json({ audioBase64: null, source: "client-fallback" });
  }

  // Optimize text snippet length for fast TTS synthesis (under 95 characters)
  let speechSnippet = cleanSpeechText;
  const sentenceBoundary = cleanSpeechText.search(/[.!?\n]/);
  if (sentenceBoundary > 20 && sentenceBoundary < 95) {
    speechSnippet = cleanSpeechText.slice(0, sentenceBoundary + 1).trim();
  } else if (cleanSpeechText.length > 95) {
    speechSnippet = cleanSpeechText.slice(0, 95).replace(/[,，\s]+[^,，\s]*$/, "").trim();
  }

  try {
    const selectedVoiceName = voice?.geminiVoice || "Kore";

    const prompt = `Act as a master audiobook storyteller speaking in Thai.
Tone: Warm, friendly, deep, and conversational—like an old friend sharing nature's secrets in a peaceful garden under the trees.
Pacing: Relaxed, unhurried, with natural breath pauses where '...' appears.
Persona: ${voice?.voiceStylePrompt || 'อบอุ่น เป็นกันเอง ชวนฟัง'}
Text to narrate:
${speechSnippet}`;

    const ttsPromise = ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoiceName },
          },
        },
      },
    });

    // 3-second cap on TTS to ensure user is never left waiting
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TTS timeout")), 3000)
    );

    const response: any = await Promise.race([ttsPromise, timeoutPromise]);

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      return res.json({
        audioBase64: base64Audio,
        sampleRate: 24000,
        voiceName: selectedVoiceName,
        source: "gemini-tts",
      });
    }

    return res.json({ audioBase64: null, source: "client-fallback" });
  } catch (error) {
    // Graceful fast fallback to client-side speech synthesis
    return res.json({ audioBase64: null, source: "client-fallback" });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
