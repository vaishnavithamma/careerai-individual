// Text-To-Speech (TTS) Service using OpenAI TTS with SpeechSynthesis fallback

export class TtsService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.audioElement = null;
    this.resumeInterval = null;
    this.isSpeaking = false;
    this.currentChunks = [];
    this.currentChunkIndex = 0;
  }

  isSupported() {
    return true;
  }

  async speak(text, onStart, onEnd, onError) {
    this.cancel();

    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      const contentType = response.headers.get("content-type") || "";
      if (!response.ok || contentType.includes("application/json")) {
        const errData = contentType.includes("application/json") ? await response.json().catch(() => ({})) : {};
        throw new Error(errData.error || "TTS Failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.audioElement = new Audio(audioUrl);
      
      this.audioElement.onplay = () => {
        this.isSpeaking = true;
        if (onStart) onStart();
      };
      
      this.audioElement.onended = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };
      
      this.audioElement.onerror = (e) => {
        console.error("Audio playback error:", e);
        this.fallbackSpeak(text, onStart, onEnd, onError);
      };

      this.audioElement.play();

    } catch (e) {
      console.warn("OpenAI TTS unconfigured or failed, falling back to native browser speechSynthesis:", e.message || e);
      this.fallbackSpeak(text, onStart, onEnd, onError);
    }
  }

  fallbackSpeak(text, onStart, onEnd, onError) {
    if (!this.synth) {
      if (onError) onError("Text-to-Speech not supported.");
      return;
    }

    this.cancel();
    this.isSpeaking = true;

    // Split text into manageable sentence chunks to prevent Chromium SpeechSynthesis 15s timeout cut-off
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    this.currentChunks = sentences.map(s => s.trim()).filter(Boolean);
    if (this.currentChunks.length === 0) this.currentChunks = [text];
    this.currentChunkIndex = 0;

    // Start a heartbeat timer to prevent Chrome from silently pausing SpeechSynthesis mid-sentence
    this.startHeartbeatTimer();

    if (onStart) onStart();
    this.speakNextChunk(onEnd, onError);
  }

  speakNextChunk(onEnd, onError) {
    if (!this.isSpeaking || this.currentChunkIndex >= this.currentChunks.length) {
      this.isSpeaking = false;
      this.stopHeartbeatTimer();
      if (onEnd) onEnd();
      return;
    }

    const chunkText = this.currentChunks[this.currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);

    const voices = this.synth.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))) ||
                         voices.find(v => v.lang.startsWith('en')) || 
                         voices[0];
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      this.currentChunkIndex++;
      this.speakNextChunk(onEnd, onError);
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      console.warn("SpeechSynthesis warning on chunk:", e.error || e);
      // Advance to next chunk or finish gracefully
      this.currentChunkIndex++;
      if (this.currentChunkIndex < this.currentChunks.length) {
        this.speakNextChunk(onEnd, onError);
      } else {
        this.isSpeaking = false;
        this.stopHeartbeatTimer();
        if (onEnd) onEnd();
      }
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.error("Failed to start SpeechSynthesis:", err);
      this.stopHeartbeatTimer();
      if (onError) onError(err);
    }
  }

  startHeartbeatTimer() {
    this.stopHeartbeatTimer();
    this.resumeInterval = setInterval(() => {
      if (this.synth && this.synth.speaking && !this.synth.paused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 14000);
  }

  stopHeartbeatTimer() {
    if (this.resumeInterval) {
      clearInterval(this.resumeInterval);
      this.resumeInterval = null;
    }
  }

  cancel() {
    this.isSpeaking = false;
    this.stopHeartbeatTimer();

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
  }
}
