// Speech Recognition Service using Native Web Speech API (SpeechRecognition)

export class SpeechService {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.transcript = '';
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  startListening(onResult, onError, onEnd) {
    if (this.isRecording) return;
    this.isRecording = true;
    this.transcript = '';

    if (!this.recognition) {
      if (onError) onError("Browser voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const fullText = (finalTranscript + interimTranscript).trim();
      this.transcript = fullText;

      if (onResult) {
        onResult(fullText);
      }
    };

    this.recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      if (onError && event.error !== 'no-speech') {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        try {
          this.recognition.start();
        } catch (e) {}
      } else if (onEnd) {
        onEnd(this.transcript.trim());
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      if (onError) onError(e.message || String(e));
    }
  }

  stopListening() {
    this.isRecording = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }
}
