// Text-To-Speech (TTS) Service using OpenAI TTS with SpeechSynthesis fallback

export class TtsService {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.audioElement = null;
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

      // If key is missing or failed, throw error to trigger fallback
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "TTS Failed");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.audioElement = new Audio(audioUrl);
      
      this.audioElement.onplay = () => {
        if (onStart) onStart();
      };
      
      this.audioElement.onended = () => {
        if (onEnd) onEnd();
      };
      
      this.audioElement.onerror = (e) => {
        console.error("Audio playback error:", e);
        this.fallbackSpeak(text, onStart, onEnd, onError);
      };

      this.audioElement.play();

    } catch (e) {
      console.warn("OpenAI TTS failed or is unconfigured, falling back to native browser speechSynthesis:", e);
      this.fallbackSpeak(text, onStart, onEnd, onError);
    }
  }

  fallbackSpeak(text, onStart, onEnd, onError) {
    if (!this.synth) {
      if (onError) onError("Text-to-Speech not supported.");
      return;
    }

    this.utterance = new SpeechSynthesisUtterance(text);
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                         voices.find(v => v.lang.startsWith('en')) || 
                         voices[0];
    if (englishVoice) {
      this.utterance.voice = englishVoice;
    }

    this.utterance.rate = 1.0;
    this.utterance.pitch = 1.0;

    this.utterance.onstart = () => {
      if (onStart) onStart();
    };

    this.utterance.onend = () => {
      if (onEnd) onEnd();
    };

    this.utterance.onerror = (e) => {
      if (onError) onError(e);
    };

    this.synth.speak(this.utterance);
  }

  cancel() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    if (this.synth) {
      this.synth.cancel();
    }
  }
}
