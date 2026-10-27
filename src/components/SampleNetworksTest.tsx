import React, { useState } from "react";
import {
  Sparkles,
  Network,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  Award,
  Zap,
} from "lucide-react";

interface SampleNetworksTestProps {
  onOpenFullGenerator: () => void;
}

interface Question {
  id: number;
  question: string;
  topic: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    topic: "Network Topologies",
    question: "In which network topology do all devices connect directly to a single central hub or switch?",
    options: ["Star topology", "Bus topology", "Ring topology", "Mesh topology"],
    correctAnswer: "Star topology",
    explanation: "In a star topology, every node connects to a central device. If a single cable fails, only that device disconnects; if the hub fails, the network drops.",
  },
  {
    id: 2,
    topic: "Geographical Network Types",
    question: "Which type of computer network covers a large geographical area across cities, countries, or globally?",
    options: ["Local Area Network (LAN)", "Wide Area Network (WAN)", "Personal Area Network (PAN)", "Storage Area Network (SAN)"],
    correctAnswer: "Wide Area Network (WAN)",
    explanation: "A WAN spans large geographical distances (e.g., the global Internet), while a LAN is restricted to an office or campus building.",
  },
  {
    id: 3,
    topic: "Fault Tolerance",
    question: "What happens in a Star topology if the central hub or switch suffers complete hardware failure?",
    options: [
      "Only the first connected node loses connection",
      "The entire network goes down and nodes cannot communicate",
      "Nodes automatically form a mesh network",
      "Data reroutes through the peripheral terminators",
    ],
    correctAnswer: "The entire network goes down and nodes cannot communicate",
    explanation: "Because all transmissions flow through the central hub in a star topology, the hub represents a single point of failure.",
  },
  {
    id: 4,
    topic: "Topologies Identification",
    question: "Which of the following is NOT one of the core topologies defined in the Module 1 study notes?",
    options: ["Bus", "Star", "Ring", "Tree"],
    correctAnswer: "Tree",
    explanation: "The supplied Module 1 text explicitly covers Star, Bus, Ring, and Mesh topologies.",
  },
  {
    id: 5,
    topic: "LAN Characteristics",
    question: "True or False: A Local Area Network (LAN) covers a limited geographical area, typically offering higher data rates and lower latency.",
    options: ["True", "False"],
    correctAnswer: "True",
    explanation: "LANs are localized to buildings or offices and operate over high-speed Ethernet/Wi-Fi with minimal propagation latency.",
  },
];

export const SampleNetworksTest: React.FC<SampleNetworksTestProps> = ({
  onOpenFullGenerator,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  const handleSelect = (qId: number, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: option,
    }));
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setActiveQuestionIdx(0);
  };

  const currentQ = SAMPLE_QUESTIONS[activeQuestionIdx];
  const userChoice = selectedAnswers[currentQ.id];
  const isAnswered = userChoice !== undefined;
  const isCorrect = userChoice === currentQ.correctAnswer;

  const answeredTotal = Object.keys(selectedAnswers).length;
  const score = Object.entries(selectedAnswers).reduce((acc, [qId, ans]) => {
    const q = SAMPLE_QUESTIONS.find((item) => item.id === Number(qId));
    return q && q.correctAnswer === ans ? acc + 1 : acc;
  }, 0);

  return (
    <div className="relative group rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-indigo-500/30 shadow-[0_0_50px_-15px_rgba(99,102,241,0.25)] backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-indigo-500/50">
      {/* Background dreamy radiant glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/15 via-indigo-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-fuchsia-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Network className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Computer Networks — Module 1
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Official Test B
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive Live Sample • Grounded in Gemma 4 Syllabus
            </p>
          </div>
        </div>

        {/* Live Score Counter Pill */}
        <div className="flex items-center gap-2.5 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800">
          <Award className="w-4 h-4 text-amber-400" />
          <div className="text-right">
            <span className="text-xs text-slate-400 block leading-none">Score</span>
            <span className="text-sm font-extrabold text-white">
              {score} / {SAMPLE_QUESTIONS.length}
            </span>
          </div>
          {answeredTotal > 0 && (
            <button
              onClick={handleReset}
              className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Reset sample test"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Question Selector Tabs */}
      <div className="relative z-10 flex items-center gap-2 my-5 overflow-x-auto pb-1">
        {SAMPLE_QUESTIONS.map((q, idx) => {
          const ans = selectedAnswers[q.id];
          const isQCorrect = ans && ans === q.correctAnswer;
          const isQWrong = ans && ans !== q.correctAnswer;
          const isCurrent = activeQuestionIdx === idx;

          return (
            <button
              key={q.id}
              onClick={() => setActiveQuestionIdx(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                isCurrent
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-white/30"
                  : ans
                  ? isQCorrect
                    ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-950/40 text-rose-300 border border-rose-500/30"
                  : "bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              <span>Q{idx + 1}</span>
              {ans && (
                <span>{isQCorrect ? "✓" : "✗"}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Question Box */}
      <div className="relative z-10 bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80 space-y-4">
        <div>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-cyan-400 flex items-center gap-1 mb-1">
            <Zap className="w-3 h-3" />
            {currentQ.topic}
          </span>
          <h4 className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
            {currentQ.id}. {currentQ.question}
          </h4>
        </div>

        {/* Interactive Option Cards */}
        <div className="space-y-2.5">
          {currentQ.options.map((option, optIdx) => {
            const isSelected = userChoice === option;
            const isThisCorrect = option === currentQ.correctAnswer;

            let style = "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-slate-900";

            if (isAnswered) {
              if (isThisCorrect) {
                style = "bg-emerald-950/40 border-emerald-500/60 text-emerald-200 font-semibold ring-1 ring-emerald-500/50 shadow-md shadow-emerald-500/10";
              } else if (isSelected && !isThisCorrect) {
                style = "bg-rose-950/40 border-rose-500/60 text-rose-300 line-through ring-1 ring-rose-500/40";
              } else {
                style = "bg-slate-900/30 border-slate-900 text-slate-500 opacity-50";
              }
            }

            return (
              <button
                key={optIdx}
                onClick={() => handleSelect(currentQ.id, option)}
                disabled={isAnswered}
                className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition flex items-center justify-between gap-3 ${style}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-800/80 text-slate-300 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span>{option}</span>
                </div>

                {isAnswered && isThisCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {isAnswered && isSelected && !isThisCorrect && (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Concept Citation & Explanation */}
        {isAnswered && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 text-xs space-y-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className={`font-bold flex items-center gap-1.5 ${isCorrect ? "text-emerald-400" : "text-amber-400"}`}>
                <HelpCircle className="w-4 h-4" />
                {isCorrect ? "Correct! Verified by Gemma 4 Notes" : "Concept Review"}
              </span>
              <span className="text-[11px] text-slate-400">
                Answer: <strong className="text-emerald-300">{currentQ.correctAnswer}</strong>
              </span>
            </div>
            <p className="text-slate-300/90 pl-5 leading-relaxed">
              {currentQ.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Footer Navigation & CTA to Full Generator */}
      <div className="relative z-10 mt-6 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveQuestionIdx(Math.max(0, activeQuestionIdx - 1))}
            disabled={activeQuestionIdx === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
          >
            Previous
          </button>
          <button
            onClick={() => setActiveQuestionIdx(Math.min(SAMPLE_QUESTIONS.length - 1, activeQuestionIdx + 1))}
            disabled={activeQuestionIdx === SAMPLE_QUESTIONS.length - 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition"
          >
            Next Question
          </button>
          <span className="text-xs text-slate-500 ml-2">
            Question {activeQuestionIdx + 1} of {SAMPLE_QUESTIONS.length}
          </span>
        </div>

        <button
          onClick={onOpenFullGenerator}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-cyan-200" />
          <span>Launch Full AI Test Generator with this Material</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
