import React, { useState } from "react";
import { TreeNote } from "../types";
import { TreeData } from "../data/trees";
import { BookOpen, Trash2, Plus, X, Sparkles } from "lucide-react";

interface FieldNotesModalProps {
  tree: TreeData;
  isOpen: boolean;
  onClose: () => void;
  notes: TreeNote[];
  onAddNote: (noteText: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  isSignedIn: boolean;
  onSignIn: () => void;
}

export const FieldNotesModal: React.FC<FieldNotesModalProps> = ({
  tree,
  isOpen,
  onClose,
  notes,
  onAddNote,
  onDeleteNote,
  isSignedIn,
  onSignIn,
}) => {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddNote(newNote.trim());
      setNewNote("");
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter notes for the current tree or show all
  const treeNotes = notes.filter((n) => n.treeId === tree.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FFFDF9] border border-[#E4DCC9] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E4DCC9]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#DCEAD0] flex items-center justify-center text-2xl shadow-inner">
              📝
            </div>
            <div>
              <h3 className="font-fredoka text-lg font-bold text-[#2E4B3C]">
                สมุดบันทึกพฤกษศาสตร์ภาคสนาม
              </h3>
              <p className="text-xs text-[#4C6B58] mt-0.5">
                บันทึกการสังเกตการณ์ {tree.name} บันทึกลง Cloud Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#E4DCC9] bg-[#FBF7EE] flex items-center justify-center text-[#4C6B58] hover:text-[#2E4B3C]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-4">
          {!isSignedIn ? (
            <div className="bg-[#FBF7EE] border border-[#E4DCC9] rounded-2xl p-5 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-[#F2A65A] mx-auto" />
              <h4 className="font-semibold text-sm text-[#2E4B3C]">
                เข้าสู่ระบบเพื่อบันทึกข้อมูลพฤกษศาสตร์
              </h4>
              <p className="text-xs text-[#4C6B58] max-w-sm mx-auto">
                ล็อกอินด้วย Google เพื่อบันทึกผลการสังเกต บันทึกคำตอบ และเชื่อมต่อข้อมูลการเรียนรู้แบบส่วนตัว
              </p>
              <button
                onClick={onSignIn}
                className="px-4 py-2 bg-[#2E4B3C] hover:bg-[#4C6B58] text-[#FBF7EE] rounded-xl text-xs font-medium transition-all shadow-xs"
              >
                เข้าสู่ระบบด้วย Google
              </button>
            </div>
          ) : (
            <>
              {/* Form to add note */}
              <form onSubmit={handleSubmit} className="space-y-2">
                <label className="block text-xs font-semibold text-[#4C6B58]">
                  เพิ่มบันทึกสังเกตการณ์เกี่ยวกับ {tree.name}:
                </label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="เช่น พบการผลิดอกที่ปลายกิ่ง, ใบมีสีเขียวเข้ม ผิวสัมผัสมันวาว, ผึ้งแวะมาตอมเกสร..."
                  rows={3}
                  className="w-full bg-[#FBF7EE] border border-[#E4DCC9] rounded-xl p-3 text-xs text-[#2E4B3C] placeholder-[#8B6244]/60 focus:outline-none focus:border-[#6B9971]"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNote.trim() || isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#6B9971] hover:bg-[#4C6B58] text-[#FFFDF9] text-xs font-semibold transition-all disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึกลงสมุด"}</span>
                  </button>
                </div>
              </form>

              {/* Note List */}
              <div className="space-y-2 pt-2 border-t border-dashed border-[#E4DCC9]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#4C6B58] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#6B9971]" />
                    <span>บันทึกของต้นนี้ ({treeNotes.length})</span>
                  </span>
                </div>

                {treeNotes.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#4C6B58] bg-[#FBF7EE]/60 rounded-xl border border-dashed border-[#E4DCC9]">
                    ยังไม่มีบันทึกสำหรับ {tree.name} เริ่มจดบันทึกข้อสังเกตได้เลย!
                  </div>
                ) : (
                  treeNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-[#FBF7EE] border border-[#E4DCC9] rounded-xl p-3 text-xs text-[#2E4B3C] flex items-start justify-between gap-2 group"
                    >
                      <div className="space-y-1">
                        <p className="leading-relaxed whitespace-pre-wrap">{note.note}</p>
                        <span className="text-[10px] text-[#8B6244]/70 block">
                          บันทึกเมื่อ: {note.createdAt}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="text-[#8B6244]/50 hover:text-[#E4574C] p-1 rounded-md transition-colors shrink-0"
                        title="ลบบันทึกนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E4DCC9] flex justify-end">
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
