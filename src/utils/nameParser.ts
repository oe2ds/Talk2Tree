/**
 * Utility for detecting and extracting user's name from Thai and English conversational phrases.
 */

// Questions where user is asking the tree or someone else about a name, NOT introducing themselves
const QUESTION_GUARDS = [
  /(?:เธอ|คุณ|ต้นไม้|พี่|น้า|ลุง|เจ้า)?\s*ชื่อ(?:อะไร|ใคร|ไหน|ยังไง|ว่าอะไร)/i,
  /ทำไม(?:ถึง)?ชื่อ/i,
  /ชื่อนั้นได้แต่ใดมา/i,
  /ความหมายของชื่อ/i,
];

// Patterns for introducing oneself in Thai & English
const NAME_PATTERNS = [
  // ผมชื่อ X / ฉันชื่อ X / หนูชื่อ X / เราชื่อ X / ข้าพเจ้าชื่อ X / พี่ชื่อ X / น้องชื่อ X
  /(?:(?:ผม|ฉัน|หนู|เรา|ข้าพเจ้า|น้อง|พี่)\s*)ชื่อ(?:\s*ว่า)?\s*[:：]?\s*([ก-๙A-Za-z]+)/i,
  // (สวัสดีครับ) ชื่อ X (ครับ/ค่ะ)
  /(?:^|\s)ชื่อ(?:\s*ว่า)?\s*[:：]?\s*([ก-๙A-Za-z]+)/i,
  // เรียกผมว่า X / เรียกฉันว่า X / เรียกหนูว่า X / เรียกว่า X
  /(?:เรียก(?:ผม|ฉัน|หนู|เรา)?ว่า)\s*[:：]?\s*([ก-๙A-Za-z]+)/i,
  // English: My name is X / I'm X / Call me X
  /(?:my name is|i am|i'm|call me)\s+([A-Za-zก-๙]+)/i,
];

// Common Thai polite particles and sentence enders to strip from the extracted name
const THAI_PARTICLES = /(?:ครับ|ค่ะ|คะ|นะ|จ้ะ|จ้า|ฮะ|กั๊บ|ก็ได้|อ่ะ|เนอะ|เอง|จร้า|จ๊ะ|หวัดดี|สวัสดี)+$/;

// Common botanical and question words that should never be treated as a person's name
const STOP_WORDS = new Set([
  "อะไร", "ใคร", "ต้นไม้", "มะม่วง", "จามจุรี", "ราชพฤกษ์", "สัก", "บัวหลวง", "กล้วยไม้",
  "ครับ", "ค่ะ", "นะ", "จ้ะ", "จ้า", "ไหม", "หรือ", "ทำไม", "อย่างไร", "ดี", "เหรอ",
  "ต้น", "ใบ", "ดอก", "ราก", "ลำต้น", "ผล", "เมล็ด", "พฤกษศาสตร์", "สวน", "ป่า",
  "name", "tree", "plant", "what", "who", "why"
]);

/**
 * Extracts the user's name if they introduced themselves in the text.
 * Returns null if no introduction was detected or if the text is asking a question.
 */
export function extractUserName(text: string): string | null {
  if (!text || typeof text !== "string") return null;
  const clean = text.trim();

  // Guard against questions about tree names or botanical names
  for (const guard of QUESTION_GUARDS) {
    if (guard.test(clean)) {
      return null;
    }
  }

  for (const pattern of NAME_PATTERNS) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      let candidate = match[1].replace(/[.,!?;:\"'“”«»]/g, "").trim();
      // Strip trailing Thai polite particles
      candidate = candidate.replace(THAI_PARTICLES, "").trim();

      if (
        candidate.length >= 2 &&
        candidate.length <= 15 &&
        !STOP_WORDS.has(candidate.toLowerCase()) &&
        !STOP_WORDS.has(candidate)
      ) {
        return candidate;
      }
    }
  }

  return null;
}
