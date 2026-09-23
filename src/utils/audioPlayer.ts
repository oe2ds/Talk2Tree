// Audio player utility for raw PCM 24000Hz (from Gemini TTS) or natural segmented Web Speech API
let currentAudioContext: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];
let activeStorySessionId = 0;
let storyPauseTimeout: any = null;

/**
 * Strips leaked meta headers like /Pauses:** Use, **Pauses:**, [Pause], etc.
 */
export function sanitizeTreeReply(reply: string): string {
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

/**
 * Preload browser speech voices early to avoid initial utterance delay
 */
export function initSpeechEngine() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  try {
    cachedVoices = window.speechSynthesis.getVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        cachedVoices = window.speechSynthesis.getVoices();
      };
    }
  } catch (err) {
    console.warn("Could not preheat speech engine:", err);
  }
}

/**
 * Immediately unlock audio context on user interaction to prevent browser autoplay block
 */
export function unlockAudioContext() {
  try {
    if (typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!currentAudioContext || currentAudioContext.state === "closed") {
      currentAudioContext = new AudioContextClass();
    }
    if (currentAudioContext.state === "suspended") {
      currentAudioContext.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function stopCurrentAudio() {
  activeStorySessionId++;

  if (storyPauseTimeout) {
    clearTimeout(storyPauseTimeout);
    storyPauseTimeout = null;
  }

  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
      currentSourceNode.disconnect();
    } catch {
      // ignore if already stopped
    }
    currentSourceNode = null;
  }

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    currentUtterance = null;
  }
}

/**
 * Play base64 encoded raw PCM audio (16-bit LE, mono, 24000Hz) returned by Gemini TTS
 */
export async function playPcmAudio(
  base64Pcm: string,
  sampleRate = 24000,
  onEnded?: () => void
): Promise<boolean> {
  try {
    stopCurrentAudio();

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return false;

    if (!currentAudioContext || currentAudioContext.state === "closed") {
      currentAudioContext = new AudioContextClass({ sampleRate });
    }

    if (currentAudioContext.state === "suspended") {
      await currentAudioContext.resume();
    }

    // Convert base64 to binary ArrayBuffer
    const binaryStr = atob(base64Pcm);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Convert 16-bit PCM to Float32
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = currentAudioContext.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.copyToChannel(float32Array, 0);

    const source = currentAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(currentAudioContext.destination);

    currentSourceNode = source;
    source.onended = () => {
      if (currentSourceNode === source) {
        currentSourceNode = null;
      }
      onEnded?.();
    };

    source.start();
    return true;
  } catch (err) {
    console.warn("Failed to play PCM audio via AudioContext:", err);
    return false;
  }
}

interface StorySegment {
  text: string;
  pauseAfterMs: number;
}

/**
 * Intelligent storyteller segmenter:
 * Breaks Thai conversational text into natural rhythmic thought-units with breathing pauses.
 */
function segmentStoryText(text: string): StorySegment[] {
  // Strip emojis, symbols, markdown and asterisks
  const clean = text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    .replace(/[*_#`~[\]()]/g, " ")
    .trim();

  if (!clean) return [];

  // Convert natural sentence-ending particles followed by spaces into conversational pauses
  const prepared = clean
    .replace(/(ครับ|ค่ะ|จ้ะ|จ้า|นะจ๊ะ|นะคะ|นะ|เนอะ|ล่ะ|เอ๊ย|หนอ|เหรอ|ไหม)(\s+)/g, "$1... ")
    .replace(/(\s{2,})/g, "... ");

  const regex = /([.]{2,}|…|—|--|[\n!?;:,]+)/g;
  const segments: StorySegment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(prepared)) !== null) {
    const segment = prepared.slice(lastIndex, match.index).trim();
    if (segment) {
      const delim = match[0];
      let pauseAfterMs = 320;
      if (delim.includes("...") || delim.includes("…") || delim.includes("—") || delim.includes("\n")) {
        // Reflective storyteller pause (จังหวะหยุดคิด ดึงอารมณ์)
        pauseAfterMs = 420;
      } else if (delim === "," || delim === ";") {
        // Micro-pause for sub-clauses
        pauseAfterMs = 220;
      } else if (delim.includes("!") || delim.includes("?")) {
        pauseAfterMs = 380;
      }
      segments.push({ text: segment, pauseAfterMs });
    }
    lastIndex = regex.lastIndex;
  }

  const tail = prepared.slice(lastIndex).trim();
  if (tail) {
    segments.push({ text: tail, pauseAfterMs: 0 });
  }

  return segments;
}

/**
 * Natural storyteller voice synthesis using browser speech.
 * Delivers unhurried pacing with real breathing micro-pauses between sentences.
 */
export function playInstantSpeech(
  text: string,
  options: { pitch?: number; rate?: number } = {},
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return false;
  }

  stopCurrentAudio();

  const segments = segmentStoryText(text);
  if (segments.length === 0) return false;

  const sessionId = ++activeStorySessionId;
  let currentIndex = 0;

  // Retrieve cached voices or fresh list
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  const thVoice =
    voices.find((v) => v.lang && v.lang.toLowerCase().replace("_", "-").startsWith("th")) ||
    voices.find((v) => v.name.toLowerCase().includes("thai")) ||
    null;

  function playNextSegment() {
    if (sessionId !== activeStorySessionId) return;

    if (currentIndex >= segments.length) {
      currentUtterance = null;
      onEnd?.();
      return;
    }

    const currentSeg = segments[currentIndex];
    const utterance = new SpeechSynthesisUtterance(currentSeg.text);
    utterance.lang = "th-TH";

    if (thVoice) {
      utterance.voice = thVoice;
    }

    // Default relaxed storyteller rate (0.86) to prevent rapid/rushed speech
    utterance.pitch = options.pitch ?? 0.95;
    utterance.rate = options.rate ?? 0.88;

    utterance.onstart = () => {
      if (currentIndex === 0) {
        onStart?.();
      }
    };

    utterance.onend = () => {
      if (sessionId !== activeStorySessionId) return;
      currentIndex++;

      if (currentIndex < segments.length && currentSeg.pauseAfterMs > 0) {
        // Natural storyteller pause between sentences / thoughts
        storyPauseTimeout = setTimeout(() => {
          if (sessionId === activeStorySessionId) {
            playNextSegment();
          }
        }, currentSeg.pauseAfterMs);
      } else {
        playNextSegment();
      }
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis segment error:", e);
      if (sessionId !== activeStorySessionId) return;
      currentIndex++;
      if (currentIndex < segments.length) {
        playNextSegment();
      } else {
        currentUtterance = null;
        onEnd?.();
      }
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);

    // Chrome bug workaround: if paused unexpectedly, resume
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  try {
    playNextSegment();
    return true;
  } catch (err) {
    console.warn("Speech synthesis invocation failed:", err);
    return false;
  }
}

