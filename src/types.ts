export interface DeadlineItem {
  event: string;
  date: string | null;
  time: string | null;
  isExam?: boolean;
}

export interface NoticeAnalysisResult {
  id?: string;
  timestamp?: number;
  title: string;
  issuer?: string;
  category?: string;
  summary: string;
  deadlines: DeadlineItem[];
  eligibility: string[];
  documents: string[];
  actions: string[];
  uncertainties: string[];
  sourceFileName?: string | null;
  usedModel?: string;
  isImage?: boolean;
  isScanned?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "MCQ" | "True/False" | string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic?: string;
}

export interface QuizResult {
  id?: string;
  timestamp?: number;
  title: string;
  scope: string;
  difficulty: "Easy" | "Medium" | "Hard";
  totalQuestions: number;
  questions: QuizQuestion[];
  sourceFileName?: string | null;
  usedModel?: string;
}

export interface QuizAttempt {
  id: string;
  quizTitle: string;
  scope: string;
  difficulty: string;
  score: number;
  total: number;
  timestamp: number;
  userAnswers: Record<number, string>;
  questions: QuizQuestion[];
}

export interface ModelInfo {
  defaultModel: string;
  availableModels: {
    id: string;
    name: string;
    badge: string;
  }[];
}

export interface StudentUser {
  id: string;
  name: string;
  email?: string;
  college: string;
  branch: string;
  semester: string;
  avatar: string;
  streakDays: number;
  quizzesTaken: number;
  noticesSaved: number;
  joinedAt: number;
}

export interface PdfInspectionResult {
  fileName: string;
  fileSize: number;
  numpages: number;
  isScanned: boolean;
  charactersExtracted: number;
  preview: string;
}

