import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send } from "lucide-react";

interface ChatComposerProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check SpeechRecognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setHasSpeechSupport(true);
      try {
        const recognizer = new SpeechRecognition();
        recognizer.lang = "th-TH";
        recognizer.interimResults = false;
        recognizer.maxAlternatives = 1;

        recognizer.onstart = () => {
          setIsRecording(true);
        };

        recognizer.onend = () => {
          setIsRecording(false);
        };

        recognizer.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          setIsRecording(false);
        };

        recognizer.onresult = (e: any) => {
          const transcript = e.results[0]?.[0]?.transcript;
          if (transcript) {
            setInputText(transcript);
            onSendMessage(transcript);
            setInputText("");
          }
        };

        recognitionRef.current = recognizer;
      } catch (err) {
        console.warn("Error initializing speech recognition:", err);
      }
    }
  }, [onSendMessage]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn("Cannot start speech recognition:", err);
      }
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setInputText("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-[#E4DCC9] bg-[#FFFDF9] p-4 sm:px-6 sm:py-4">
      {isRecording && (
        <div className="mb-2 text-xs text-[#E4574C] flex items-center gap-2 font-medium animate-pulse">
          <span className="w-2 h-2 rounded-full bg-[#E4574C]"></span>
          <span>🎙️ กำลังฟังเสียงภาษาไทย... พูดคำถามกับต้นไม้ได้เลย</span>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mic Button */}
        <button
          type="button"
          onClick={toggleRecording}
          disabled={!hasSpeechSupport || disabled}
          title={
            !hasSpeechSupport
              ? "เบราว์เซอร์นี้ไม่รองรับการพูด (แนะนำใช้ Google Chrome)"
              : isRecording
              ? "กดเพื่อหยุดบันทึกเสียง"
              : "กดเพื่อพูดคำถามด้วยเสียง (ภาษาไทย)"
          }
          className={`
            w-11 h-11 shrink-0 rounded-2xl border flex items-center justify-center transition-all cursor-pointer
            ${
              isRecording
                ? "bg-[#E4574C] border-[#E4574C] text-white pulse-rec"
                : "bg-[#FBF7EE] border-[#E4DCC9] text-[#4C6B58] hover:border-[#6B9971] hover:text-[#2E4B3C]"
            }
            ${!hasSpeechSupport || disabled ? "opacity-40 cursor-not-allowed" : ""}
          `}
          aria-label="พูดคำถาม"
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="พิมพ์หรือพูดคำถามถึงต้นไม้..."
          className="flex-1 bg-[#FBF7EE] border border-[#E4DCC9] rounded-2xl px-4 py-2.5 text-sm text-[#2E4B3C] placeholder-[#8B6244]/60 focus:outline-none focus:border-[#6B9971] focus:ring-1 focus:ring-[#6B9971] transition-all disabled:opacity-50"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim() || disabled}
          className="h-11 px-5 rounded-2xl bg-[#2E4B3C] hover:bg-[#4C6B58] text-[#FBF7EE] font-semibold text-sm flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer active:scale-95"
        >
          <span>ส่ง</span>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
