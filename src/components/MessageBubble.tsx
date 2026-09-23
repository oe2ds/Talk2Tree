import React, { useState } from "react";
import { ChatMessage } from "../types";
import { Volume2, Copy, Check } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  treeName: string;
  treeIcon: string;
  onSpeak: (text: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  treeIcon,
  onSpeak,
}) => {
  const [copied, setCopied] = useState(false);
  const isTree = message.role === "tree" || message.role === "assistant";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-end gap-2 my-1.5 ${
        isTree ? "justify-start" : "justify-end"
      }`}
    >
      {isTree && (
        <div className="w-8 h-8 rounded-full bg-[#DCEAD0] flex items-center justify-center text-sm shrink-0 mb-1">
          {treeIcon}
        </div>
      )}

      <div className="max-w-[85%] sm:max-w-[75%] group relative">
        <div
          className={`
            px-4 py-3 text-sm leading-relaxed tracking-normal break-words min-h-[40px] flex items-center
            ${
              isTree
                ? "bg-[#DCEAD0] text-[#2E4B3C] rounded-2xl rounded-bl-xs shadow-xs"
                : "bg-[#F2A65A] text-[#3A2410] rounded-2xl rounded-br-xs shadow-xs"
            }
          `}
        >
          {message.content ? (
            <span>{message.content}</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-[#4C6B58]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4C6B58] animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4C6B58] animate-bounce [animation-delay:150ms]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4C6B58] animate-bounce [animation-delay:300ms]"></span>
            </span>
          )}
        </div>

        {/* Small Action buttons on hover/touch for tree message */}
        {isTree && message.content.trim().length > 0 && (
          <div className="flex items-center gap-1 mt-1 px-1 opacity-80 group-hover:opacity-100 transition-opacity text-[11px] text-[#4C6B58]">
            <button
              onClick={() => onSpeak(message.content)}
              className="flex items-center gap-1 hover:text-[#2E4B3C] p-1 rounded-md hover:bg-black/5 cursor-pointer"
              title="ฟังเสียงอ่านข้อความนี้"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>อ่านออกเสียง</span>
            </button>
            <span className="text-[#8B6244]/40">•</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 hover:text-[#2E4B3C] p-1 rounded-md hover:bg-black/5 cursor-pointer"
              title="คัดลอกข้อความ"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#2E4B3C]" />
                  <span>คัดลอกแล้ว</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอก</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
