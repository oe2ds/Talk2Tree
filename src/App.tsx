/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { TREES, TreeData } from "./data/trees";
import { ChatMessage, TreeNote } from "./types";
import { TreeSidebar } from "./components/TreeSidebar";
import { ChatHeader } from "./components/ChatHeader";
import { MessageBubble } from "./components/MessageBubble";
import { SuggestionsBar } from "./components/SuggestionsBar";
import { ChatComposer } from "./components/ChatComposer";
import { BotanicalModal } from "./components/BotanicalModal";
import { FieldNotesModal } from "./components/FieldNotesModal";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import {
  playPcmAudio,
  playInstantSpeech,
  stopCurrentAudio,
  initSpeechEngine,
  unlockAudioContext,
  sanitizeTreeReply,
} from "./utils/audioPlayer";
import {
  subscribeToTreeMessages,
  saveChatMessage,
  subscribeToUserNotes,
  saveTreeNote,
  deleteTreeNote,
  subscribeToFavorites,
  toggleFavoriteTree,
  saveUserPreferredName,
  getUserPreferredName,
} from "./lib/firestoreService";

function ChatApp() {
  const { user, signInWithGoogle, signOut } = useAuth();

  const [currentTreeId, setCurrentTreeId] = useState<string>("mango");
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notes, setNotes] = useState<TreeNote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceOutputOn, setVoiceOutputOn] = useState<boolean>(true);
  const [voiceSpeedMode, setVoiceSpeedMode] = useState<"instant" | "studio">("instant");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState<boolean>(false);

  // Remembered conversational user name (e.g., "ก้อง", "ต้นกล้า")
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("botanical_user_name") || "";
  });
  const [nameToast, setNameToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeTree: TreeData = TREES[currentTreeId] || TREES.mango;

  // Preload speech synthesis voices early
  useEffect(() => {
    initSpeechEngine();
  }, []);

  // Sync user preferred name with Firestore profile
  useEffect(() => {
    if (!user) return;

    getUserPreferredName(user.uid).then((prefName) => {
      if (prefName && prefName.trim()) {
        setUserName(prefName.trim());
        localStorage.setItem("botanical_user_name", prefName.trim());
      } else if (userName && userName.trim()) {
        saveUserPreferredName(user.uid, userName.trim());
      } else if (user.displayName && !userName) {
        // Fallback to first name from Google account if no name remembered
        const first = user.displayName.split(" ")[0].trim();
        if (first && first.length <= 15) {
          setUserName(first);
          localStorage.setItem("botanical_user_name", first);
          saveUserPreferredName(user.uid, first);
        }
      }
    });
  }, [user]);

  // Listen to Firestore Favorites and Notes when user logs in
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setNotes([]);
      return;
    }

    const unsubFavs = subscribeToFavorites(user.uid, (favIds) => {
      setFavorites(favIds);
    });

    const unsubNotes = subscribeToUserNotes(user.uid, (userNotes) => {
      setNotes(userNotes);
    });

    return () => {
      unsubFavs();
      unsubNotes();
    };
  }, [user]);

  // Listen to Tree Chat Messages in Firestore when user is signed in
  useEffect(() => {
    if (!user) {
      // If anonymous, ensure at least greeting is shown locally
      setChatHistory((prev) => {
        if (prev[currentTreeId] && prev[currentTreeId].length > 0) return prev;
        const initialGreeting: ChatMessage = {
          id: `greeting-${currentTreeId}`,
          role: "tree",
          content: activeTree.greeting,
          timestamp: Date.now(),
          treeId: currentTreeId,
        };
        return {
          ...prev,
          [currentTreeId]: [initialGreeting],
        };
      });
      return;
    }

    // Subscribe to current tree's message stream from Firestore
    const unsubscribe = subscribeToTreeMessages(
      user.uid,
      currentTreeId,
      (firestoreMsgs) => {
        if (firestoreMsgs.length > 0) {
          setChatHistory((prev) => ({
            ...prev,
            [currentTreeId]: firestoreMsgs,
          }));
        } else {
          // Empty in Firestore: add initial tree greeting to history
          const initialGreeting: ChatMessage = {
            id: `greeting-${currentTreeId}`,
            role: "tree",
            content: activeTree.greeting,
            timestamp: Date.now(),
            treeId: currentTreeId,
            userId: user.uid,
          };
          setChatHistory((prev) => ({
            ...prev,
            [currentTreeId]: [initialGreeting],
          }));
          // Save greeting to Firestore so next reload persists
          saveChatMessage(user.uid, {
            role: "tree",
            content: activeTree.greeting,
            timestamp: Date.now(),
            treeId: currentTreeId,
          });
        }
      }
    );

    return () => unsubscribe();
  }, [user, currentTreeId, activeTree.greeting]);

  // Natural Human-Like Speech Synthesizer with Plant Personality & Fast Response
  const speakText = useCallback(
    async (text: string, treeOverride?: TreeData) => {
      if (!voiceOutputOn || !text) {
        return;
      }

      const tree = treeOverride || activeTree;
      const voice = tree.voice;

      stopCurrentAudio();

      // Zero-latency instant voice mode (<20ms delay)
      if (voiceSpeedMode === "instant") {
        const started = playInstantSpeech(
          text,
          {
            pitch: voice?.pitch ?? 1.0,
            rate: voice?.rate ?? 1.0,
          },
          () => setIsSpeaking(true),
          () => setIsSpeaking(false)
        );
        if (started) return;
      }

      // Studio Neural TTS mode with fast 2.8s cap and seamless instant fallback
      setIsSpeaking(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2800);

        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            text,
            treeId: tree.id,
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.audioBase64) {
            const played = await playPcmAudio(
              data.audioBase64,
              data.sampleRate || 24000,
              () => setIsSpeaking(false)
            );
            if (played) return;
          }
        }
      } catch (err) {
        console.warn("Studio TTS timed out or unavailable, using instant speech:", err);
      }

      // Fast fallback to instant voice
      playInstantSpeech(
        text,
        {
          pitch: voice?.pitch ?? 1.0,
          rate: voice?.rate ?? 1.0,
        },
        () => setIsSpeaking(true),
        () => setIsSpeaking(false)
      );
    },
    [voiceOutputOn, activeTree, voiceSpeedMode]
  );

  const currentMessages = chatHistory[currentTreeId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isLoading]);

  const handleSelectTree = (treeId: string) => {
    unlockAudioContext();
    stopCurrentAudio();
    setIsSpeaking(false);
    setCurrentTreeId(treeId);
  };

  const handleToggleFavorite = async (treeId: string, isFav: boolean) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    await toggleFavoriteTree(user.uid, treeId, isFav);
  };

  const handleAddNote = async (noteText: string) => {
    if (!user) return;
    await saveTreeNote(
      user.uid,
      activeTree.id,
      activeTree.name,
      activeTree.icon,
      noteText
    );
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    await deleteTreeNote(user.uid, noteId);
  };

  const handleResetChat = async () => {
    stopCurrentAudio();
    setIsSpeaking(false);
    const initialGreeting: ChatMessage = {
      id: `greeting-${currentTreeId}-${Date.now()}`,
      role: "tree",
      content: activeTree.greeting,
      timestamp: Date.now(),
      treeId: currentTreeId,
    };
    setChatHistory((prev) => ({
      ...prev,
      [currentTreeId]: [initialGreeting],
    }));

    if (user) {
      await saveChatMessage(user.uid, {
        role: "tree",
        content: `(เริ่มการสนทนารอบใหม่) ${activeTree.greeting}`,
        timestamp: Date.now(),
        treeId: currentTreeId,
      });
    }
  };

  const handleToggleVoice = () => {
    const newState = !voiceOutputOn;
    setVoiceOutputOn(newState);
    if (!newState) {
      stopCurrentAudio();
      setIsSpeaking(false);
    } else {
      unlockAudioContext();
    }
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    unlockAudioContext();
    stopCurrentAudio();
    setIsSpeaking(false);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText.trim(),
      timestamp: Date.now(),
      treeId: currentTreeId,
      userId: user?.uid,
    };

    const updatedMessages = [...currentMessages, userMessage];
    setChatHistory((prev) => ({
      ...prev,
      [currentTreeId]: updatedMessages,
    }));

    // If logged in, save to Firestore
    if (user) {
      saveChatMessage(user.uid, {
        role: "user",
        content: userText.trim(),
        timestamp: Date.now(),
        treeId: currentTreeId,
      });
    }

    setIsLoading(true);

    const replyId = `tree-${Date.now()}`;
    let accumulatedText = "";
    let detectedNameFromApi: string | null = null;
    let streamSucceeded = false;

    try {
      // 1. Try real-time SSE streaming for instant sub-second response
      const streamResponse = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          treeId: currentTreeId,
          message: userText.trim(),
          userName: userName || undefined,
          history: currentMessages.slice(-4).map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        }),
      });

      if (streamResponse.ok && streamResponse.body) {
        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Mount tree reply placeholder immediately
        setChatHistory((prev) => ({
          ...prev,
          [currentTreeId]: [
            ...(prev[currentTreeId] || []),
            {
              id: replyId,
              role: "tree",
              content: "",
              timestamp: Date.now(),
              treeId: currentTreeId,
              userId: user?.uid,
            },
          ],
        }));

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            try {
              const data = JSON.parse(trimmed.replace(/^data:\s*/, ""));

              if (data.detectedName && typeof data.detectedName === "string") {
                detectedNameFromApi = data.detectedName.trim();
              }

              if (data.type === "chunk" && data.text) {
                accumulatedText += data.text;
                const liveText = accumulatedText;
                setChatHistory((prev) => {
                  const list = prev[currentTreeId] || [];
                  return {
                    ...prev,
                    [currentTreeId]: list.map((msg) =>
                      msg.id === replyId ? { ...msg, content: liveText } : msg
                    ),
                  };
                });
                setIsLoading(false);
              } else if (data.type === "done" && data.fullReply) {
                accumulatedText = data.fullReply;
              }
            } catch {
              // Ignore partial JSON parse
            }
          }
        }

        if (accumulatedText.trim().length > 0) {
          streamSucceeded = true;
        }
      }

      // 2. Fallback to standard fast JSON API if streaming was empty or unsupported
      if (!streamSucceeded) {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            treeId: currentTreeId,
            message: userText.trim(),
            userName: userName || undefined,
            history: currentMessages.slice(-4).map((m) => ({
              role: m.role === "user" ? "user" : "assistant",
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        accumulatedText =
          data.reply ||
          `สวัสดีจ้ะ ${activeTree.name}ได้ยินคำถามของหนูแล้วนะ ลองถามเกี่ยวกับใบ ดอก หรือรากของฉันดูสิ! 🌱`;
        if (data.detectedName && typeof data.detectedName === "string") {
          detectedNameFromApi = data.detectedName.trim();
        }
      }

      const finalReply = sanitizeTreeReply(accumulatedText);

      // Finalize the tree message state
      setChatHistory((prev) => {
        const list = prev[currentTreeId] || [];
        const exists = list.some((msg) => msg.id === replyId);
        if (exists) {
          return {
            ...prev,
            [currentTreeId]: list.map((msg) =>
              msg.id === replyId ? { ...msg, content: finalReply } : msg
            ),
          };
        }
        return {
          ...prev,
          [currentTreeId]: [
            ...list,
            {
              id: replyId,
              role: "tree",
              content: finalReply,
              timestamp: Date.now(),
              treeId: currentTreeId,
              userId: user?.uid,
            },
          ],
        };
      });

      // Handle newly detected name toast & persistence
      if (detectedNameFromApi && detectedNameFromApi !== userName) {
        setUserName(detectedNameFromApi);
        localStorage.setItem("botanical_user_name", detectedNameFromApi);
        if (user) {
          saveUserPreferredName(user.uid, detectedNameFromApi);
        }
        setNameToast(`🌿 พี่${activeTree.name}จำชื่อคุณได้แล้ว: "น้อง${detectedNameFromApi}"`);
        setTimeout(() => setNameToast(null), 4500);
      }

      // Save reply to Firestore if signed in
      if (user) {
        saveChatMessage(user.uid, {
          role: "tree",
          content: finalReply,
          timestamp: Date.now(),
          treeId: currentTreeId,
        });
      }

      // Synthesize and play audio voice
      speakText(finalReply);
    } catch (error) {
      console.warn("API fetch error, using botanical knowledge fallback:", error);
      const factLines = activeTree.facts
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.includes("ข้อมูลจริงเกี่ยวกับตัวเอง:"));
      const randomFact =
        factLines.length > 0
          ? factLines[Math.floor(Math.random() * factLines.length)].replace(/^-\s*/, "")
          : activeTree.greeting;

      const fallbackReply = `${activeTree.name}อยู่นี่จ้ะ! รู้ไหมว่า ${randomFact} หนูอยากสำรวจส่วนไหนของต้นไม้อีกไหมจ๊ะ? 🌱`;

      setChatHistory((prev) => {
        const list = prev[currentTreeId] || [];
        const exists = list.some((msg) => msg.id === replyId);
        if (exists) {
          return {
            ...prev,
            [currentTreeId]: list.map((msg) =>
              msg.id === replyId ? { ...msg, content: fallbackReply } : msg
            ),
          };
        }
        return {
          ...prev,
          [currentTreeId]: [
            ...list,
            {
              id: replyId,
              role: "tree",
              content: fallbackReply,
              timestamp: Date.now(),
              treeId: currentTreeId,
            },
          ],
        };
      });

      speakText(fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    localStorage.setItem("botanical_user_name", trimmed);
    if (user) {
      saveUserPreferredName(user.uid, trimmed);
    }
    setNameToast(`🌿 เปลี่ยนชื่อเป็น: "น้อง${trimmed}" แล้วจ้ะ`);
    setTimeout(() => setNameToast(null), 4000);
  };

  const handleClearUserName = () => {
    setUserName("");
    localStorage.removeItem("botanical_user_name");
    if (user) {
      saveUserPreferredName(user.uid, "");
    }
    setNameToast("ลบชื่อที่จำไว้เรียบร้อยแล้ว");
    setTimeout(() => setNameToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center p-3 sm:p-5 lg:p-6">
      {/* Botanical Info Modal */}
      <BotanicalModal
        tree={activeTree}
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        onPlayVoiceSample={(tree) => speakText(tree.greeting, tree)}
      />

      {/* Field Notes Modal (Firestore) */}
      <FieldNotesModal
        tree={activeTree}
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        notes={notes}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        isSignedIn={!!user}
        onSignIn={signInWithGoogle}
      />

      {/* Main Container */}
      <div className="w-full max-w-[980px] bg-[#FFFDF9] rounded-[28px] border border-[#E4DCC9] overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-[290px_1fr] min-h-[640px] max-h-[92vh] relative">
        {/* Left: Tree Selector Sidebar */}
        <div className="hidden md:block h-full overflow-hidden">
          <TreeSidebar
            currentTreeId={currentTreeId}
            onSelectTree={handleSelectTree}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {isMobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
            <div className="w-[85%] max-w-[320px] h-full bg-[#EFE8D4] shadow-2xl">
              <TreeSidebar
                currentTreeId={currentTreeId}
                onSelectTree={handleSelectTree}
                isMobileOpen={true}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
            <div
              className="flex-1"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        )}

        {/* Right: Chat Column */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header with Google Sign-in, Profile, and Voice indicator */}
          <ChatHeader
            tree={activeTree}
            voiceOutputOn={voiceOutputOn}
            onToggleVoice={handleToggleVoice}
            voiceSpeedMode={voiceSpeedMode}
            onToggleVoiceSpeedMode={() =>
              setVoiceSpeedMode((prev) => (prev === "instant" ? "studio" : "instant"))
            }
            onOpenInfo={() => setIsInfoModalOpen(true)}
            onOpenNotes={() => setIsNotesModalOpen(true)}
            onResetChat={handleResetChat}
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
            user={user}
            onSignIn={signInWithGoogle}
            onSignOut={signOut}
            isSpeaking={isSpeaking}
            userName={userName}
            onUpdateUserName={handleUpdateUserName}
            onClearUserName={handleClearUserName}
          />

          {/* Name Memory Notification Toast */}
          {nameToast && (
            <div className="px-4 py-2 bg-[#EBF4E5] border-b border-[#C5DEC0] text-[#2E4B3C] text-xs flex items-center justify-between animate-fadeIn transition-all shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">🌱</span>
                <span className="font-medium">{nameToast}</span>
              </div>
              <button
                onClick={() => setNameToast(null)}
                className="text-[#4C6B58] hover:text-[#2E4B3C] text-xs ml-2 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 flex flex-col gap-2.5 bg-[#FFFDF9]">
            {currentMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                treeName={activeTree.name}
                treeIcon={activeTree.icon}
                onSpeak={(text) => speakText(text)}
              />
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-end gap-2 my-1">
                <div className="w-8 h-8 rounded-full bg-[#DCEAD0] flex items-center justify-center text-sm shrink-0 mb-1">
                  {activeTree.icon}
                </div>
                <div className="bg-[#DCEAD0] text-[#2E4B3C] rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#4C6B58] dot-1"></span>
                  <span className="w-2 h-2 rounded-full bg-[#4C6B58] dot-2"></span>
                  <span className="w-2 h-2 rounded-full bg-[#4C6B58] dot-3"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <SuggestionsBar
            tree={activeTree}
            onSelectSuggestion={handleSendMessage}
            disabled={isLoading}
            userName={userName}
          />

          {/* Composer */}
          <ChatComposer
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}
