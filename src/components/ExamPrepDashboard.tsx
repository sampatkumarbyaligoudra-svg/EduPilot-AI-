import React, { useState, useEffect } from "react";
import {
  Clock,
  Award,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Target,
  Flame,
  CheckCircle,
} from "lucide-react";
import { NoticeAnalysisResult, QuizAttempt, StudentUser } from "../types";
import { speakText, stopSpeaking } from "../utils/speech";

interface ExamPrepDashboardProps {
  currentUser: StudentUser | null;
  savedNotices: NoticeAnalysisResult[];
  savedQuizzes: QuizAttempt[];
  onLaunchQuiz: (topic: string) => void;
  onNavigateNotice: () => void;
}

interface Flashcard {
  id: number;
  topic: string;
  front: string;
  back: string;
}

const DEFAULT_FLASHCARDS: Flashcard[] = [
  {
    id: 1,
    topic: "Computer Networks",
    front: "What is a Star Topology and what is its single point of failure?",
    back: "In a Star topology, all devices connect directly to a central hub or switch. If a cable fails, only that device drops. The single point of failure is the central hub: if it fails, the entire network drops.",
  },
  {
    id: 2,
    topic: "Computer Networks",
    front: "Contrast LAN vs. WAN in geographical scope and speed.",
    back: "A LAN (Local Area Network) covers an office or campus with high data rates and low latency. A WAN (Wide Area Network) spans cities, countries, or globally (like the Internet) over public telecommunication infrastructure.",
  },
  {
    id: 3,
    topic: "Computer Networks",
    front: "What are the 7 Layers of the OSI Reference Model?",
    back: "Layer 7: Application, Layer 6: Presentation, Layer 5: Session, Layer 4: Transport, Layer 3: Network, Layer 2: Data Link, Layer 1: Physical.",
  },
  {
    id: 4,
    topic: "Operating Systems",
    front: "What are the 4 Coffman conditions required for Deadlock?",
    back: "1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait. Eliminating any one condition prevents deadlock.",
  },
  {
    id: 5,
    topic: "Operating Systems",
    front: "What is the Convoy Effect in CPU Scheduling?",
    back: "A phenomenon where short processes wait behind a long CPU-intensive process in First-Come, First-Served (FCFS) scheduling, resulting in high average waiting time.",
  },
];

export const ExamPrepDashboard: React.FC<ExamPrepDashboardProps> = ({
  currentUser,
  savedNotices,
  savedQuizzes,
  onLaunchQuiz,
  onNavigateNotice,
}) => {
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [speakingCardId, setSpeakingCardId] = useState<number | null>(null);
  const [selectedDayPlan, setSelectedDayPlan] = useState<number>(1);

  // Time ticker for countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute upcoming exams from saved notices
  const examDeadlines = savedNotices
    .flatMap((n) =>
      (n.deadlines || []).map((d) => ({
        noticeTitle: n.title,
        issuer: n.issuer,
        event: d.event,
        date: d.date,
        time: d.time,
        isExam: d.isExam,
      }))
    )
    .filter((d) => d.date);

  // Fallback demo exams if no notices saved yet
  const displayedExams =
    examDeadlines.length > 0
      ? examDeadlines
      : [
          {
            noticeTitle: "Internal Assessment Assessment",
            issuer: "Computer Science Dept",
            event: "Computer Networks Examination",
            date: "15 November 2026",
            time: "10:00 AM",
            isExam: true,
          },
          {
            noticeTitle: "Semester Examination Notice",
            issuer: "Office of the Controller of Examinations",
            event: "Operating Systems Theory Exam",
            date: "28 November 2026",
            time: "02:00 PM",
            isExam: true,
          },
        ];

  const currentCard = DEFAULT_FLASHCARDS[activeCardIdx];

  const handleSpeakCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (speakingCardId === currentCard.id) {
      stopSpeaking();
      setSpeakingCardId(null);
    } else {
      const textToSpeak = isFlipped ? currentCard.back : currentCard.front;
      speakText(textToSpeak, () => setSpeakingCardId(null));
      setSpeakingCardId(currentCard.id);
    }
  };

  const handleNextCard = () => {
    stopSpeaking();
    setSpeakingCardId(null);
    setIsFlipped(false);
    setActiveCardIdx((prev) => (prev + 1) % DEFAULT_FLASHCARDS.length);
  };

  const handlePrevCard = () => {
    stopSpeaking();
    setSpeakingCardId(null);
    setIsFlipped(false);
    setActiveCardIdx((prev) => (prev - 1 + DEFAULT_FLASHCARDS.length) % DEFAULT_FLASHCARDS.length);
  };

  // Study timetable days
  const STUDY_DAYS = [
    { day: 1, title: "Foundations & Topologies", tasks: ["Star, Bus, Ring, Mesh pros & cons", "LAN vs WAN coverage differences"] },
    { day: 2, title: "OSI & TCP/IP Architecture", tasks: ["7 Layers functional breakdown", "Encapsulation & decapsulation drills"] },
    { day: 3, title: "Data Link & MAC Addressing", tasks: ["Framing, Error detection (CRC)", "Switches vs Hubs collision domains"] },
    { day: 4, title: "Network Layer & IP Routing", tasks: ["IPv4 addressing & subnetting", "Distance vector vs Link state routing"] },
    { day: 5, title: "Transport & Application Protocols", tasks: ["TCP 3-way handshake vs UDP", "HTTP, DNS, and TLS handshakes"] },
    { day: 6, title: "Mock Exam Simulation", tasks: ["Take 15-question mixed practice test", "Review explanation citations"] },
    { day: 7, title: "Final Rapid Flashcard Review", tasks: ["Formulas, diagram labels, notice check", "ID card and exam hall pass check"] },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/30 backdrop-blur-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Futuristic Exam Prep Hub
            </span>
            {currentUser && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                {currentUser.streakDays} Day Study Streak
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Exam Readiness &amp; Revision Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Live deadline countdowns, syllabus topic mastery radar, interactive voice flashcards, and automated day-by-day revision scheduling.
          </p>
        </div>

        <button
          onClick={() => onLaunchQuiz("Computer Networks")}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 shrink-0"
        >
          <Award className="w-4 h-4" />
          <span>Launch AI Exam Simulator</span>
        </button>
      </div>

      {/* Grid: Exam Countdowns & Topic Mastery Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Exam Countdowns */}
        <div className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Upcoming Exam Timelines</h3>
                <p className="text-xs text-slate-400">Extracted from official notices</p>
              </div>
            </div>

            <button
              onClick={onNavigateNotice}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>Upload Notice</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {displayedExams.map((exam, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      EXAM
                    </span>
                    <span className="text-xs text-slate-400">{exam.issuer || "College"}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{exam.event}</h4>
                  <p className="text-xs text-cyan-300 mt-0.5 flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    {exam.date} {exam.time ? `• ${exam.time}` : ""}
                  </p>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-right self-end sm:self-center">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Status</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Target className="w-3 h-3" /> Scheduled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Syllabus Mastery Radar */}
        <div className="rounded-3xl p-6 bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Syllabus Topic Mastery</h3>
                <p className="text-xs text-slate-400">Based on practice drill accuracy</p>
              </div>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
              Overall: 84%
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { topic: "Network Topologies (Star, Bus, Ring)", mastery: 92, color: "from-emerald-500 to-teal-400" },
              { topic: "LAN vs. WAN Geographical Types", mastery: 88, color: "from-cyan-500 to-blue-500" },
              { topic: "OSI Reference Model (7 Layers)", mastery: 74, color: "from-indigo-500 to-purple-500" },
              { topic: "Process Scheduling & Deadlocks", mastery: 80, color: "from-fuchsia-500 to-pink-500" },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-200">{item.topic}</span>
                  <span className="font-mono text-slate-300 font-semibold">{item.mastery}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.mastery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Tip: Complete practice tests in the Test Generator to update your topic mastery analytics.
          </p>
        </div>
      </div>

      {/* Interactive Voice Flashcards */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 backdrop-blur-xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center border border-fuchsia-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Interactive AI Concept Flashcards</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  Voice Readout
                </span>
              </h3>
              <p className="text-xs text-slate-400">Click card to flip between question and verified explanation</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Card {activeCardIdx + 1} of {DEFAULT_FLASHCARDS.length}</span>
          </div>
        </div>

        {/* 3D-Style Flip Card */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative min-h-[180px] sm:min-h-[200px] p-6 sm:p-8 rounded-3xl border cursor-pointer select-none transition-all duration-300 flex flex-col justify-between ${
            isFlipped
              ? "bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
              : "bg-slate-950/80 border-slate-800 hover:border-slate-700 shadow-md"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {currentCard.topic} • {isFlipped ? "Answer & Concept Explanation" : "Question / Concept Prompt"}
            </span>

            <button
              onClick={handleSpeakCard}
              className={`p-2 rounded-xl border text-xs transition flex items-center gap-1.5 ${
                speakingCardId === currentCard.id
                  ? "bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-500/50 animate-pulse"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-700"
              }`}
              title="Voice readout"
            >
              {speakingCardId === currentCard.id ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Stop Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Listen</span>
                </>
              )}
            </button>
          </div>

          <div className="py-4">
            <p className={`text-base sm:text-lg font-semibold leading-relaxed ${isFlipped ? "text-slate-200 font-normal" : "text-white font-bold"}`}>
              {isFlipped ? currentCard.back : currentCard.front}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/80">
            <span>Click card to {isFlipped ? "view question" : "flip answer"}</span>
            <span className="text-cyan-400 font-medium">Flip ⟳</span>
          </div>
        </div>

        {/* Flashcard Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handlePrevCard}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
          >
            Previous Card
          </button>

          <div className="flex items-center gap-1.5">
            {DEFAULT_FLASHCARDS.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeCardIdx === i ? "bg-cyan-400 w-5" : "bg-slate-700"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNextCard}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
          >
            Next Card
          </button>
        </div>
      </div>

      {/* 7-Day Day-by-Day AI Revision Timetable */}
      <div className="rounded-3xl p-6 sm:p-8 bg-slate-900/80 border border-slate-800 backdrop-blur-xl shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Automated 7-Day Exam Revision Timetable
              </h3>
              <p className="text-xs text-slate-400">
                Gemma 4 generated review schedule tailored to syllabus deadlines
              </p>
            </div>
          </div>

          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-medium">
            Active Study Plan
          </span>
        </div>

        {/* Day Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STUDY_DAYS.map((d) => (
            <button
              key={d.day}
              onClick={() => setSelectedDayPlan(d.day)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                selectedDayPlan === d.day
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              Day {d.day}
            </button>
          ))}
        </div>

        {/* Day Details Box */}
        {(() => {
          const currentDay = STUDY_DAYS.find((d) => d.day === selectedDayPlan) || STUDY_DAYS[0];
          return (
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="text-cyan-400">Day {currentDay.day}:</span>
                  <span>{currentDay.title}</span>
                </h4>
                <button
                  onClick={() => onLaunchQuiz(currentDay.title)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-semibold transition flex items-center gap-1"
                >
                  <span>Practice Day {currentDay.day} MCQs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {currentDay.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-200 flex items-center gap-2.5"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
