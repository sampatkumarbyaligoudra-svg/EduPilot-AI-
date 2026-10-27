import React, { useState } from "react";
import {
  Sparkles,
  GraduationCap,
  User,
  School,
  BookOpen,
  X,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { StudentUser } from "../types";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: StudentUser) => void;
  currentUser: StudentUser | null;
}

const AVATARS = [
  "👨‍🎓",
  "👩‍🎓",
  "🚀",
  "⚡",
  "💡",
  "🤖",
  "🌟",
  "🔬",
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
}) => {
  const [name, setName] = useState(currentUser?.name || "Sampat Kumar");
  const [college, setCollege] = useState(currentUser?.college || "College of Engineering & Technology");
  const [branch, setBranch] = useState(currentUser?.branch || "Computer Science & Engineering");
  const [semester, setSemester] = useState(currentUser?.semester || "Semester 6");
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || "👨‍🎓");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const user: StudentUser = {
      id: currentUser?.id || `student-${Date.now()}`,
      name: name.trim(),
      college: college.trim() || "National Engineering College",
      branch: branch.trim() || "Computer Science",
      semester: semester || "Semester 6",
      avatar: selectedAvatar,
      streakDays: currentUser?.streakDays || 3,
      quizzesTaken: currentUser?.quizzesTaken || 5,
      noticesSaved: currentUser?.noticesSaved || 2,
      joinedAt: currentUser?.joinedAt || Date.now(),
    };

    onLogin(user);
    onClose();
  };

  const handleQuickLogin = (role: "CS" | "EC" | "Guest") => {
    let user: StudentUser;
    if (role === "CS") {
      user = {
        id: "student-sampat",
        name: "Sampat Kumar",
        college: "College of Engineering & Technology",
        branch: "Computer Science & Engineering",
        semester: "Semester 6",
        avatar: "👨‍🎓",
        streakDays: 4,
        quizzesTaken: 8,
        noticesSaved: 3,
        joinedAt: Date.now() - 86400000 * 10,
      };
    } else if (role === "EC") {
      user = {
        id: "student-priya",
        name: "Priya Sharma",
        college: "National Institute of Technology",
        branch: "Electronics & Communication",
        semester: "Semester 4",
        avatar: "👩‍🎓",
        streakDays: 2,
        quizzesTaken: 4,
        noticesSaved: 2,
        joinedAt: Date.now() - 86400000 * 5,
      };
    } else {
      user = {
        id: `guest-${Date.now()}`,
        name: "Guest Student",
        college: "EduPilot Campus",
        branch: "Engineering",
        semester: "Year 3",
        avatar: "🚀",
        streakDays: 1,
        quizzesTaken: 0,
        noticesSaved: 0,
        joinedAt: Date.now(),
      };
    }
    onLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl shadow-indigo-500/10 p-6 sm:p-8 overflow-hidden">
        {/* Glowing Decorative background */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-gradient-to-tr from-fuchsia-500/20 to-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{currentUser ? "Student Profile" : "Student Login"}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                EduPilot AI
              </span>
            </h3>
            <p className="text-xs text-slate-400">Personalize your exam dashboard &amp; study history</p>
          </div>
        </div>

        {/* Quick 1-Click Login Chips */}
        <div className="mb-6 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Fast 1-Click Login</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("CS")}
              className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-left transition group"
            >
              <div className="text-base">👨‍🎓</div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 truncate">Sampat K.</div>
              <div className="text-[10px] text-slate-500 truncate">CSE Dept</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("EC")}
              className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-left transition group"
            >
              <div className="text-base">👩‍🎓</div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-fuchsia-400 truncate">Priya S.</div>
              <div className="text-[10px] text-slate-500 truncate">ECE Dept</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("Guest")}
              className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-left transition group"
            >
              <div className="text-base">🚀</div>
              <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 truncate">Guest</div>
              <div className="text-[10px] text-slate-500 truncate">Instant access</div>
            </button>
          </div>
        </div>

        {/* Custom Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Choose Avatar</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {AVATARS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setSelectedAvatar(av)}
                  className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition ${
                    selectedAvatar === av
                      ? "bg-indigo-600/30 border-2 border-indigo-400 scale-105 shadow-md shadow-indigo-500/20"
                      : "bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400"
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Student Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sampat Kumar"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">College / University</label>
            <div className="relative">
              <School className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                placeholder="e.g. College of Engineering"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Branch / Major</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. CSE / ECE"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>Semester 1</option>
                <option>Semester 2</option>
                <option>Semester 3</option>
                <option>Semester 4</option>
                <option>Semester 5</option>
                <option>Semester 6</option>
                <option>Semester 7</option>
                <option>Semester 8</option>
                <option>Postgraduate</option>
              </select>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{currentUser ? "Update Student Profile" : "Continue to EduPilot AI"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
