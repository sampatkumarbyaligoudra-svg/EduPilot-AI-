import React, { useState, useRef } from "react";
import {
  Sparkles,
  FileText,
  CheckSquare,
  Upload,
  Zap,
  GraduationCap,
  ShieldCheck,
  Calendar,
  Award,
  ArrowRight,
  BookOpen,
  FileCheck,
  ChevronRight,
  Clock,
  User,
  LogOut,
  Flame,
  Copy,
  Check,
  Volume2,
  VolumeX,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { StudentUser, PdfInspectionResult } from "../types";
import { SampleNetworksTest } from "./SampleNetworksTest";
import { speakText, stopSpeaking } from "../utils/speech";

interface CoverPageProps {
  currentUser: StudentUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onNavigateTab: (tab: "cover" | "notice" | "quiz" | "history" | "examprep") => void;
  onUniversalPdfDrop: (file: File, target: "notice" | "quiz") => void;
}

interface ImageExtractionResult {
  extractedText: string;
  title: string;
  documentType: string;
  summary: string;
  keyPoints: string[];
  deadlinesOrDates: { event: string; date: string | null }[];
  suggestedAction?: string;
  fileName?: string;
  fileSize?: number;
  usedModel?: string;
}

export const CoverPage: React.FC<CoverPageProps> = ({
  currentUser,
  onOpenLogin,
  onLogout,
  onNavigateTab,
  onUniversalPdfDrop,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [inspectedPdf, setInspectedPdf] = useState<PdfInspectionResult | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const dropInputRef = useRef<HTMLInputElement>(null);

  // Instant Image-to-Text extraction states
  const [extractingImage, setExtractingImage] = useState(false);
  const [extractedResult, setExtractedResult] = useState<ImageExtractionResult | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const inspectUploadedFile = async (file: File) => {
    // Validate file type
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|bmp|heic)$/i.test(file.name);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      setExtractError("Unsupported file format. Please upload a PDF document or a JPEG/PNG/WebP image.");
      return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setExtractError("File exceeds the 20MB limit. Please upload a smaller photo or PDF.");
      return;
    }

    setPdfFile(file);
    setExtractError(null);
    setExtractedResult(null);

    if (isImage) {
      setFilePreview(URL.createObjectURL(file));
      setInspectedPdf({
        fileName: file.name,
        fileSize: file.size,
        numpages: 1,
        isScanned: true,
        charactersExtracted: 0,
        preview: `[Image Detected: ${file.name} - Ready for Gemini Vision OCR & Instant Text Extraction]`,
      });
      return;
    }

    setFilePreview(null);
    setInspecting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/inspect-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setInspectedPdf(data);
      } else {
        setInspectedPdf({
          fileName: file.name,
          fileSize: file.size,
          numpages: 1,
          isScanned: false,
          charactersExtracted: 0,
          preview: "PDF loaded. Ready for AI processing.",
        });
      }
    } catch {
      setInspectedPdf({
        fileName: file.name,
        fileSize: file.size,
        numpages: 1,
        isScanned: false,
        charactersExtracted: 0,
        preview: "PDF loaded. Ready for AI processing.",
      });
    } finally {
      setInspecting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      inspectUploadedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      inspectUploadedFile(e.target.files[0]);
    }
  };

  // Direct Instant Image Extraction Call
  const handleExtractImageText = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!pdfFile) {
      setExtractError("Please upload an image first.");
      return;
    }

    setExtractingImage(true);
    setExtractError(null);

    try {
      const formData = new FormData();
      formData.append("file", pdfFile);

      const response = await fetch("/api/extract-image-text", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract text from the image.");
      }

      setExtractedResult(data);
    } catch (err: any) {
      setExtractError(err.message || "Failed to extract text from image. Please try again.");
    } finally {
      setExtractingImage(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!extractedResult) return;
    const textToCopy = `Title: ${extractedResult.title}\nType: ${extractedResult.documentType}\nSummary: ${extractedResult.summary}\n\nTranscript:\n${extractedResult.extractedText}\n\nKey Takeaways:\n${extractedResult.keyPoints.map((k) => `• ${k}`).join("\n")}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else if (extractedResult) {
      const readout = `${extractedResult.title}. ${extractedResult.summary}. Key points: ${extractedResult.keyPoints.join(". ")}`;
      speakText(readout, () => setIsSpeaking(false));
      setIsSpeaking(true);
    }
  };

  return (
    <div className="relative space-y-12 pb-12 overflow-hidden">
      {/* Halloween Eerie Aurora Ambience Elements */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] sm:w-[950px] h-[450px] bg-gradient-to-r from-orange-600/15 via-purple-700/20 to-amber-500/15 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse duration-1000" />
      <div className="absolute top-72 -left-40 w-96 h-96 bg-gradient-to-tr from-orange-600/15 via-amber-600/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-96 -right-40 w-96 h-96 bg-gradient-to-bl from-purple-700/20 via-fuchsia-700/15 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Student Welcome Banner with Halloween Embellishment */}
      <div className="relative rounded-3xl p-5 sm:p-6 bg-[#0d071a]/90 border border-orange-500/30 backdrop-blur-2xl shadow-xl shadow-orange-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {currentUser ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 via-purple-600 to-amber-500 p-0.5 shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-[#090514] rounded-[14px] flex items-center justify-center text-2xl">
                {currentUser.avatar}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  Welcome, {currentUser.name}! 🎃
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {currentUser.streakDays} Day Spell Streak
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                {currentUser.college} • {currentUser.branch} ({currentUser.semester})
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 text-xl">
              🎃
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>Spooky Student Vault &amp; Study Dashboard</span>
              </h4>
              <p className="text-xs text-purple-300/80">
                Sign in to save notice deadlines, track practice test scores, and summon flashcards.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 self-end md:self-center">
          {currentUser ? (
            <>
              <button
                onClick={onOpenLogin}
                className="px-3.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 text-orange-300 hover:text-white text-xs font-medium border border-orange-500/30 transition shadow-sm"
              >
                Edit Spell Profile
              </button>
              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl text-purple-400 hover:text-rose-400 hover:bg-purple-950/60 transition"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-purple-700 hover:from-orange-500 hover:to-purple-600 text-white font-semibold text-xs shadow-lg shadow-orange-600/30 transition flex items-center gap-2 hover:scale-105"
            >
              <User className="w-4 h-4" />
              <span>Student Sign In 🎃</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Showcase with Halloween Typography */}
      <div className="text-center space-y-6 pt-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/70 border border-orange-500/40 shadow-lg shadow-orange-950/30 backdrop-blur-xl">
          <span className="text-sm">🎃</span>
          <span className="text-xs font-semibold text-orange-200">
            Halloween 2026 Edition • Powered by Gemma 4
          </span>
          <span className="text-purple-400">•</span>
          <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-purple-300">
            Universal PDF &amp; Photo Vision OCR
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
          Your College Notices, Study Notes &amp;{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400 underline decoration-orange-500/40">
            AI Exam Assistant 🎃
          </span>
        </h1>

        <p className="text-sm sm:text-base text-purple-200/90 max-w-2xl mx-auto leading-relaxed">
          Upload any college circular or handwritten snapshot to extract critical deadlines, required documents, and action steps. Turn lecture photos into verified practice tests with instant scoring and explanations.
        </p>

        {/* Hero Quick Navigation CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
          <button
            onClick={() => onNavigateTab("notice")}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold text-sm shadow-xl shadow-purple-900/40 transition flex items-center gap-2 hover:scale-105"
          >
            <FileText className="w-4 h-4 text-purple-300" />
            <span>Analyze College Notice</span>
            <ChevronRight className="w-4 h-4 text-purple-300" />
          </button>

          <button
            onClick={() => onNavigateTab("quiz")}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 hover:from-orange-500 hover:to-amber-500 text-white font-semibold text-sm shadow-xl shadow-orange-600/30 transition flex items-center gap-2 hover:scale-105"
          >
            <CheckSquare className="w-4 h-4 text-amber-200" />
            <span>Generate Practice Test</span>
            <ChevronRight className="w-4 h-4 text-amber-200" />
          </button>

          <button
            onClick={() => onNavigateTab("examprep")}
            className="px-6 py-3 rounded-2xl bg-[#0d071a] hover:bg-purple-950/70 text-orange-300 hover:text-white border border-orange-500/40 font-semibold text-sm shadow-lg shadow-orange-950/20 transition flex items-center gap-2 hover:scale-105"
          >
            <span className="text-sm">🎯</span>
            <span>Exam Prep Hub</span>
            <ChevronRight className="w-4 h-4 text-orange-400" />
          </button>
        </div>
      </div>

      {/* Universal "Reads Any PDF & Photo" Dropzone Showcase (Halloween Styled) */}
      <div className="relative group max-w-4xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-purple-700 to-amber-500 rounded-3xl blur-md opacity-40 group-hover:opacity-75 transition duration-500 pointer-events-none" />

        <div className="relative rounded-3xl bg-[#0a0515]/95 border border-orange-500/40 p-6 sm:p-8 backdrop-blur-2xl space-y-5 shadow-2xl shadow-orange-950/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-purple-700 flex items-center justify-center text-white shadow-md shadow-orange-600/30 text-xl animate-pumpkin-pulse">
                🎃
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Universal Document &amp; Photo Reader</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-orange-500/20 text-orange-300 border border-orange-500/40">
                    PDF + Photo OCR
                  </span>
                </h3>
                <p className="text-xs text-purple-300/80">
                  Drop any college notice PDF, whiteboard photo, or textbook page. Runs Gemini Multimodal Vision OCR automatically!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-orange-300/90 font-medium bg-purple-950/60 px-3 py-1.5 rounded-xl border border-orange-500/20">
              <span>🦇</span>
              <span>Images &amp; Scanned PDFs Supported</span>
            </div>
          </div>

          {/* Error Message Banner */}
          {extractError && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 animate-shake">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{extractError}</span>
              </div>
              <button
                onClick={() => setExtractError(null)}
                className="text-xs text-rose-300 hover:text-white underline font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Interactive Drag & Drop Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => dropInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 relative ${
              dragActive
                ? "border-orange-400 bg-orange-500/15 scale-[1.01] shadow-lg shadow-orange-500/20"
                : inspectedPdf
                ? "border-purple-500/60 bg-purple-950/30"
                : "border-orange-500/30 hover:border-orange-500/60 bg-[#070311]/70"
            }`}
          >
            <input
              ref={dropInputRef}
              type="file"
              accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {inspecting ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs sm:text-sm font-semibold text-orange-300">
                  🧙‍♀️ Inspecting file layers &amp; checking Vision OCR compatibility...
                </p>
              </div>
            ) : inspectedPdf && pdfFile ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[#0d071d] border border-orange-500/30">
                  <div className="flex items-center gap-3 text-left">
                    {filePreview ? (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-orange-500/50 shrink-0 shadow-md">
                        <img src={filePreview} alt="Uploaded file" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 right-0 bg-orange-600 text-white text-[9px] px-1 rounded-tl font-bold">
                          IMG
                        </span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xl">
                        📄
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white truncate max-w-xs">{inspectedPdf.fileName}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-purple-300/80 mt-0.5">
                        <span>{(inspectedPdf.fileSize / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{filePreview ? "Photo Image" : `${inspectedPdf.numpages} Page(s)`}</span>
                        <span>•</span>
                        <span className="text-orange-400 font-semibold flex items-center gap-1">
                          <span>✨</span>
                          {filePreview ? "Gemini Vision OCR Ready" : inspectedPdf.isScanned ? "Scanned PDF (OCR)" : "Digital PDF"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons for Uploaded File */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Instant Text Extraction Button */}
                    <button
                      onClick={handleExtractImageText}
                      disabled={extractingImage}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition flex items-center gap-1.5 hover:scale-105 disabled:opacity-50"
                    >
                      {extractingImage ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Brewing OCR...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-200" />
                          <span>Extract Text Instantly</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUniversalPdfDrop(pdfFile, "notice");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold shadow-md shadow-purple-700/30 transition flex items-center gap-1.5 hover:scale-105"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Analyze Notice</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUniversalPdfDrop(pdfFile, "quiz");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-700/30 transition flex items-center gap-1.5 hover:scale-105"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Make Practice Test</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-purple-300/70">
                  Tip: Click <strong>Extract Text Instantly</strong> to preview transcript &amp; key points right here, or send to Notice Analyzer / Practice Test!
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500/20 via-purple-600/20 to-amber-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 text-3xl shadow-inner animate-pumpkin-pulse">
                  🎃
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-white flex items-center justify-center gap-1.5">
                    <span>Drop your college notice, whiteboard photo, or lecture PDF here 🦇</span>
                  </p>
                  <p className="text-xs text-purple-300/80 mt-1 max-w-md mx-auto">
                    Accepts PNG, JPG, JPEG, WebP photos &amp; PDFs up to 20MB. Fully powered by Google GenAI vision intelligence.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-orange-500/30 text-[11px] text-orange-300 font-medium">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Click to browse files</span>
                </div>
              </div>
            )}
          </div>

          {/* Instant Image-to-Text Results Display Card */}
          {extractedResult && (
            <div className="rounded-2xl p-5 sm:p-6 bg-[#0e071e] border-2 border-orange-500/50 shadow-xl shadow-orange-950/40 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-500/20 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">✨</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{extractedResult.title}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                        {extractedResult.documentType}
                      </span>
                    </div>
                    <p className="text-xs text-purple-300/80">
                      Extracted via {extractedResult.usedModel || "Gemini Multimodal Vision OCR"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSpeech}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                      isSpeaking
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-purple-950 text-purple-300 hover:text-white border-purple-800"
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
                    <span>{isSpeaking ? "Stop" : "Read Aloud"}</span>
                  </button>

                  <button
                    onClick={handleCopyTranscript}
                    className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedTranscript ? "Copied!" : "Copy Transcript"}</span>
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="text-xs text-purple-100 bg-purple-950/40 p-3.5 rounded-xl border border-purple-900/60 leading-relaxed">
                <strong className="text-orange-400 font-bold block mb-1">🎃 AI Educational Summary:</strong>
                {extractedResult.summary}
              </div>

              {/* Verbatim Transcript */}
              {extractedResult.extractedText && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-orange-300 flex items-center gap-1">
                    <span>📜</span>
                    <span>Extracted Text Transcript:</span>
                  </span>
                  <div className="max-h-48 overflow-y-auto p-3.5 rounded-xl bg-[#06030c] border border-orange-500/20 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-text">
                    {extractedResult.extractedText}
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              {extractedResult.keyPoints && extractedResult.keyPoints.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <span>💡</span>
                    <span>Key Educational Takeaways:</span>
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {extractedResult.keyPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className="p-2 rounded-lg bg-purple-950/30 border border-purple-900/40 text-purple-200 flex items-start gap-2"
                      >
                        <span className="text-orange-400 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Deadlines Detected */}
              {extractedResult.deadlinesOrDates && extractedResult.deadlinesOrDates.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Deadlines &amp; Important Dates Found:</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {extractedResult.deadlinesOrDates.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2"
                      >
                        <span className="font-semibold">{item.event}:</span>
                        <span className="text-white font-mono">{item.date || "Unspecified"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fast Forward Links */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5 border-t border-orange-500/20">
                <button
                  onClick={() => pdfFile && onUniversalPdfDrop(pdfFile, "notice")}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-purple-900/30"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open in Notice Analyzer</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => pdfFile && onUniversalPdfDrop(pdfFile, "quiz")}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-600/30"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Generate Practice Test from This</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Featured Live Sample Computer Networks Test (Halloween Themed) */}
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <BookOpen className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Featured Interactive Sample Test</span>
              <span className="text-base">🎃</span>
            </h2>
          </div>
          <span className="text-xs text-purple-300/80">Try it directly on the cover page</span>
        </div>

        {/* Render Interactive Sample Test */}
        <SampleNetworksTest
          onOpenFullGenerator={() => onNavigateTab("quiz")}
        />
      </div>

      {/* 3 Superpower Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto pt-6">
        {/* Pillar 1 */}
        <div
          onClick={() => onNavigateTab("notice")}
          className="rounded-3xl p-6 bg-[#0d071d]/80 border border-purple-800/60 hover:border-orange-500/50 hover:bg-[#120a28] transition-all duration-300 cursor-pointer group shadow-lg shadow-black/40"
        >
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30 mb-4 group-hover:scale-105 transition text-xl">
            📜
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-orange-300 transition flex items-center justify-between">
            <span>Deadlines &amp; Notices</span>
            <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-orange-400 group-hover:translate-x-1 transition" />
          </h3>
          <p className="text-xs text-purple-300/80 mt-2 leading-relaxed">
            Extract registration dates, exam timings, hall tickets, fee deadlines, and action checklists from any photo or circular.
          </p>
        </div>

        {/* Pillar 2 */}
        <div
          onClick={() => onNavigateTab("quiz")}
          className="rounded-3xl p-6 bg-[#0d071d]/80 border border-purple-800/60 hover:border-amber-500/50 hover:bg-[#120a28] transition-all duration-300 cursor-pointer group shadow-lg shadow-black/40"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 mb-4 group-hover:scale-105 transition text-xl">
            🧪
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition flex items-center justify-between">
            <span>AI Practice Tests</span>
            <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
          </h3>
          <p className="text-xs text-purple-300/80 mt-2 leading-relaxed">
            Generate module-wise MCQs and True/False drills with difficulty levels, verified answer keys, and full conceptual explanations.
          </p>
        </div>

        {/* Pillar 3 */}
        <div
          onClick={() => onNavigateTab("history")}
          className="rounded-3xl p-6 bg-[#0d071d]/80 border border-purple-800/60 hover:border-purple-500/50 hover:bg-[#120a28] transition-all duration-300 cursor-pointer group shadow-lg shadow-black/40"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 mb-4 group-hover:scale-105 transition text-xl">
            ⚰️
          </div>
          <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition flex items-center justify-between">
            <span>Saved Study Vault</span>
            <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 transition" />
          </h3>
          <p className="text-xs text-purple-300/80 mt-2 leading-relaxed">
            Keep track of past quiz scores, accuracy percentages, upcoming circular dates, and action checklist progress.
          </p>
        </div>
      </div>
    </div>
  );
};

