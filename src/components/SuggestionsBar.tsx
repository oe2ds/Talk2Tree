import React from "react";
import { TreeData, DEFAULT_SUGGESTIONS } from "../data/trees";
import { Sparkles } from "lucide-react";

interface SuggestionsBarProps {
  tree: TreeData;
  onSelectSuggestion: (question: string) => void;
  disabled?: boolean;
  userName?: string;
}

export const SuggestionsBar: React.FC<SuggestionsBarProps> = ({
  tree,
  onSelectSuggestion,
  disabled = false,
  userName,
}) => {
  // Combine tree-specific questions, default suggestions, and name test suggestions
  const namePrompt = userName
    ? `พี่จำชื่อหนูได้ไหม?`
    : `สวัสดีครับ ผมชื่อต้นกล้าครับ`;

  const questions = [
    namePrompt,
    ...tree.funQuestions.slice(0, 1),
    ...DEFAULT_SUGGESTIONS.slice(0, 1),
  ];

  return (
    <div className="px-5 sm:px-6 py-2 bg-[#FFFDF9] flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#4C6B58]">
        <Sparkles className="w-3 h-3 text-[#F2A65A]" />
        <span>คำถามแนะนำชวนคุย:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelectSuggestion(q)}
            className="text-xs border border-[#E4DCC9] bg-[#FFFDF9] hover:bg-[#FBF7EE] text-[#4C6B58] hover:text-[#2E4B3C] hover:border-[#6B9971] rounded-full px-3 py-1.5 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-left"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
