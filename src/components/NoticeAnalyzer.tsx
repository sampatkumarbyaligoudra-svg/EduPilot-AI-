import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Upload,
  Calendar,
  Clock,
  CheckSquare,
  AlertTriangle,
  FolderOpen,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  Printer,
  ChevronRight,
  ShieldCheck,
  FileCheck2,
  Trash2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Image as ImageIcon,
} from "lucide-react";
import { NoticeAnalysisResult } from "../types";
import { SAMPLE_NOTICES, SampleNotice } from "../sampleData";
import { createSpeechRecognizer, speakText, stopSpeaking } from "../utils/speech";

interface NoticeAnalyzerProps {
  selectedModel: string;
  initialFile?: File | null;
  onSaveNotice: (notice: NoticeAnalysisResult) => void;
  onSwitchToQuiz: (prefillTopic: string) => void;
}

export const NoticeAnalyzer: React.FC<NoticeAnalyzerProps> = ({
  selectedModel,
  initialFile,
  onSaveNotice,
  onSwitchToQuiz,
}) => {
  const [noticeText, setNoticeText] = useState("");
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NoticeAnalysisResult | null>(null);
  const [checkedActions, setCheckedActions] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Voice recording & playback states
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognizerRef = useRef(createSpeechRecognizer());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
      setError(null);
    }
  }, [initialFile]);

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
          setNoticeText((prev) => (prev ? `${prev} ${transcript}` : transcript));
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

  const toggleSpeechPlayback = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else if (result) {
      const text = `${result.title}. ${result.summary}. Upcoming deadlines: ${result.deadlines.map((d) => `${d.event} on ${d.date || "unspecified date"}`).join(". ")}`;
      speakText(text, () => setIsSpeaking(false));
      setIsSpeaking(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const isValid =
        droppedFile.type === "application/pdf" ||
        droppedFile.type.startsWith("image/") ||
        /\.(pdf|png|jpe?g|webp|bmp|heic)$/i.test(droppedFile.name);
      if (isValid) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please upload a PDF document or image file (JPEG, PNG, WebP).");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleLoadSample = (sample: SampleNotice) => {
    setNoticeText(sample.text);
    setFile(null);
    setError(null);
  };

  const handleClear = () => {
    setNoticeText("");
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeText.trim() && !file) {
      setError("Please paste the notice text or upload a college notice PDF.");
      return;
    }

    setLoading(true);
    setError(null);
    setCheckedActions({});
    setIsSaved(false);

    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      if (noticeText.trim()) {
        formData.append("noticeText", noticeText.trim());
      }
      formData.append("model", selectedModel);

      const response = await fetch("/api/analyze-notice", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze the notice.");
      }

      setResult({
        ...data,
        id: `notice-${Date.now()}`,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      setError(err.message || "An error occurred while analyzing the notice.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAction = (idx: number) => {
    setCheckedActions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCopySummary = () => {
    if (!result) return;
    const summaryText = `
Notice: ${result.title}
Issuer: ${result.issuer || "College Administration"}
Category: ${result.category || "General"}

Summary:
${result.summary}

Deadlines:
${result.deadlines.map((d) => `- ${d.event}: ${d.date || "Date unspecified"} ${d.time || ""}`).join("\n")}

Actions:
${result.actions.map((a, i) => `${i + 1}. ${a}`).join("\n")}

Required Documents:
${result.documents.map((doc) => `- ${doc}`).join("\n")}
    `.trim();

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!result) return;
    onSaveNotice(result);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Introduction Card with Halloween Theme */}
      <div className="bg-gradient-to-r from-purple-950/60 via-[#0d071a] to-orange-950/40 rounded-3xl border border-orange-500/30 p-6 sm:p-7 shadow-xl shadow-orange-950/20 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xl animate-pumpkin-pulse">
                🎃
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>College Notice Analyzer</span>
                <span className="text-sm font-bold text-orange-400">🦇</span>
              </h2>
            </div>
            <p className="mt-1 text-sm text-purple-200/80 max-w-2xl leading-relaxed">
              Upload official exam circulars, scholarship announcements, or notice board snapshots. Gemma 4 &amp; Gemini Vision OCR extract exact deadlines, eligibility, required documents, and action items.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3.5 py-1.5 rounded-full bg-purple-950/80 text-orange-300 border border-orange-500/40 flex items-center gap-2 font-semibold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Gemma 4 • Vision OCR
            </span>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div className="mt-5 pt-4 border-t border-orange-500/20 flex flex-wrap items-center gap-2">
          <span className="text-xs text-purple-300 font-semibold flex items-center gap-1">
            <span>🧙‍♀️</span> Quick 1-Click Samples:
          </span>
          {SAMPLE_NOTICES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleLoadSample(sample)}
              className="text-xs px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-orange-500/20 text-orange-300 hover:text-white border border-orange-500/30 transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{sample.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Upload / Input Form */}
      <form onSubmit={handleSubmit} className="bg-[#0b0617] rounded-3xl border border-orange-500/30 p-6 sm:p-7 shadow-xl shadow-black/50 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PDF & Photo File Upload Zone */}
          <div>
            <label className="block text-sm font-bold text-orange-200 mb-2 flex items-center gap-1.5">
              <span>🎃 Option 1: Upload College Notice (PDF or Photo)</span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-orange-400 bg-orange-500/15 scale-[1.01]"
                  : file
                  ? "border-purple-500/60 bg-purple-950/30"
                  : "border-orange-500/30 hover:border-orange-500/60 bg-[#070311]/70"
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
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-orange-500/50 shadow-lg">
                      <img src={filePreview} alt="Notice preview" className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-orange-600 text-[10px] text-white font-bold">
                        PHOTO
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 text-2xl">
                      📄
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-orange-300 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-purple-300/80">
                      {(file.size / 1024).toFixed(1)} KB • {file.type.startsWith("image/") ? "Photo Notice (Gemini Vision OCR)" : "PDF Document"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-2 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/30 text-2xl animate-pumpkin-pulse">
                    🎃
                  </div>
                  <p className="text-sm font-bold text-white">
                    Browse or drag notice PDF or Photo (JPEG, PNG, WebP)
                  </p>
                  <p className="text-xs text-purple-300/70">Notice boards, stamped circulars, and photos up to 20MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Paste or Voice Dictate Notice Text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="noticeText" className="text-sm font-semibold text-orange-200/90 flex items-center gap-1.5">
                <span>Option 2: Paste or Speak Notice Text</span>
                <span className="text-xs text-orange-400">📜</span>
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
                  title={isRecording ? "Click to stop recording" : "Speak to dictate notice text"}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-orange-400" />}
                  <span>{isRecording ? "Listening..." : "Voice Dictate"}</span>
                </button>
                {noticeText && (
                  <span className="text-xs text-purple-300/70 font-mono hidden sm:inline">{noticeText.length} chars</span>
                )}
              </div>
            </div>
            <textarea
              id="noticeText"
              value={noticeText}
              onChange={(e) => setNoticeText(e.target.value)}
              placeholder="Paste notice circular, exam instructions, dates, or speak using the Voice Dictate button..."
              rows={5}
              className="w-full bg-[#07040d]/90 border border-purple-900/60 rounded-xl p-3.5 text-sm text-purple-100 placeholder-purple-400/40 focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60 font-sans resize-y shadow-inner"
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-sm flex items-start gap-3 shadow-lg shadow-rose-950/50">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Spell Interrupted / Analysis Issue</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-purple-900/40">
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || (!noticeText && !file)}
            className="px-4 py-2 text-xs font-semibold text-purple-300/70 hover:text-orange-300 disabled:opacity-40 transition"
          >
            Clear Inputs
          </button>

          <button
            type="submit"
            disabled={loading || (!noticeText.trim() && !file)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-purple-700 hover:from-orange-500 hover:to-purple-600 text-white font-bold text-sm shadow-lg shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gemma 4 Brewing Analysis... 🎃</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Analyze Notice with Gemma 4 🎃</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Analysis Result Display */}
      {result && (
        <div className="bg-[#0e071a]/95 rounded-2xl border border-orange-500/30 p-6 sm:p-7 shadow-2xl shadow-orange-950/40 space-y-6 relative overflow-hidden">
          {/* Subtle eerie background gradient */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-500/10 via-purple-500/10 to-transparent pointer-events-none rounded-full blur-2xl" />

          {/* Header Card */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-purple-900/40 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm shadow-orange-950">
                  🎃 {result.category || "Official Notice"}
                </span>
                {result.issuer && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-950/60 text-purple-200 border border-purple-700/40">
                    🏛️ {result.issuer}
                  </span>
                )}
                {result.isImage && (
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                    📸 Vision OCR Verified
                  </span>
                )}
                {result.usedModel && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-purple-900/40 text-purple-300 border border-purple-500/30">
                    🔮 {result.usedModel}
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{result.title}</h3>
              {result.sourceFileName && (
                <p className="text-xs text-purple-300/80 mt-1 flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5 text-orange-400" /> Source document: {result.sourceFileName}
                </p>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSpeechPlayback}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                  isSpeaking
                    ? "bg-purple-600/30 text-purple-200 border-purple-500/50 animate-pulse shadow-md shadow-purple-900"
                    : "bg-[#160c29] hover:bg-[#20123a] text-purple-200 hover:text-white border-purple-800/50"
                }`}
                title="Listen to notice summary and deadlines read aloud"
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-orange-400" />}
                <span>{isSpeaking ? "Silence" : "Read Aloud 🔮"}</span>
              </button>

              <button
                onClick={handleCopySummary}
                className="px-3 py-1.5 rounded-lg bg-[#160c29] hover:bg-[#20123a] text-purple-200 text-xs font-semibold border border-purple-800/50 transition flex items-center gap-1.5"
                title="Copy structured summary"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-orange-400" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>

              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg bg-[#160c29] hover:bg-[#20123a] text-purple-200 text-xs font-semibold border border-purple-800/50 transition flex items-center gap-1.5"
                title="Save notice to My Notices"
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "text-orange-400 fill-orange-400" : "text-orange-400"}`} />
                <span>{isSaved ? "Saved" : "Save"}</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-[#160c29] hover:bg-[#20123a] text-purple-200 text-xs font-semibold border border-purple-800/50 transition flex items-center gap-1.5"
                title="Print or export to PDF"
              >
                <Printer className="w-3.5 h-3.5 text-purple-300" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-[#08040f]/90 border border-purple-900/60 relative">
            <h4 className="text-xs uppercase tracking-wider font-bold text-orange-400 mb-1.5 flex items-center gap-1.5">
              <span>🎃 Executive Summary</span>
            </h4>
            <p className="text-sm text-purple-100 leading-relaxed">{result.summary}</p>
          </div>

          {/* Deadlines Timeline / Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Critical Deadlines & Dates</h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {result.deadlines?.length || 0} date{(result.deadlines?.length || 0) !== 1 ? "s" : ""} detected
              </span>
            </div>

            {result.deadlines && result.deadlines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.deadlines.map((deadline, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 flex items-start justify-between gap-3 shadow-sm hover:border-slate-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {deadline.isExam && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            EXAM
                          </span>
                        )}
                        <h5 className="text-sm font-semibold text-white">{deadline.event}</h5>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
                        <span className="flex items-center gap-1 font-medium text-cyan-300">
                          <Calendar className="w-3.5 h-3.5" />
                          {deadline.date || "Date unspecified in notice"}
                        </span>
                        {deadline.time && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            {deadline.time}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-slate-950">No specific deadlines detected.</p>
            )}
          </div>

          {/* Student Action Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Student Action Checklist</h4>
              </div>
              <span className="text-xs text-slate-400">
                {Object.values(checkedActions).filter(Boolean).length} of {result.actions?.length || 0} done
              </span>
            </div>

            {result.actions && result.actions.length > 0 ? (
              <div className="space-y-2">
                {result.actions.map((action, idx) => {
                  const isChecked = !!checkedActions[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleAction(idx)}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer select-none transition ${
                        isChecked
                          ? "bg-emerald-950/20 border-emerald-500/30 text-slate-400"
                          : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                      />
                      <span className={`text-sm ${isChecked ? "line-through text-slate-400" : "font-medium"}`}>
                        {action}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 rounded-lg bg-slate-950">No direct action items identified.</p>
            )}
          </div>

          {/* Documents & Eligibility Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Required Documents */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-300">Required Documents</h4>
              </div>
              {result.documents && result.documents.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {result.documents.map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific documents specified.</p>
              )}
            </div>

            {/* Eligibility Criteria */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-300">Eligibility Criteria</h4>
              </div>
              {result.eligibility && result.eligibility.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {result.eligibility.map((el, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{el}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific eligibility restrictions mentioned.</p>
              )}
            </div>
          </div>

          {/* Uncertainties & Ambiguities Alert */}
          {result.uncertainties && result.uncertainties.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Notice Ambiguities & Information to Verify</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-amber-200/90 pl-1">
                {result.uncertainties.map((unc, idx) => (
                  <li key={idx}>{unc}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Bridge to Practice Test */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              Preparing for this exam or event? Generate questions directly based on this subject.
            </p>
            <button
              onClick={() => onSwitchToQuiz(result.title)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <span>Practice Test for {result.title.slice(0, 24)}...</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
