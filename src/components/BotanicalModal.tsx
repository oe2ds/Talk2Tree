import React, { useState } from "react";
import { TreeData } from "../data/trees";
import {
  X,
  BookOpen,
  Sun,
  Droplets,
  Sparkles,
  CheckCircle2,
  Microscope,
  Globe,
  Tag,
  Trees,
  Leaf,
  Layers,
  Info,
  Volume2,
} from "lucide-react";

interface BotanicalModalProps {
  tree: TreeData;
  isOpen: boolean;
  onClose: () => void;
  onPlayVoiceSample?: (tree: TreeData) => void;
}

export const BotanicalModal: React.FC<BotanicalModalProps> = ({
  tree,
  isOpen,
  onClose,
  onPlayVoiceSample,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "scientific">("general");

  if (!isOpen) return null;

  const factLines = tree.facts
    .replace("ข้อมูลจริงเกี่ยวกับตัวเอง:", "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const sci = tree.scientific;
  const voice = tree.voice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs">
      <div className="bg-[#FFFDF9] border border-[#E4DCC9] w-full max-w-xl rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-[#E4DCC9]">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#DCEAD0] flex items-center justify-center text-3xl shadow-inner shrink-0">
              {tree.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-fredoka text-xl font-bold text-[#2E4B3C]">
                  {tree.name}
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#DCEAD0] text-[#2E4B3C] font-semibold">
                  {tree.category}
                </span>
              </div>
              <p className="text-xs text-[#4C6B58] font-mono italic mt-0.5">
                {sci?.scientificName || tree.sub}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#E4DCC9] bg-[#FBF7EE] flex items-center justify-center text-[#4C6B58] hover:text-[#2E4B3C] hover:border-[#6B9971] shrink-0"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle Bar */}
        <div className="flex items-center gap-1.5 pt-3 pb-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "general"
                ? "bg-[#2E4B3C] text-[#FBF7EE] shadow-xs"
                : "bg-[#FBF7EE] text-[#4C6B58] border border-[#E4DCC9] hover:bg-[#FFFDF9]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>เรื่องราวน่ารู้ & สวนโรงเรียน</span>
          </button>

          <button
            onClick={() => setActiveTab("scientific")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "scientific"
                ? "bg-[#2E4B3C] text-[#FBF7EE] shadow-xs"
                : "bg-[#FBF7EE] text-[#4C6B58] border border-[#E4DCC9] hover:bg-[#FFFDF9]"
            }`}
          >
            <Microscope className="w-3.5 h-3.5 text-[#6B9971]" />
            <span>Scientific Data (ข้อมูลพฤกษศาสตร์เชิงลึก)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-3 space-y-3.5 text-sm text-[#2E4B3C] pr-1">
          {activeTab === "general" ? (
            <>
              {/* Voice Persona Card */}
              {voice && (
                <div className="bg-[#DCEAD0]/40 border border-[#DCEAD0] rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#6B9971] text-white flex items-center justify-center shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#2E4B3C]">
                        เสียงพากย์ธรรมชาติ: {voice.personaDescription}
                      </p>
                      <p className="text-[11px] text-[#4C6B58] mt-0.5">
                        {voice.voiceStylePrompt}
                      </p>
                    </div>
                  </div>
                  {onPlayVoiceSample && (
                    <button
                      onClick={() => onPlayVoiceSample(tree)}
                      className="px-3 py-1.5 rounded-xl bg-[#2E4B3C] text-[#FBF7EE] text-xs font-semibold shrink-0 hover:bg-[#4C6B58] transition-colors"
                    >
                      ฟังเสียงทักทาย
                    </button>
                  )}
                </div>
              )}

              {/* Scientific Highlights */}
              <div className="bg-[#FBF7EE] border border-[#E4DCC9] rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8B6244] mb-2.5 uppercase tracking-wide">
                  <BookOpen className="w-4 h-4" />
                  <span>แฟ้มข้อมูลพฤกษศาสตร์โรงเรียน</span>
                </div>
                <ul className="space-y-2">
                  {factLines.map((line, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-[#2E4B3C]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#6B9971] shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Care Icons */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#DCEAD0]/40 border border-[#DCEAD0] rounded-xl p-3 flex items-center gap-2.5">
                  <Sun className="w-5 h-5 text-[#F2A65A] shrink-0" />
                  <div>
                    <p className="font-semibold text-[#2E4B3C]">ความต้องการแสงแดด</p>
                    <p className="text-[11px] text-[#4C6B58]">แดดจัดถึงปานกลาง</p>
                  </div>
                </div>
                <div className="bg-[#DCEAD0]/40 border border-[#DCEAD0] rounded-xl p-3 flex items-center gap-2.5">
                  <Droplets className="w-5 h-5 text-[#6B9971] shrink-0" />
                  <div>
                    <p className="font-semibold text-[#2E4B3C]">การให้น้ำและความชื้น</p>
                    <p className="text-[11px] text-[#4C6B58]">ดินระบายน้ำดี ชุ่มชื้น</p>
                  </div>
                </div>
              </div>

              {/* Sample Questions */}
              <div className="border border-dashed border-[#E4DCC9] rounded-2xl p-3.5 bg-[#FFFDF9]">
                <p className="text-xs font-semibold text-[#4C6B58] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F2A65A]" />
                  <span>คำถามชวนคิดสำหรับวิชาวิทยาศาสตร์:</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tree.funQuestions.map((q, i) => (
                    <span
                      key={i}
                      className="text-[11px] px-2.5 py-1 bg-[#FBF7EE] border border-[#E4DCC9] rounded-lg text-[#2E4B3C]"
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* SCIENTIFIC DATA TAB */
            <div className="space-y-3">
              {/* Primary Taxonomy Card */}
              <div className="bg-[#FBF7EE] border border-[#E4DCC9] rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2E4B3C] mb-3 pb-2 border-b border-[#E4DCC9]">
                  <Layers className="w-4 h-4 text-[#6B9971]" />
                  <span>การจัดจำแนกทางอนุกรมวิธาน (Plant Taxonomy)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Scientific Name */}
                  <div className="bg-[#FFFDF9] border border-[#E4DCC9] rounded-xl p-2.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8B6244] mb-0.5">
                      <Tag className="w-3 h-3 text-[#6B9971]" />
                      <span>ชื่อวิทยาศาสตร์ (Scientific Name)</span>
                    </div>
                    <p className="font-mono font-bold text-sm text-[#2E4B3C] italic">
                      {sci.scientificName}
                    </p>
                    <p className="text-[11px] text-[#4C6B58] mt-0.5">
                      ชื่อสามัญอังกฤษ: <span className="font-medium text-[#2E4B3C]">{sci.commonNameEn}</span>
                    </p>
                  </div>

                  {/* Family */}
                  <div className="bg-[#FFFDF9] border border-[#E4DCC9] rounded-xl p-2.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8B6244] mb-0.5">
                      <Layers className="w-3 h-3 text-[#6B9971]" />
                      <span>วงศ์ (Family)</span>
                    </div>
                    <p className="text-xs font-semibold text-[#2E4B3C]">
                      <span className="font-mono font-bold">{sci.family}</span>
                      {sci.familyThai && (
                        <span className="text-[#4C6B58] font-normal ml-1.5">
                          ({sci.familyThai})
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Genus & Species */}
                  <div className="bg-[#FFFDF9] border border-[#E4DCC9] rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8B6244] mb-0.5">
                      <Leaf className="w-3 h-3 text-[#6B9971]" />
                      <span>สกุลและสปีชีส์ (Genus & Species)</span>
                    </div>
                    <p className="text-xs text-[#2E4B3C]">
                      <span className="text-[#4C6B58]">สกุล: </span>
                      <span className="font-mono font-semibold italic">{sci.genus}</span>
                      <span className="mx-1.5 text-[#E4DCC9]">|</span>
                      <span className="text-[#4C6B58]">สปีชีส์: </span>
                      <span className="font-mono font-semibold italic">{sci.species}</span>
                    </p>
                  </div>

                  {/* Plant Habit */}
                  <div className="bg-[#FFFDF9] border border-[#E4DCC9] rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8B6244] mb-0.5">
                      <Trees className="w-3 h-3 text-[#6B9971]" />
                      <span>ลักษณะวิสัย (Plant Habit)</span>
                    </div>
                    <p className="text-xs text-[#2E4B3C] leading-snug">
                      {sci.plantHabit}
                    </p>
                  </div>
                </div>
              </div>

              {/* Origin & Geography Card */}
              <div className="bg-[#FBF7EE] border border-[#E4DCC9] rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2E4B3C] mb-3 pb-2 border-b border-[#E4DCC9]">
                  <Globe className="w-4 h-4 text-[#F2A65A]" />
                  <span>ถิ่นกำเนิดและการกระจายพันธุ์ (Origin & Distribution)</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#DCEAD0] text-[#2E4B3C] font-semibold text-[10px] shrink-0 mt-0.5">
                      ถิ่นกำเนิดเดิม
                    </span>
                    <p className="text-[#2E4B3C] leading-relaxed">
                      {sci.origin}
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#E4DCC9] text-[#2E4B3C] font-semibold text-[10px] shrink-0 mt-0.5">
                      การกระจายพันธุ์
                    </span>
                    <p className="text-[#4C6B58] leading-relaxed">
                      {sci.distribution}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ecological Role Card */}
              <div className="bg-[#DCEAD0]/30 border border-[#6B9971]/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2E4B3C] mb-1.5">
                  <Info className="w-4 h-4 text-[#6B9971]" />
                  <span>บทบาทต่อระบบนิเวศและสิ่งแวดล้อม (Ecological Significance)</span>
                </div>
                <p className="text-xs leading-relaxed text-[#2E4B3C]">
                  {sci.ecologicalRole}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E4DCC9] flex items-center justify-between">
          <p className="text-[11px] text-[#4C6B58] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6B9971] inline-block" />
            <span>ฐานข้อมูลสวนพฤกษศาสตร์ในโรงเรียน</span>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#2E4B3C] text-[#FBF7EE] hover:bg-[#4C6B58] transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
