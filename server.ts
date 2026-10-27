import "dotenv/config";
import express from "express";
import multer from "multer";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import { GoogleGenAI } from "@google/genai";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");

    const isImage =
      file.mimetype.startsWith("image/") ||
      /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.originalname);

    if (isPdf || isImage) {
      cb(null, true);
    } else {
      cb(new Error("Please upload a PDF document or an image file (.pdf, .jpg, .png, .webp)"));
    }
  },
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const DEFAULT_MODEL = process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it";

// Candidate vision models with fallback for high demand spikes / rate limits
const VISION_CANDIDATE_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

async function callWithTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Model request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function normalizeImageMimeType(mimetype: string | undefined, filename: string): string {
  const lowerName = filename.toLowerCase();
  if (mimetype === "image/png" || lowerName.endsWith(".png")) return "image/png";
  if (mimetype === "image/webp" || lowerName.endsWith(".webp")) return "image/webp";
  if (mimetype === "image/heic" || lowerName.endsWith(".heic")) return "image/heic";
  if (mimetype === "image/heif" || lowerName.endsWith(".heif")) return "image/heif";
  return "image/jpeg";
}

// Resolve pdf-parse whether default or namespace export
const parsePdfBuffer = typeof pdfParse === "function" ? pdfParse : (pdfParse as any).default;

function parseModelJson(text: string) {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // Continue to array check
      }
    }

    const arrStart = cleaned.indexOf("[");
    const arrEnd = cleaned.lastIndexOf("]");
    if (arrStart !== -1 && arrEnd > arrStart) {
      return JSON.parse(cleaned.slice(arrStart, arrEnd + 1));
    }

    throw new Error("The AI model did not return valid JSON format. Please try again.");
  }
}

interface SourceContent {
  text?: string;
  pdfBase64?: string;
  imageBase64?: string;
  imageMimeType?: string;
  fileName?: string;
  isScanned?: boolean;
  isImage?: boolean;
  pageCount?: number;
}

async function getSourceContent(req: express.Request, fieldName: string): Promise<SourceContent> {
  const pastedText = String(req.body?.[fieldName] || "").trim();
  let pdfText = "";
  let pdfBase64: string | undefined = undefined;
  let imageBase64: string | undefined = undefined;
  let imageMimeType: string | undefined = undefined;
  let fileName: string | undefined = undefined;
  let isScanned = false;
  let isImage = false;
  let pageCount = 1;

  if (req.file) {
    fileName = req.file.originalname;
    const mimetype = req.file.mimetype;

    if (mimetype.startsWith("image/") || /\.(png|jpe?g|webp|bmp|heic|heif)$/i.test(fileName)) {
      isImage = true;
      imageMimeType = normalizeImageMimeType(mimetype, fileName);
      imageBase64 = req.file.buffer.toString("base64");
    } else {
      // PDF handling
      try {
        const parsed = await parsePdfBuffer(req.file.buffer);
        pageCount = parsed.numpages || 1;
        const extracted = (parsed.text || "").trim();
        // If extracted text is very short or empty, the PDF is likely scanned or image-based
        if (extracted.length > 50) {
          pdfText = extracted;
        } else {
          isScanned = true;
          pdfBase64 = req.file.buffer.toString("base64");
        }
      } catch {
        // Fallback to direct multimodal PDF processing
        isScanned = true;
        pdfBase64 = req.file.buffer.toString("base64");
      }
    }
  }

  const combinedText = [pastedText, pdfText].filter(Boolean).join("\n\n").slice(0, 45000);

  if (!combinedText && !pdfBase64 && !imageBase64) {
    throw new Error("Please upload a PDF/photo or enter text/voice notes.");
  }

  return {
    text: combinedText || undefined,
    pdfBase64,
    imageBase64,
    imageMimeType,
    fileName,
    isScanned,
    isImage,
    pageCount,
  };
}

async function askAI(
  prompt: string,
  source: SourceContent,
  requestedModel?: string
): Promise<{ data: any; usedModel: string; isScanned: boolean; isImage: boolean }> {
  // If a photo/image was uploaded, process via Gemini multimodal vision with model fallback
  if (source.isImage && source.imageBase64) {
    const mimeType = source.imageMimeType || "image/jpeg";
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: source.imageBase64,
      },
    };

    let lastError: any = null;
    for (const model of VISION_CANDIDATE_MODELS) {
      try {
        console.log(`[Vision AI] Processing image with model: ${model}`);
        let response;
        try {
          response = await callWithTimeout(
            ai.models.generateContent({
              model: model,
              contents: [imagePart, prompt],
              config: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            }),
            10000
          );
        } catch (jsonErr: any) {
          console.warn(`[Vision AI] Structured JSON mode failed on ${model}, retrying with text prompt:`, jsonErr.message);
          response = await callWithTimeout(
            ai.models.generateContent({
              model: model,
              contents: [imagePart, `${prompt}\n\nIMPORTANT: Return valid JSON only, without markdown fences or extra commentary.`],
              config: {
                temperature: 0.2,
              },
            }),
            10000
          );
        }

        if (response && response.text) {
          const parsed = parseModelJson(response.text);
          return {
            data: parsed,
            usedModel: `${model} (Multimodal Vision OCR)`,
            isScanned: false,
            isImage: true,
          };
        }
      } catch (err: any) {
        console.warn(`[Vision AI] Model ${model} failed: ${err.message}. Trying next vision model...`);
        lastError = err;
      }
    }

    throw new Error(`Failed to analyze uploaded photo: ${lastError?.message || "All AI vision models are currently busy. Please try again shortly."}`);
  }

  // If the PDF is scanned or image-based, use multimodal Gemini with fallback
  if (source.isScanned && source.pdfBase64) {
    const pdfPart = {
      inlineData: {
        mimeType: "application/pdf",
        data: source.pdfBase64,
      },
    };

    let lastError: any = null;
    for (const model of VISION_CANDIDATE_MODELS) {
      try {
        console.log(`[Document OCR] Processing scanned PDF with model: ${model}`);
        let response;
        try {
          response = await ai.models.generateContent({
            model: model,
            contents: [pdfPart, prompt],
            config: {
              responseMimeType: "application/json",
              temperature: 0.2,
            },
          });
        } catch {
          response = await ai.models.generateContent({
            model: model,
            contents: [pdfPart, `${prompt}\n\nIMPORTANT: Return valid JSON only.`],
            config: {
              temperature: 0.2,
            },
          });
        }

        if (response && response.text) {
          const parsed = parseModelJson(response.text);
          return {
            data: parsed,
            usedModel: `${model} (Visual Document OCR)`,
            isScanned: true,
            isImage: false,
          };
        }
      } catch (err: any) {
        console.warn(`[Document OCR] Model ${model} failed: ${err.message}. Trying next model...`);
        lastError = err;
      }
    }

    throw new Error(`Failed to read scanned PDF: ${lastError?.message || "Document OCR processing failed. Please try again."}`);
  }

  // Otherwise, use Gemma 4 text model with fallback
  const primaryModel = requestedModel || DEFAULT_MODEL;
  const candidateModels = [
    primaryModel,
    primaryModel !== "gemma-4-26b-a4b-it" ? "gemma-4-26b-a4b-it" : "gemma-4-31b-it",
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ].filter((v, idx, arr) => arr.indexOf(v) === idx);

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      let response;
      try {
        response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });
      } catch (jsonErr: any) {
        response = await ai.models.generateContent({
          model: model,
          contents: `${prompt}\n\nIMPORTANT: Return valid JSON only.`,
          config: {
            temperature: 0.2,
          },
        });
      }

      if (!response.text) {
        throw new Error("Empty response from AI model.");
      }

      const parsed = parseModelJson(response.text);
      return { data: parsed, usedModel: model, isScanned: false, isImage: false };
    } catch (err: any) {
      console.warn(`Model [${model}] attempt failed: ${err.message}. Trying next candidate...`);
      lastError = err;
    }
  }

  throw new Error(`AI generation failed: ${lastError?.message || "Unknown error"}`);
}

// PDF and Image inspection endpoint
app.post("/api/inspect-pdf", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const fileName = req.file.originalname;
    const isImage =
      req.file.mimetype.startsWith("image/") ||
      /\.(png|jpe?g|webp|bmp|heic|heif)$/i.test(fileName);

    if (isImage) {
      res.json({
        fileName: fileName,
        fileSize: req.file.size,
        numpages: 1,
        isScanned: true,
        isImage: true,
        charactersExtracted: 0,
        preview: `[Image Detected: ${fileName} (${(req.file.size / 1024).toFixed(1)} KB) - Ready for Gemini Vision OCR]`,
      });
      return;
    }

    let numpages = 1;
    let extractedText = "";
    let isScanned = false;

    try {
      const parsed = await parsePdfBuffer(req.file.buffer);
      numpages = parsed.numpages || 1;
      extractedText = (parsed.text || "").trim();
      isScanned = extractedText.length < 50;
    } catch {
      isScanned = true;
    }

    res.json({
      fileName: fileName,
      fileSize: req.file.size,
      numpages,
      isScanned,
      isImage: false,
      charactersExtracted: extractedText.length,
      preview: extractedText.slice(0, 300) || "[Scanned Document / Visual PDF Detected - Ready for AI OCR Processing]",
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Could not read file" });
  }
});

// Dedicated Direct Image-to-Text & Instant Educational Note Extractor
app.post("/api/extract-image-text", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image file uploaded. Please choose a JPEG, PNG, or WebP photo." });
      return;
    }

    const fileName = req.file.originalname;
    const mimeType = normalizeImageMimeType(req.file.mimetype, fileName);
    const imageBase64 = req.file.buffer.toString("base64");

    const prompt = `
You are EduPilot AI, an advanced educational document and handwritten note OCR assistant.
Analyze this uploaded college notice, student notes, chalkboard/whiteboard photo, or textbook diagram.

1. Transcribe ALL visible text accurately, fixing common OCR spacing and capitalization issues.
2. Formulate a clean summary and extract key educational takeaways/deadlines.

Return valid JSON strictly matching this structure:
{
  "extractedText": "Complete and accurate transcript of all text found in the image. Format with clean paragraphs or bullet points.",
  "title": "Clear concise descriptive title",
  "documentType": "Notice | Study Notes | Textbook Page | Exam Schedule | Handwritten Note | Other",
  "summary": "2-3 sentence overview of the contents",
  "keyPoints": [
    "Key concept, deadline, or requirement 1",
    "Key concept, deadline, or requirement 2",
    "Key concept, deadline, or requirement 3"
  ],
  "deadlinesOrDates": [
    {
      "event": "What is due or happening",
      "date": "Date as written, or null"
    }
  ],
  "suggestedAction": "Analyze as College Notice | Generate Practice Test | Add to Study Vault"
}
`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64,
      },
    };

    let lastErr: any = null;
    for (const model of VISION_CANDIDATE_MODELS) {
      try {
        console.log(`[Extract Image Text] Trying model: ${model}`);
        let response;
        try {
          response = await callWithTimeout(
            ai.models.generateContent({
              model: model,
              contents: [imagePart, prompt],
              config: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            }),
            10000
          );
        } catch {
          response = await callWithTimeout(
            ai.models.generateContent({
              model: model,
              contents: [imagePart, `${prompt}\n\nIMPORTANT: Return valid JSON only without markdown fences.`],
              config: {
                temperature: 0.2,
              },
            }),
            10000
          );
        }

        if (response && response.text) {
          const parsed = parseModelJson(response.text);
          res.json({
            success: true,
            ...parsed,
            fileName,
            fileSize: req.file.size,
            usedModel: `${model} (Vision OCR)`,
          });
          return;
        }
      } catch (err: any) {
        console.warn(`[Extract Image Text] Model ${model} failed:`, err.message);
        lastErr = err;
      }
    }

    throw new Error(lastErr?.message || "Failed to extract text from image. Please verify the image is clear and try again.");
  } catch (error: any) {
    console.error("Extract image error:", error.message);
    res.status(400).json({ error: error.message || "Failed to process image" });
  }
});

// Model information endpoint
app.get("/api/model-info", (_req, res) => {
  res.json({
    defaultModel: DEFAULT_MODEL,
    availableModels: [
      { id: "gemma-4-26b-a4b-it", name: "Gemma 4 26B A4B (Recommended)", badge: "Gemma 4" },
      { id: "gemma-4-31b-it", name: "Gemma 4 31B", badge: "Gemma 4" },
      { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash (Visual OCR & Fast)", badge: "Gemini" },
    ],
  });
});

// FEATURE 1: College Notice Analyzer
app.post("/api/analyze-notice", upload.single("file"), async (req, res) => {
  try {
    const source = await getSourceContent(req, "noticeText");
    const requestedModel = req.body?.model;

    const noticeContext = source.text
      ? `Notice text:\n${source.text}`
      : source.isImage
      ? "The notice is provided directly as an uploaded image/photo (college circular board, handwritten announcement, or stamped document). Read all visible text, headers, dates, eligibility criteria, and action items carefully."
      : "The notice is provided directly as an uploaded PDF document. Read all pages carefully including stamped dates, department signatures, tables, and fine print.";

    const prompt = `
You are EduPilot AI, a careful, precise college notice assistant.

Analyze ONLY the supplied college notice. Do not invent dates, eligibility rules, fees, documents, or requirements.
If information is not clearly stated, do not guess. Keep important uncertainties in the output.

Return valid JSON only matching this exact schema:
{
  "title": "Clear concise notice title or subject",
  "issuer": "Department / University authority issuing the notice, or 'College Administration' if unspecified",
  "category": "Examinations | Admissions | Scholarships | Placements | Events | Fee Payment | General",
  "summary": "2-3 sentences concise summary of the notice",
  "deadlines": [
    {
      "event": "What is due or happening",
      "date": "Exact date as written (e.g. '15 November 2026') or null",
      "time": "Time if specified (e.g. '10:00 AM') or null",
      "isExam": true/false
    }
  ],
  "eligibility": ["Array of eligibility criteria directly stated in the notice"],
  "documents": ["Array of required documents, certificates, or IDs"],
  "actions": ["Step-by-step checklist of actions the student must take"],
  "uncertainties": ["Missing or ambiguous information that the student should verify with college authorities"]
}

${noticeContext}
`;

    const { data, usedModel, isScanned, isImage } = await askAI(prompt, source, requestedModel);
    res.json({
      ...data,
      sourceFileName: source.fileName || null,
      usedModel,
      isScanned,
      isImage,
    });
  } catch (error: any) {
    console.error("Notice analysis error:", error.message);
    res.status(400).json({ error: error.message || "Failed to analyze notice" });
  }
});

// FEATURE 2: AI Practice Test Generator
app.post("/api/generate-quiz", upload.single("file"), async (req, res) => {
  try {
    const source = await getSourceContent(req, "materialText");

    const scope = String(req.body.scope || "Full subject").slice(0, 100);
    const difficulty = ["Easy", "Medium", "Hard"].includes(req.body.difficulty)
      ? req.body.difficulty
      : "Medium";

    const count = Math.max(3, Math.min(20, Number.parseInt(req.body.count, 10) || 5));

    const format = ["MCQ", "True/False", "Mixed"].includes(req.body.format)
      ? req.body.format
      : "Mixed";

    const requestedModel = req.body?.model;

    const materialContext = source.text
      ? `Study material:\n${source.text}`
      : source.isImage
      ? "The study material is provided directly as an uploaded photo/image (chalkboard/whiteboard notes, textbook diagram, lecture slide, or handwritten student notes). Read all visible concepts, definitions, formulas, and text."
      : "The study material is provided directly as an uploaded PDF file. Read all lecture slides, definitions, diagrams, and formulas in the PDF.";

    const prompt = `
You are EduPilot AI, an educational exam and practice test generator.

Create a ${difficulty} practice test with exactly ${count} questions.
Selected scope: ${scope}.
Question format: ${format}.

Use the supplied study material as the sole primary source.
Do not claim that a topic is in a module unless the material supports it.
If the requested scope cannot be identified, state this in the title and create questions strictly from the available material.
Never invent incorrect facts or invalid answer keys.

For MCQ questions, provide exactly four distinct options and exactly one correctAnswer that matches one option character-for-character.
For True/False questions, provide options ["True", "False"] and correctAnswer as "True" or "False".
For Mixed, balance both styles according to the topics.

Return valid JSON only in this exact structure:
{
  "title": "Practice Test Title (e.g., Computer Networks — Module 1 Assessment)",
  "scope": "${scope}",
  "difficulty": "${difficulty}",
  "totalQuestions": ${count},
  "questions": [
    {
      "id": "q1",
      "question": "Question text clearly stating what is asked",
      "type": "MCQ or True/False",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact string of the correct option",
      "explanation": "Clear educational explanation citing the concept from the material",
      "topic": "Specific subtopic or concept name"
    }
  ]
}

${materialContext}
`;

    const { data, usedModel, isScanned, isImage } = await askAI(prompt, source, requestedModel);

    // Flexible extraction: handles { questions: [...] }, [...], { quiz: [...] }, etc.
    let rawQuestions: any[] = [];
    if (Array.isArray(data)) {
      rawQuestions = data;
    } else if (Array.isArray(data.questions)) {
      rawQuestions = data.questions;
    } else if (Array.isArray(data.quiz)) {
      rawQuestions = data.quiz;
    } else if (data.practiceTest && Array.isArray(data.practiceTest.questions)) {
      rawQuestions = data.practiceTest.questions;
    } else if (Array.isArray(data.items)) {
      rawQuestions = data.items;
    }

    if (!rawQuestions || rawQuestions.length === 0) {
      throw new Error("No valid questions were returned. Please try again with more detailed study material.");
    }

    // Normalize each question schema
    const questions = rawQuestions.map((q: any, idx: number) => {
      const qText = q.question || q.questionText || q.prompt || `Question ${idx + 1}`;
      const qOptions = Array.isArray(q.options)
        ? q.options
        : Array.isArray(q.choices)
        ? q.choices
        : ["True", "False"];
      const qAnswer = q.correctAnswer || q.answer || q.correct || qOptions[0];
      const qExplanation = q.explanation || q.reason || "Refer to the supplied study notes.";
      const qType = q.type || (qOptions.length === 2 && qOptions.includes("True") ? "True/False" : "MCQ");
      const qTopic = q.topic || scope;

      return {
        id: q.id || `q${idx + 1}`,
        question: qText,
        type: qType,
        options: qOptions,
        correctAnswer: qAnswer,
        explanation: qExplanation,
        topic: qTopic,
      };
    });

    res.json({
      title: data.title || `${scope} Practice Test`,
      scope: data.scope || scope,
      difficulty: data.difficulty || difficulty,
      totalQuestions: questions.length,
      questions,
      sourceFileName: source.fileName || null,
      usedModel,
      isScanned,
      isImage,
    });
  } catch (error: any) {
    console.error("Quiz generation error:", error.message);
    res.status(400).json({ error: error.message || "Failed to generate practice test" });
  }
});

// Global error handler for multer and bad requests
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ error: error.message || "An unexpected error occurred." });
});

// Vite middleware or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";
  const port = process.env.PORT || 3000;

  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
  }

  app.listen(port, () => {
    console.log(`EduPilot AI running at http://localhost:${port}`);
    console.log(`Configured model: ${DEFAULT_MODEL}`);
  });
}

startServer().catch((err) => {
  console.error("Server startup error:", err);
  process.exit(1);
});
