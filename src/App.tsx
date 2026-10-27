import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { CoverPage } from "./components/CoverPage";
import { NoticeAnalyzer } from "./components/NoticeAnalyzer";
import { QuizGenerator } from "./components/QuizGenerator";
import { HistoryDashboard } from "./components/HistoryDashboard";
import { ExamPrepDashboard } from "./components/ExamPrepDashboard";
import { CyberBackground3D } from "./components/CyberBackground3D";
import { LoginModal } from "./components/LoginModal";
import { NoticeAnalysisResult, QuizAttempt, StudentUser } from "./types";
import { Sparkles, Info, ShieldCheck, Zap } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"cover" | "notice" | "quiz" | "history" | "examprep">("cover");
  const [selectedModel, setSelectedModel] = useState<string>("gemma-4-26b-a4b-it");
  const [prefillTopic, setPrefillTopic] = useState<string | null>(null);
  const [universalPdf, setUniversalPdf] = useState<File | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Student User Profile state
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(() => {
    try {
      const stored = localStorage.getItem("edupilot_student_user");
      if (stored) return JSON.parse(stored);
      // Default initial logged in student profile
      return {
        id: "student-sampat",
        name: "Sampat Kumar",
        email: "sampatkumarbyaligoudra@gmail.com",
        college: "College of Engineering & Technology",
        branch: "Computer Science & Engineering",
        semester: "Semester 6",
        avatar: "👨‍🎓",
        streakDays: 4,
        quizzesTaken: 8,
        noticesSaved: 3,
        joinedAt: Date.now() - 86400000 * 7,
      };
    } catch {
      return null;
    }
  });

  // LocalStorage state for persistent student study planner
  const [savedNotices, setSavedNotices] = useState<NoticeAnalysisResult[]>(() => {
    try {
      const stored = localStorage.getItem("edupilot_saved_notices");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [savedQuizzes, setSavedQuizzes] = useState<QuizAttempt[]>(() => {
    try {
      const stored = localStorage.getItem("edupilot_saved_quizzes");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem("edupilot_student_user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("edupilot_student_user");
      }
    } catch (e) {
      console.error("Failed to save student profile", e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem("edupilot_saved_notices", JSON.stringify(savedNotices));
    } catch (e) {
      console.error("Failed to save notices to local storage", e);
    }
  }, [savedNotices]);

  useEffect(() => {
    try {
      localStorage.setItem("edupilot_saved_quizzes", JSON.stringify(savedQuizzes));
    } catch (e) {
      console.error("Failed to save quizzes to local storage", e);
    }
  }, [savedQuizzes]);

  const handleSaveNotice = (notice: NoticeAnalysisResult) => {
    setSavedNotices((prev) => [notice, ...prev.filter((n) => n.id !== notice.id)]);
    if (currentUser) {
      setCurrentUser((prev) =>
        prev ? { ...prev, noticesSaved: prev.noticesSaved + 1 } : null
      );
    }
  };

  const handleDeleteNotice = (id: string) => {
    setSavedNotices((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSaveQuizAttempt = (attempt: QuizAttempt) => {
    setSavedQuizzes((prev) => [attempt, ...prev]);
    if (currentUser) {
      setCurrentUser((prev) =>
        prev ? { ...prev, quizzesTaken: prev.quizzesTaken + 1 } : null
      );
    }
  };

  const handleDeleteQuizAttempt = (id: string) => {
    setSavedQuizzes((prev) => prev.filter((q) => q.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your saved notices and test history?")) {
      setSavedNotices([]);
      setSavedQuizzes([]);
    }
  };

  const handleSwitchToQuiz = (topic: string) => {
    setPrefillTopic(topic);
    setActiveTab("quiz");
  };

  const handleUniversalPdfDrop = (file: File, target: "notice" | "quiz") => {
    setUniversalPdf(file);
    setActiveTab(target);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white relative">
      {/* 3D Cyber Animated Star Constellation Background */}
      <CyberBackground3D />

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        savedNoticesCount={savedNotices.length}
        savedQuizzesCount={savedQuizzes.length}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        {/* Banner with Model & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Connected to <strong className="text-slate-200">{selectedModel}</strong> via official{" "}
              <code className="text-cyan-400 bg-slate-950 px-1 py-0.5 rounded font-mono">@google/genai</code> SDK
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Server-side API key secured
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Multimodal &amp; Visual OCR Active
            </span>
          </div>
        </div>

        {/* View Switching */}
        {activeTab === "cover" && (
          <CoverPage
            currentUser={currentUser}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onLogout={() => setCurrentUser(null)}
            onNavigateTab={setActiveTab}
            onUniversalPdfDrop={handleUniversalPdfDrop}
          />
        )}

        {activeTab === "notice" && (
          <NoticeAnalyzer
            selectedModel={selectedModel}
            initialFile={universalPdf}
            onSaveNotice={handleSaveNotice}
            onSwitchToQuiz={handleSwitchToQuiz}
          />
        )}

        {activeTab === "quiz" && (
          <QuizGenerator
            selectedModel={selectedModel}
            prefillTopic={prefillTopic}
            initialFile={universalPdf}
            onSaveQuizAttempt={handleSaveQuizAttempt}
          />
        )}

        {activeTab === "examprep" && (
          <ExamPrepDashboard
            currentUser={currentUser}
            savedNotices={savedNotices}
            savedQuizzes={savedQuizzes}
            onLaunchQuiz={handleSwitchToQuiz}
            onNavigateNotice={() => setActiveTab("notice")}
          />
        )}

        {activeTab === "history" && (
          <HistoryDashboard
            savedNotices={savedNotices}
            savedQuizzes={savedQuizzes}
            onDeleteNotice={handleDeleteNotice}
            onDeleteQuizAttempt={handleDeleteQuizAttempt}
            onClearAll={handleClearAll}
            onSelectNoticeForQuiz={handleSwitchToQuiz}
          />
        )}

        {/* Educational Student Roadmap & Guidance Footer Card */}
        <section className="bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 sm:p-8 text-xs text-slate-400 space-y-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>EduPilot AI Capabilities &amp; Roadmap</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-400 leading-relaxed">
            <div className="space-y-1">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="text-cyan-400 font-bold">1.</span> Universal PDF Reading
              </p>
              <p>
                Reads both digital text PDFs and scanned physical college circulars using visual document OCR through Gemini multimodal fallback.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="text-indigo-400 font-bold">2.</span> Module Boundary Targeting
              </p>
              <p>
                When selecting Module 1, 2, or 3, questions are formulated strictly from matching syllabus sections without hallucinating facts.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="text-fuchsia-400 font-bold">3.</span> Verified Answer Explanations
              </p>
              <p>
                Every generated question includes 4 balanced options, exactly 1 validated answer key, and concept citations from your notes.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Student Profile & Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={(user) => setCurrentUser(user)}
        currentUser={currentUser}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <p>EduPilot AI • Built with Gemma 4 &amp; Google GenAI • College Notice Analyzer &amp; Practice Test Generator</p>
      </footer>
    </div>
  );
}
