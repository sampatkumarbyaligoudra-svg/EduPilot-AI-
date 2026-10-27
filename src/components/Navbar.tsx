import { Sparkles, FileText, CheckSquare, GraduationCap, Cpu, History, Home, User, Target } from "lucide-react";
import { StudentUser } from "../types";

interface NavbarProps {
  activeTab: "cover" | "notice" | "quiz" | "history" | "examprep";
  setActiveTab: (tab: "cover" | "notice" | "quiz" | "history" | "examprep") => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  savedNoticesCount: number;
  savedQuizzesCount: number;
  currentUser: StudentUser | null;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedModel,
  setSelectedModel,
  savedNoticesCount,
  savedQuizzesCount,
  currentUser,
  onOpenLogin,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090514]/95 backdrop-blur-md border-b border-orange-500/20 shadow-lg shadow-black/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div
            onClick={() => setActiveTab("cover")}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-purple-700 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-600/30 ring-1 ring-orange-400/40 group-hover:scale-105 group-hover:rotate-3 transition animate-pumpkin-pulse">
              <span className="text-xl">🎃</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-orange-400 transition flex items-center gap-1.5">
                  EduPilot AI
                </span>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 flex items-center gap-1 shadow-sm shadow-orange-500/20">
                  <span>👻</span>
                  Gemma 4
                </span>
              </div>
              <p className="text-[11px] text-purple-300/80 hidden sm:block">
                College Notice Analyzer &amp; AI Practice Tests
              </p>
            </div>
          </div>

          {/* Model Selector Pill */}
          <div className="hidden md:flex items-center gap-2 bg-purple-950/40 px-3 py-1.5 rounded-xl border border-orange-500/30 shadow-inner">
            <Cpu className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-purple-300 font-medium">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-transparent text-xs text-orange-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="gemma-4-26b-a4b-it" className="bg-[#090514] text-slate-200">
                Gemma 4 26B A4B (Recommended)
              </option>
              <option value="gemma-4-31b-it" className="bg-[#090514] text-slate-200">
                Gemma 4 31B
              </option>
              <option value="gemini-3.1-flash-lite" className="bg-[#090514] text-slate-200">
                Gemini 3.1 Flash Lite (Fast Vision OCR)
              </option>
              <option value="gemini-3.8-flash" className="bg-[#090514] text-slate-200">
                Gemini 3.8 Flash (Visual OCR)
              </option>
            </select>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab("cover")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "cover"
                  ? "bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30 scale-102"
                  : "text-slate-300 hover:bg-purple-950/50 hover:text-orange-300"
              }`}
            >
              <Home className="w-4 h-4 text-orange-400" />
              <span>Castle</span>
            </button>

            <button
              onClick={() => setActiveTab("notice")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "notice"
                  ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white shadow-md shadow-purple-700/40 scale-102"
                  : "text-slate-300 hover:bg-purple-950/50 hover:text-purple-300"
              }`}
            >
              <FileText className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Notice Analyzer</span>
              <span className="sm:hidden">Notices</span>
            </button>

            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "quiz"
                  ? "bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white shadow-md shadow-orange-600/40 scale-102"
                  : "text-slate-300 hover:bg-purple-950/50 hover:text-orange-300"
              }`}
            >
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Test Generator</span>
              <span className="sm:hidden">Tests</span>
            </button>

            <button
              onClick={() => setActiveTab("examprep")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "examprep"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/30 scale-102"
                  : "text-slate-300 hover:bg-purple-950/50 hover:text-emerald-400"
              }`}
            >
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Prep Hub</span>
              <span className="sm:hidden">Prep</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-gradient-to-r from-fuchsia-700 to-purple-800 text-white shadow-md shadow-fuchsia-700/30 scale-102"
                  : "text-slate-300 hover:bg-purple-950/50 hover:text-fuchsia-300"
              }`}
              title="Saved notices and test scores"
            >
              <span className="text-sm">⚰️</span>
              <span className="hidden md:inline">Vault</span>
              {(savedNoticesCount > 0 || savedQuizzesCount > 0) && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/40 font-mono font-bold">
                  {savedNoticesCount + savedQuizzesCount}
                </span>
              )}
            </button>

            {/* Student Profile / Login Pill */}
            <button
              onClick={onOpenLogin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition hover:scale-105 ${
                currentUser
                  ? "bg-purple-950/80 hover:bg-purple-900/90 border-orange-500/40 text-orange-200 shadow-md shadow-orange-950/30"
                  : "bg-gradient-to-r from-orange-600/30 to-purple-600/30 hover:from-orange-600/40 hover:to-purple-600/40 border-orange-500/50 text-orange-300"
              }`}
              title={currentUser ? `Signed in as ${currentUser.name}` : "Click to sign in"}
            >
              {currentUser ? (
                <>
                  <span className="text-sm">{currentUser.avatar}</span>
                  <span className="hidden lg:inline max-w-[80px] truncate">{currentUser.name}</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
