import React, { useState } from "react";
import { TREES, TreeData } from "../data/trees";
import { TreeCategory } from "../types";
import { Search, Sprout, X, Star, Volume2 } from "lucide-react";

interface TreeSidebarProps {
  currentTreeId: string;
  onSelectTree: (treeId: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  favorites?: string[];
  onToggleFavorite?: (treeId: string, isFav: boolean) => void;
}

const CATEGORIES: TreeCategory[] = [
  "ทั้งหมด",
  "ไม้ยืนต้น",
  "ไม้ผล",
  "ไม้ดอก",
  "ไม้เลื้อย",
  "เฟิร์น",
  "ไม้พุ่ม",
  "ไม้ล้มลุก",
  "กระบองเพชร",
];

export const TreeSidebar: React.FC<TreeSidebarProps> = ({
  currentTreeId,
  onSelectTree,
  isMobileOpen = false,
  onCloseMobile,
  favorites = [],
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TreeCategory>("ทั้งหมด");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const treeList = Object.values(TREES).filter((tree) => {
    const matchesSearch =
      tree.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tree.sub.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tree.voice?.personaDescription || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "ทั้งหมด" || tree.category === selectedCategory;
    const matchesFavorite = !showOnlyFavorites || favorites.includes(tree.id);
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  return (
    <aside
      className={`
        bg-gradient-to-b from-[#EFE8D4] to-[#E7DEC6] 
        border-r border-[#E4DCC9] p-4 sm:p-5 flex flex-col gap-3.5 
        h-full max-h-[85vh] lg:max-h-full overflow-hidden
        ${isMobileOpen ? "fixed inset-0 z-50 p-6 shadow-2xl" : "relative"}
      `}
    >
      {/* Brand Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-fredoka font-semibold text-lg text-[#2E4B3C] tracking-wide">
              Talk to Tree
            </span>
          </div>
          <p className="text-[11px] text-[#4C6B58] mt-0.5">
            สวนพฤกษศาสตร์ รร.ตันตรารักษ์ · โดย T.Laila
          </p>
        </div>

        {isMobileOpen && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl bg-[#E4DCC9]/60 hover:bg-[#E4DCC9] text-[#2E4B3C]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#8B6244]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาชื่อต้นไม้ หรือเสียงพากย์..."
          className="w-full bg-[#FFFDF9] border border-[#E4DCC9] rounded-2xl pl-9 pr-3 py-2 text-xs text-[#2E4B3C] placeholder-[#8B6244]/50 focus:outline-none focus:border-[#6B9971]"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8B6244]/50 hover:text-[#2E4B3C]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Categories & Favorites toggle */}
      <div className="flex items-center gap-1.5 overflow-hidden">
        <button
          onClick={() => {
            setShowOnlyFavorites(!showOnlyFavorites);
            if (!showOnlyFavorites) setSelectedCategory("ทั้งหมด");
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium shrink-0 transition-all border ${
            showOnlyFavorites
              ? "bg-[#F2A65A] border-[#F2A65A] text-[#3A2410] shadow-xs"
              : "bg-[#FFFDF9]/80 border-[#E4DCC9] text-[#4C6B58] hover:bg-[#FFFDF9]"
          }`}
        >
          <Star className={`w-3 h-3 ${showOnlyFavorites ? "fill-[#3A2410]" : ""}`} />
          <span>ต้นที่ชอบ ({favorites.length})</span>
        </button>

        <div className="flex-1 overflow-x-auto flex gap-1 custom-scrollbar">
          {CATEGORIES.slice(0, 4).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setShowOnlyFavorites(false);
              }}
              className={`px-2 py-1 rounded-lg whitespace-nowrap text-[10px] font-medium transition-all ${
                selectedCategory === cat && !showOnlyFavorites
                  ? "bg-[#2E4B3C] text-[#FBF7EE]"
                  : "bg-[#FFFDF9]/60 hover:bg-[#FFFDF9] text-[#4C6B58] border border-[#E4DCC9]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tree List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 pr-1">
        {treeList.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#4C6B58]">
            ไม่พบต้นไม้ที่ค้นหา
          </div>
        ) : (
          treeList.map((tree: TreeData) => {
            const isActive = tree.id === currentTreeId;
            const isFav = favorites.includes(tree.id);
            return (
              <div
                key={tree.id}
                className={`
                  w-full flex items-center justify-between gap-2 p-2 rounded-2xl transition-all border group
                  ${
                    isActive
                      ? "bg-[#FFFDF9] border-[#E4DCC9] shadow-xs translate-x-1"
                      : "bg-transparent border-transparent hover:bg-white/40"
                  }
                `}
              >
                <button
                  onClick={() => {
                    onSelectTree(tree.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                >
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-transform
                      ${isActive ? "bg-[#DCEAD0] scale-105 shadow-inner" : "bg-[#DCEAD0]/70"}
                    `}
                  >
                    {tree.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs sm:text-sm text-[#2E4B3C] truncate">
                        {tree.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#4C6B58] truncate">
                      <Volume2 className="w-2.5 h-2.5 text-[#6B9971] shrink-0" />
                      <span className="truncate">{tree.voice?.personaDescription || tree.sub}</span>
                    </div>
                  </div>
                </button>

                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(tree.id, isFav);
                    }}
                    title={isFav ? "เอาออกจากรายการโปรด" : "เพิ่มเป็นต้นไม้โปรด"}
                    className="p-1.5 rounded-lg text-[#8B6244]/50 hover:text-[#F2A65A] hover:bg-black/5 transition-all shrink-0"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isFav ? "fill-[#F2A65A] text-[#F2A65A]" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="mt-auto pt-3 border-t border-dashed border-[#E4DCC9] text-[11px] text-[#4C6B58] leading-relaxed flex items-start gap-2">
        <Sprout className="w-4 h-4 text-[#6B9971] shrink-0 mt-0.5" />
        <span>
          ต้นไม้แต่ละต้นมีน้ำเสียงเป็นเอกลักษณ์เฉพาะตัว ออกแบบมาเพื่อกระตุ้นการเรียนรู้ทางชีววิทยาและนิเวศวิทยา
        </span>
      </div>
    </aside>
  );
};
