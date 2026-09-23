import React, { useState } from "react";
import { TreeData } from "../data/trees";
import {
  Volume2,
  VolumeX,
  Info,
  RotateCcw,
  Menu,
  LogIn,
  LogOut,
  BookOpen,
  Sparkles,
  Zap,
  Radio,
  User as UserIcon,
  Check,
  X,
  Trash2,
} from "lucide-react";
import { User } from "firebase/auth";

interface ChatHeaderProps {
  tree: TreeData;
  voiceOutputOn: boolean;
  onToggleVoice: () => void;
  voiceSpeedMode?: "instant" | "studio";
  onToggleVoiceSpeedMode?: () => void;
  onOpenInfo: () => void;
  onOpenNotes: () => void;
  onResetChat: () => void;
  onOpenMobileMenu: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isSpeaking?: boolean;
  userName?: string;
  onUpdateUserName?: (name: string) => void;
  onClearUserName?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  tree,
  voiceOutputOn,
  onToggleVoice,
  voiceSpeedMode = "instant",
  onToggleVoiceSpeedMode,
  onOpenInfo,
  onOpenNotes,
  onResetChat,
  onOpenMobileMenu,
  user,
  onSignIn,
  onSignOut,
  isSpeaking = false,
  userName = "",
  onUpdateUserName,
  onClearUserName,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      onUpdateUserName?.(trimmed);
    } else {
      onClearUserName?.();
    }
    setIsEditingName(false);
  };

  const handleClearName = () => {
    onClearUserName?.();
    setTempName("");
    setIsEditingName(false);
  };

  return (
    <header className="px-4 sm:px-6 py-3.5 border-b border-[#E4DCC9] bg-[#FFFDF9] flex items-center justify-between gap-2.5 relative">
      {/* Left: Mobile menu toggle & Tree Avatar & Name & Voice Persona */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl border border-[#E4DCC9] bg-[#FBF7EE] text-[#2E4B3C] hover:bg-[#EFE8D4]"
          aria-label="เลือกต้นไม้"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="relative shrink-0">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#DCEAD0] flex items-center justify-center text-2xl sm:text-3xl shadow-inner">
            {tree.icon}
          </div>
          {isSpeaking && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6B9971] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#2E4B3C]"></span>
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h1 className="font-fredoka font-semibold text-sm sm:text-base text-[#2E4B3C] truncate">
              {tree.name}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#DCEAD0] text-[#2E4B3C] font-medium">
              <Sparkles className="w-2.5 h-2.5 text-[#6B9971]" />
              {tree.voice?.personaDescription || "ออนไลน์"}
            </span>

            {/* Remembered User Name Badge */}
            {userName ? (
              <button
                type="button"
                onClick={() => {
                  setTempName(userName);
                  setIsEditingName(true);
                }}
                title="ต้นไม้จำชื่อของคุณได้ - คลิกเพื่อเปลี่ยนหรือแก้ไข"
                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-[#EBF4E5] border border-[#BBDCB4] text-[#2E4B3C] font-medium hover:bg-[#DCEAD0] transition-all cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#488B49] animate-pulse"></span>
                <span>น้อง{userName}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTempName("");
                  setIsEditingName(true);
                }}
                title="แนะนำชื่อของคุณให้ต้นไม้รู้จัก"
                className="hidden lg:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-dashed border-[#C5DEC0] text-[#4C6B58] hover:bg-[#EBF4E5] transition-all cursor-pointer"
              >
                <UserIcon className="w-2.5 h-2.5 text-[#6B9971]" />
                <span>บอกชื่อให้ต้นไม้จำ</span>
              </button>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-[#4C6B58] truncate mt-0.5">
            {tree.sub}
          </p>
        </div>
      </div>

      {/* Name Edit Modal / Popover */}
      {isEditingName && (
        <div className="absolute top-full left-4 sm:left-20 z-40 mt-1 p-3 bg-[#FFFDF9] border border-[#6B9971] rounded-2xl shadow-xl flex flex-col gap-2 min-w-[260px] animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-medium text-[#2E4B3C]">
            <span className="flex items-center gap-1">
              <span>🌱</span>
              <span>ชื่อที่คุณต้องการให้ต้นไม้เรียก:</span>
            </span>
            <button
              onClick={() => setIsEditingName(false)}
              className="text-[#8B6244] hover:text-[#2E4B3C]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="เช่น ก้อง, มะนาว, วิน"
              maxLength={15}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveName();
                if (e.key === "Escape") setIsEditingName(false);
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-[#FBF7EE] border border-[#E4DCC9] rounded-xl focus:outline-none focus:border-[#6B9971] text-[#2E4B3C]"
            />
            <button
              onClick={handleSaveName}
              title="บันทึกชื่อ"
              className="p-1.5 rounded-xl bg-[#2E4B3C] text-white hover:bg-[#4C6B58] transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            {userName && (
              <button
                onClick={handleClearName}
                title="ลบชื่อที่จำไว้"
                className="p-1.5 rounded-xl border border-[#E4DCC9] text-[#E4574C] hover:bg-[#FDF0ED] transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-[#8B6244]">
            💡 คุณสามารถบอกชื่อในแชทได้โดยตรง เช่น "ผมชื่อกานต์ครับ"
          </p>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Botanical Notes Button */}
        <button
          onClick={onOpenNotes}
          title="สมุดบันทึกภาคสนาม (Firestore)"
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-[#E4DCC9] bg-[#FFFDF9] hover:border-[#6B9971] text-xs text-[#4C6B58] hover:text-[#2E4B3C] transition-all"
        >
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#8B6244]" />
          <span className="hidden md:inline font-medium">สมุดบันทึก</span>
        </button>

        {/* Botanical Info Button */}
        <button
          onClick={onOpenInfo}
          title="ดูแฟ้มข้อมูลพฤกษศาสตร์"
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-[#E4DCC9] bg-[#FFFDF9] hover:border-[#6B9971] text-xs text-[#4C6B58] hover:text-[#2E4B3C] transition-all"
        >
          <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6B9971]" />
          <span className="hidden sm:inline font-medium">ข้อมูลต้นไม้</span>
        </button>

        {/* Reset Chat */}
        <button
          onClick={onResetChat}
          title="เริ่มคุยใหม่"
          className="p-1.5 sm:px-2.5 sm:py-2 rounded-xl border border-[#E4DCC9] bg-[#FFFDF9] hover:border-[#6B9971] text-xs text-[#4C6B58] hover:text-[#2E4B3C] transition-all flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Speaker Toggle with Animated Audio Indicator */}
        <button
          onClick={onToggleVoice}
          title={voiceOutputOn ? "คลิกเพื่อปิดเสียงตอบ" : "คลิกเพื่อเปิดเสียงตอบ"}
          className={`
            px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border flex items-center gap-1.5 transition-all text-xs font-medium
            ${
              voiceOutputOn
                ? isSpeaking
                  ? "bg-[#2E4B3C] border-[#2E4B3C] text-white shadow-xs animate-pulse"
                  : "bg-[#6B9971] border-[#6B9971] text-white shadow-xs"
                : "bg-[#FFFDF9] border-[#E4DCC9] text-[#4C6B58] hover:border-[#6B9971]"
            }
          `}
          aria-label={voiceOutputOn ? "ปิดเสียงบรรยาย" : "เปิดเสียงบรรยาย"}
        >
          {voiceOutputOn ? (
            <>
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSpeaking ? "กำลังพูด..." : "เปิดเสียง"}</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ปิดเสียง</span>
            </>
          )}
        </button>

        {/* Fast Voice Mode Toggle (Instant Storyteller vs Studio HD) */}
        {voiceOutputOn && onToggleVoiceSpeedMode && (
          <button
            onClick={onToggleVoiceSpeedMode}
            title={
              voiceSpeedMode === "instant"
                ? "โหมดเสียงเล่าเรื่องทันใจ (เว้นจังหวะหายใจเป็นธรรมชาติ ไม่รัวเร็ว) - คลิกเพื่อสลับเป็นเสียงสตูดิโอ HD"
                : "โหมดเสียงสตูดิโอ HD - คลิกเพื่อสลับเป็นเสียงเล่าเรื่องทันใจ"
            }
            className={`
              px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-xl border flex items-center gap-1 transition-all text-xs font-medium
              ${
                voiceSpeedMode === "instant"
                  ? "bg-[#FBF7EE] border-[#6B9971] text-[#2E4B3C] hover:bg-[#EAE4D2]"
                  : "bg-[#FBF7EE] border-[#DCEAD0] text-[#4C6B58] hover:bg-[#EAE4D2]"
              }
            `}
          >
            {voiceSpeedMode === "instant" ? (
              <>
                <Zap className="w-3.5 h-3.5 text-[#E68A2E] fill-[#E68A2E]" />
                <span className="hidden md:inline font-semibold">เล่าเรื่องทันใจ</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-[#6B9971]" />
                <span className="hidden md:inline">สตูดิโอ HD</span>
              </>
            )}
          </button>
        )}

        {/* User Auth Section */}
        {user ? (
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-[#E4DCC9]">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "ผู้ใช้"}
                referrerPolicy="no-referrer"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#6B9971] object-cover"
                title={user.displayName || user.email || ""}
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#2E4B3C] text-[#FBF7EE] text-xs flex items-center justify-center font-bold">
                {user.displayName?.[0] || "U"}
              </div>
            )}
            <button
              onClick={onSignOut}
              title="ออกจากระบบ"
              className="p-1.5 rounded-xl border border-transparent hover:border-[#E4DCC9] hover:bg-[#FBF7EE] text-[#8B6244] hover:text-[#E4574C] transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2E4B3C] hover:bg-[#4C6B58] text-[#FBF7EE] text-xs font-medium transition-all shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">เข้าสู่ระบบ</span>
          </button>
        )}
      </div>
    </header>
  );
};
