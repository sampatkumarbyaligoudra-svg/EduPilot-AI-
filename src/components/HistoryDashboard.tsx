import React, { useState } from "react";
import {
  Bookmark,
  Calendar,
  CheckSquare,
  Award,
  Trash2,
  Clock,
  ExternalLink,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { NoticeAnalysisResult, QuizAttempt } from "../types";

interface HistoryDashboardProps {
  savedNotices: NoticeAnalysisResult[];
  savedQuizzes: QuizAttempt[];
  onDeleteNotice: (id: string) => void;
  onDeleteQuizAttempt: (id: string) => void;
  onClearAll: () => void;
  onSelectNoticeForQuiz: (title: string) => void;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({
  savedNotices,
  savedQuizzes,
  onDeleteNotice,
  onDeleteQuizAttempt,
  onClearAll,
  onSelectNoticeForQuiz,
}) => {
  const [activeTab, setActiveTab] = useState<"notices" | "quizzes">("notices");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-cyan-400" />
            <span>Saved College Notices & Test History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access your saved circulars, deadlines, checklist progress, and previous exam test scores.
          </p>
        </div>

        {(savedNotices.length > 0 || savedQuizzes.length > 0) && (
          <button
            onClick={onClearAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab("notices")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "notices"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Saved Notices ({savedNotices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("quizzes")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === "quizzes"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Practice Test Scores ({savedQuizzes.length})</span>
        </button>
      </div>

      {/* Notices Tab */}
      {activeTab === "notices" && (
        <div className="space-y-4">
          {savedNotices.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-900 border border-slate-800 p-8">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">No saved notices yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Analyze a college notice in the Notice Analyzer and click "Save" to keep track of its deadlines and action items here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedNotices.map((notice) => (
                <div
                  key={notice.id || Math.random()}
                  className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-3 hover:border-slate-700 transition relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {notice.category || "Notice"}
                        </span>
                        {notice.issuer && (
                          <span className="text-[11px] text-slate-400">{notice.issuer}</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white leading-snug">{notice.title}</h4>
                    </div>

                    <button
                      onClick={() => notice.id && onDeleteNotice(notice.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 transition"
                      title="Delete notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2">{notice.summary}</p>

                  {/* Deadlines snippet */}
                  {notice.deadlines && notice.deadlines.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" /> Upcoming Deadlines
                      </p>
                      {notice.deadlines.slice(0, 2).map((d, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-center justify-between">
                          <span className="truncate pr-2">{d.event}</span>
                          <span className="font-semibold text-cyan-300 shrink-0">{d.date || "TBD"}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {notice.actions?.length || 0} Action Items
                    </span>

                    <button
                      onClick={() => onSelectNoticeForQuiz(notice.title)}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Take Practice Quiz</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quizzes Tab */}
      {activeTab === "quizzes" && (
        <div className="space-y-4">
          {savedQuizzes.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-900 border border-slate-800 p-8">
              <Award className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">No test attempts recorded yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Generate and take a practice test in the Test Generator. Your scores and topics will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedQuizzes.map((attempt) => {
                const percent = Math.round((attempt.score / (attempt.total || 1)) * 100);
                const dateStr = new Date(attempt.timestamp).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={attempt.id}
                    className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                          percent >= 80
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : percent >= 50
                            ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {percent}%
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {attempt.scope}
                          </span>
                          <span className="text-[11px] text-slate-400">{attempt.difficulty}</span>
                          <span className="text-[11px] text-slate-500 font-mono">• {dateStr}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white">{attempt.quizTitle}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Score: {attempt.score} of {attempt.total} questions answered correctly
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => onDeleteQuizAttempt(attempt.id)}
                        className="text-slate-500 hover:text-rose-400 p-2 transition"
                        title="Delete this test record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
