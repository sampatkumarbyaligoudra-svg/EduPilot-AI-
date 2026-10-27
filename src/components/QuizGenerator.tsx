import React, { useState, useRef, useEffect } from "react";
import {
  CheckSquare,
  Upload,
  Sparkles,
  AlertTriangle,
  Award,
  RotateCcw,
  BookOpen,
  FileCheck2,
  Trash2,
  Bookmark,
  Printer,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Image as ImageIcon,
} from "lucide-react";
import { QuizResult, QuizAttempt } from "../types";
import { SAMPLE_NOTES, SampleNotes } from "../sampleData";
import { createSpeechRecognizer, speakText, stopSpeaking } from "../utils/speech";

interface QuizGeneratorProps {
  selectedModel: string;
  prefillTopic?: string | null;
  initialFile?: File | null;
  onSaveQuizAttempt: (attempt: QuizAttempt) => void;
}

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({
  selectedModel,
  prefillTopic,
  initialFile,
  onSaveQuizAttempt,
}) => {
  const [materialText, setMaterialText] = useState("");
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [scope, setScope] = useState("Module 1");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [count, setCount] = useState("5");
  const [format, setFormat] = useState<"MCQ" | "True/False" | "Mixed">("Mixed");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizResult | null>(null);

  // Quiz Taking State
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [instantReview, setInstantReview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Voice recording & playback states
  const [isRecording, setIsRecording] = useState(false);
  const [speakingQIndex, setSpeakingQIndex] = useState<number | null>(null);
  const recognizerRef = useRef(createSpeechRecognizer());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreview(null);
    }
  }, [file]);

  const toggleRecording = () => {
    if (isRecording) {
      recognizerRef.current.stop();
      setIsRecording(false);
    } else {
      const started = recognizerRef.current.start(
        (transcript) => {
          setMaterialText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        },
        () => setIsRecording(false)
      );
      if (started) {
        setIsRecording(true);
      } else {
        alert("Speech recognition is not supported or permission denied in this browser.");
      }
    }
  };

  const handleSpeakQuestion = (qIndex: number, text: string) => {
    if (speakingQIndex === qIndex) {
      stopSpeaking();
      setSpeakingQIndex(null);
    } else {
      speakText(text, () => setSpeakingQIndex(null));
      setSpeakingQIndex(qIndex);
    }
  };

  useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
      setError(null);
    }
  }, [initialFile]);

  useEffect(() => {
    if (prefillTopic) {
      setScope(prefillTopic.slice(0, 40));
    }
  }, [prefillTopic]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleLoadSample = (sample: SampleNotes) => {
    setMaterialText(sample.text);
    setScope(sample.scope);
    setFile(null);
    setError(null);
  };

  const handleClear = () => {
    setMaterialText("");
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialText.trim() && !file) {
      setError("Please paste study material/notes or upload a notes PDF.");
      return;
    }

    setLoading(true);
    setError(null);
    setQuiz(null);
    setUserAnswers({});
    setSubmitted(false);
    setScore(null);
    setIsSaved(false);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      if (materialText.trim()) {
        formData.append("materialText", materialText.trim());
      }
      formData.append("scope", scope);
      formData.append("difficulty", difficulty);
      formData.append("count", count);
      formData.append("format", format);
      formData.append("model", selectedModel);

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate practice test.");
      }

      setQuiz({
        ...data,
        id: `quiz-${Date.now()}`,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      setError(err.message || "An error occurred while generating questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, option: string) => {
    if (submitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qIndex]: option,
    }));
  };

  const handleSubmitQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    let totalScore = 0;
    quiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        totalScore++;
      }
    });

    setScore(totalScore);
    setSubmitted(true);

    // Save attempt automatically to history
    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      quizTitle: quiz.title,
      scope: quiz.scope,
      difficulty: quiz.difficulty,
      score: totalScore,
      total: quiz.questions.length,
      timestamp: Date.now(),
      userAnswers,
      questions: quiz.questions,
    };
    onSaveQuizAttempt(attempt);
    setIsSaved(true);
  };

  const handleRetake = () => {
    setUserAnswers({});
    setSubmitted(false);
    setScore(null);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const totalQuestions = quiz?.questions.length || 0;
  const scorePercent = totalQuestions > 0 && score !== null ? Math.round((score / totalQuestions) * 100) : 0;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const isPdf = droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf");
      const isImg = droppedFile.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp)$/i.test(droppedFile.name);

      if (isPdf || isImg) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please upload a study notes PDF or photo (PNG, JPEG, WebP).");
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-orange-950/40 via-[#0e071a] to-purple-950/40 rounded-2xl border border-orange-500/30 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xl animate-pumpkin-pulse">
                🎃
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Spooky Practice Test Generator</h2>
            </div>
            <p className="mt-1 text-sm text-purple-200/80 max-w-2xl">
              Upload syllabus, textbook photos, handwritten notes, or PDFs. Gemma 4 crafts verified practice questions with instant Halloween scoreboards and thorough step-by-step explanations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-[#160c29] text-orange-300 border border-orange-500/30 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Powered by Gemma 4 🎃
            </span>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="mt-5 pt-4 border-t border-purple-900/40 flex flex-wrap items-center gap-2">
          <span className="text-xs text-orange-300/80 font-bold">🎃 Quick Study Grimoires:</span>
          {SAMPLE_NOTES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample)}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#140b22] hover:bg-[#1f1035] text-purple-200 hover:text-white border border-purple-500/30 hover:border-orange-500/50 transition flex items-center gap-1.5"
            >
              <BookOpen className="w-3 h-3 text-orange-400" />
              <span>{sample.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generator Configuration Form */}
      <form onSubmit={handleGenerate} className="bg-[#0e071a]/95 rounded-2xl border border-purple-900/60 p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Zone */}
          <div>
            <label className="block text-sm font-semibold text-orange-200/90 mb-2 flex items-center gap-1.5">
              <span>Study Material PDF or Photo (Notes, Slides, Board Snaps)</span>
              <span className="text-xs text-orange-400">📸</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-purple-800/60 hover:border-orange-500/50 bg-[#07040d]/80"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  {filePreview ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-orange-500/50 shadow-md">
                      <img src={filePreview} alt="Notes preview" className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-orange-300 font-bold">
                        PHOTO 📸
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 text-2xl">
                      🎃
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-orange-300 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-purple-300/80">
                      {(file.size / 1024).toFixed(1)} KB • {file.type.startsWith("image/") ? "Photo / Chalkboard Note (Vision OCR)" : "PDF Document"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-2 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/30 text-2xl animate-pumpkin-pulse">
                    🎃
                  </div>
                  <p className="text-sm font-bold text-white">
                    Select study material PDF or Photo (JPEG, PNG, WebP)
                  </p>
                  <p className="text-xs text-purple-300/70">Lecture slides, handwritten pages, and textbook photos</p>
                </div>
              )}
            </div>
          </div>

          {/* Paste or Voice Dictate Notes Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="materialText" className="text-sm font-semibold text-orange-200/90 flex items-center gap-1.5">
                <span>Or Paste / Dictate Study Notes</span>
                <span className="text-xs text-orange-400">🧙</span>
              </label>

              {/* Voice Dictation Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isRecording
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse"
                      : "bg-[#140b22] text-purple-200 hover:text-white border border-purple-500/30 hover:border-orange-500/50"
                  }`}
                  title={isRecording ? "Click to stop recording" : "Speak to dictate study notes"}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-orange-400" />}
                  <span>{isRecording ? "Listening..." : "Voice Dictate"}</span>
                </button>
                {materialText && (
                  <span className="text-xs text-purple-300/70 font-mono hidden sm:inline">{materialText.length} chars</span>
                )}
              </div>
            </div>
            <textarea
              id="materialText"
              value={materialText}
              onChange={(e) => setMaterialText(e.target.value)}
              placeholder="Paste chapter notes, key definitions, formulas, or speak using Voice Dictate..."
              rows={5}
              className="w-full bg-[#07040d]/90 border border-purple-900/60 rounded-xl p-3.5 text-sm text-purple-100 placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60 font-sans resize-y shadow-inner"
            />
          </div>
        </div>

        {/* Quiz Parameters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#08040f]/90 border border-purple-900/60">
          {/* Scope Selector */}
          <div>
            <label htmlFor="scopeSelect" className="block text-xs font-bold text-orange-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>Target Scope</span>
            </label>
            <select
              id="scopeSelect"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full bg-[#140b22] border border-purple-800/60 rounded-lg px-3 py-2 text-xs text-purple-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="Module 1">Module 1</option>
              <option value="Module 2">Module 2</option>
              <option value="Module 3">Module 3</option>
              <option value="Module 4">Module 4</option>
              <option value="Module 5">Module 5</option>
              <option value="Selected modules">Selected modules</option>
              <option value="Full subject">Full subject</option>
              <option value="All covered topics">All covered topics</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label htmlFor="difficultySelect" className="block text-xs font-bold text-orange-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>Difficulty Level</span>
            </label>
            <select
              id="difficultySelect"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full bg-[#140b22] border border-purple-800/60 rounded-lg px-3 py-2 text-xs text-purple-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="Easy">Easy (Recall & definitions)</option>
              <option value="Medium">Medium (Conceptual & applied)</option>
              <option value="Hard">Hard (Deep analysis & scenario)</option>
            </select>
          </div>

          {/* Question Count */}
          <div>
            <label htmlFor="countSelect" className="block text-xs font-bold text-orange-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>Question Count</span>
            </label>
            <select
              id="countSelect"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full bg-[#140b22] border border-purple-800/60 rounded-lg px-3 py-2 text-xs text-purple-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="5">5 questions (Quick drill)</option>
              <option value="10">10 questions (Standard quiz)</option>
              <option value="15">15 questions (Full exam practice)</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <label htmlFor="formatSelect" className="block text-xs font-bold text-orange-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>Question Format</span>
            </label>
            <select
              id="formatSelect"
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full bg-[#140b22] border border-purple-800/60 rounded-lg px-3 py-2 text-xs text-purple-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="MCQ">Multiple Choice Only (4 options)</option>
              <option value="True/False">True / False</option>
              <option value="Mixed">Mixed (MCQ + True/False)</option>
            </select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-sm flex items-start gap-3 shadow-lg shadow-rose-950/50">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Question Generation Spell Failed</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-purple-900/40">
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || (!materialText && !file)}
            className="px-4 py-2 text-xs font-semibold text-purple-300/70 hover:text-orange-300 disabled:opacity-40 transition"
          >
            Clear Material
          </button>

          <button
            type="submit"
            disabled={loading || (!materialText.trim() && !file)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-purple-700 hover:from-orange-500 hover:to-purple-600 text-white font-bold text-sm shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gemma 4 Formulating Spooky Test... 🎃</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Generate Practice Test with Gemma 4 🎃</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Interactive Quiz Display */}
      {quiz && (
        <div className="bg-[#0e071a]/95 rounded-2xl border border-orange-500/30 p-6 sm:p-7 shadow-2xl shadow-orange-950/40 space-y-6 relative overflow-hidden">
          {/* Subtle eerie background gradient */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-500/10 via-purple-500/10 to-transparent pointer-events-none rounded-full blur-2xl" />
          {/* Header & Meta */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {quiz.scope || "Full Subject"}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                    quiz.difficulty === "Easy"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : quiz.difficulty === "Hard"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {quiz.difficulty} Level
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  {quiz.questions.length} Questions
                </span>
                {quiz.usedModel && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {quiz.usedModel}
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{quiz.title}</h3>
            </div>

            {/* Test Settings */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInstantReview(!instantReview)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                  instantReview
                    ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
                title="Show explanations immediately as you answer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Instant Explanations: {instantReview ? "ON" : "OFF"}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                title="Print practice test"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Score Banner when Submitted */}
          {submitted && score !== null && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-950/60 via-purple-950/60 to-[#07040d] border border-orange-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl border shadow-inner ${
                    scorePercent >= 80
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : scorePercent >= 50
                      ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                      : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  }`}
                >
                  {scorePercent >= 80 ? "🎃" : scorePercent >= 50 ? "🧙" : "👻"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-black text-white">Your Score: {score} / {totalQuestions}</h4>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#160c29] text-orange-400 font-mono font-bold border border-orange-500/30">
                      {scorePercent}%
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/90 mt-0.5">
                    {scorePercent === 100
                      ? "🎃 Supernatural score! You mastered every spell and concept in these notes."
                      : scorePercent >= 70
                      ? "🧙 Great performance! Review the citations below to banish the last doubts."
                      : "👻 Spooky drill complete! Check the concept citations below to power up your knowledge."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRetake}
                  className="px-4 py-2 rounded-xl bg-[#1a0d33] hover:bg-[#251347] text-orange-300 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-purple-700/50 transition shadow-md"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                  <span>Retake Test 🎃</span>
                </button>
                {isSaved && (
                  <span className="text-xs text-orange-400 flex items-center gap-1 font-bold">
                    <Bookmark className="w-3.5 h-3.5 fill-orange-400" /> Saved
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-purple-300/80">
              <span>
                Answered <strong className="text-orange-300 font-bold">{answeredCount}</strong> of {totalQuestions}
              </span>
              <span className="font-mono">{Math.round((answeredCount / (totalQuestions || 1)) * 100)}% Completed</span>
            </div>
            <div className="w-full bg-[#07040d] h-2.5 rounded-full overflow-hidden border border-purple-900/60">
              <div
                className="bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 h-full transition-all duration-300 shadow-sm"
                style={{ width: `${(answeredCount / (totalQuestions || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Questions List */}
          <form onSubmit={handleSubmitQuiz} className="space-y-6">
            {quiz.questions.map((q, qIndex) => {
              const selectedOption = userAnswers[qIndex];
              const isCorrect = selectedOption === q.correctAnswer;
              const showFeedback = submitted || (instantReview && selectedOption !== undefined);

              return (
                <div
                  key={qIndex}
                  className={`p-5 rounded-2xl border transition-all ${
                    submitted
                      ? isCorrect
                        ? "bg-emerald-950/20 border-emerald-500/40"
                        : "bg-rose-950/20 border-rose-500/40"
                      : "bg-[#090412]/80 border-purple-900/50 hover:border-orange-500/40"
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[#140b22] text-orange-300 border border-purple-800/60 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {qIndex + 1}
                      </span>
                      <div>
                        {q.topic && (
                          <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block mb-1">
                            {q.topic}
                          </span>
                        )}
                        <h4 className="text-sm sm:text-base font-semibold text-purple-100">{q.question}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSpeakQuestion(qIndex, `${q.question}. Options: ${q.options.join(". ")}. ${submitted ? `Correct answer is ${q.correctAnswer}. ${q.explanation}` : ""}`)}
                        className={`p-1.5 rounded-lg border text-xs transition ${
                          speakingQIndex === qIndex
                            ? "bg-purple-600/30 text-purple-200 border-purple-500/50 animate-pulse"
                            : "bg-[#140b22] text-purple-300 hover:text-white border-purple-800/60 hover:bg-[#1e1033]"
                        }`}
                        title="Listen to question read aloud"
                      >
                        {speakingQIndex === qIndex ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-orange-400" />}
                      </button>

                      {submitted && (
                        <div>
                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/15 px-2 py-1 rounded-md border border-emerald-500/30">
                              🎃 Correct!
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-rose-300 bg-rose-500/15 px-2 py-1 rounded-md border border-rose-500/30">
                              👻 Try Again
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 mt-4">
                    {q.options.map((option, optIndex) => {
                      const isSelected = selectedOption === option;
                      const isThisCorrect = option === q.correctAnswer;

                      let optionStyle = "border-purple-900/40 bg-[#0c0617] hover:bg-[#160c29] text-purple-200";

                      if (submitted) {
                        if (isThisCorrect) {
                          optionStyle = "border-emerald-500/60 bg-emerald-500/15 text-emerald-200 font-bold";
                        } else if (isSelected && !isThisCorrect) {
                          optionStyle = "border-rose-500/60 bg-rose-500/15 text-rose-300 line-through";
                        } else {
                          optionStyle = "border-purple-900/30 bg-[#07040d]/60 text-purple-400/50 opacity-60";
                        }
                      } else if (isSelected) {
                        optionStyle = "border-orange-500 bg-orange-500/15 text-white font-semibold ring-1 ring-orange-500/60";
                      }

                      return (
                        <label
                          key={optIndex}
                          onClick={() => handleSelectAnswer(qIndex, option)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer select-none transition ${optionStyle}`}
                        >
                          <input
                            type="radio"
                            name={`question-${qIndex}`}
                            value={option}
                            checked={isSelected}
                            disabled={submitted}
                            onChange={() => {}}
                            className="w-4 h-4 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                          />
                          <span className="leading-normal flex-1">{option}</span>
                          {submitted && isThisCorrect && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                              🎃 Solution
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {/* Explanation Block */}
                  {showFeedback && (
                    <div className="mt-4 p-3.5 rounded-xl bg-[#07040d] border border-purple-900/60 text-xs text-purple-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-orange-400">
                        <Lightbulb className="w-3.5 h-3.5 text-orange-400" />
                        <span>Explanation & Concept Citation:</span>
                      </div>
                      <p className="text-purple-200/90 pl-5 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Test Submit Bar */}
            {!submitted ? (
              <div className="pt-4 border-t border-purple-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-purple-300/80">
                  {answeredCount < totalQuestions
                    ? `🎃 You have answered ${answeredCount} of ${totalQuestions} questions. You can review and answer the rest before scoring.`
                    : "✨ All questions answered! Reveal your Halloween performance score below."}
                </p>

                <button
                  type="submit"
                  disabled={answeredCount === 0}
                  className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-purple-700 hover:from-orange-500 hover:to-purple-600 text-white font-bold text-sm shadow-lg shadow-orange-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition transform hover:-translate-y-0.5"
                >
                  🎃 Submit Test & Unveil Score
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-purple-900/40 flex items-center justify-between">
                <span className="text-xs text-purple-300/80 font-medium">
                  Practice test completed. Explanations and citations are displayed above.
                </span>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition"
                >
                  Retake Test 🎃
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

