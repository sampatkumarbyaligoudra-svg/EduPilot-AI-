// Web Speech API Voice Recognition & Synthesis helpers

export interface SpeechRecognitionHandler {
  start: (onTranscript: (text: string) => void, onEnd: () => void) => boolean;
  stop: () => void;
  isSupported: boolean;
}

export function createSpeechRecognizer(): SpeechRecognitionHandler {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  let recognitionInstance: any = null;

  return {
    isSupported: !!SpeechRecognition,
    start: (onTranscript, onEnd) => {
      if (!SpeechRecognition) return false;
      try {
        if (recognitionInstance) {
          recognitionInstance.abort();
        }
        recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";

        recognitionInstance.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            onTranscript(currentTranscript);
          }
        };

        recognitionInstance.onerror = (err: any) => {
          console.warn("Speech recognition error:", err);
          onEnd();
        };

        recognitionInstance.onend = () => {
          onEnd();
        };

        recognitionInstance.start();
        return true;
      } catch (e) {
        console.warn("Could not start speech recognition:", e);
        onEnd();
        return false;
      }
    },
    stop: () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch {
          // Ignore
        }
      }
    },
  };
}

export function speakText(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  const cleanText = text
    .replace(/[#*`_]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 800);

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
