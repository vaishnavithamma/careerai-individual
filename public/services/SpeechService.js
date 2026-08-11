// Speech Recognition Service using OpenAI Whisper API with Web Speech fallback

export class SpeechService {
  constructor() {
    this.recognition = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.transcript = '';
    this.initFallbackRecognition();
  }

  initFallbackRecognition() {
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
    this.audioChunks = [];

    // Attempt to start MediaRecorder for Whisper STT API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = async () => {
          // Convert audio chunks to blob
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          
          if (onResult) {
            onResult("Transcribing answer using OpenAI Whisper...");
          }

          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = reader.result.split(',')[1];
            try {
              const response = await fetch("/api/transcribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  audio: base64Data,
                  filename: "recording.webm"
                })
              });
              const data = await response.json();
              if (data.error === "OPENAI_KEY_MISSING") {
                console.warn("OpenAI key missing for Whisper. Using complete browser recognition transcript.");
                if (onEnd) onEnd(this.transcript.trim() || "No speech captured.");
                return;
              }
              const whisperText = data.text ? data.text.trim() : "";
              this.transcript = whisperText || this.transcript.trim();
              if (onResult) onResult(this.transcript);
              if (onEnd) onEnd(this.transcript);
            } catch (err) {
              console.error("Whisper transcription failed, falling back to browser text:", err);
              if (onEnd) onEnd(this.transcript.trim() || "Failed to transcribe audio.");
            }
          };

          // Release mic track
          stream.getTracks().forEach(track => track.stop());
        };

        this.mediaRecorder.start();
      }).catch(err => {
        console.error("Microphone access blocked, falling back to browser SpeechRecognition:", err);
        this.startFallbackRecognition(onResult, onError, onEnd);
      });
    } else {
      this.startFallbackRecognition(onResult, onError, onEnd);
    }

    // Always start fallback browser SpeechRecognition in parallel to capture real-time text
    if (this.recognition) {
      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        // Iterate through all results from index 0 to accumulate complete candidate response
        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const fullText = (finalTranscript + interimTranscript).trim();
        this.transcript = fullText;

        // Update UI callback continuously while recording
        if (onResult && (!this.mediaRecorder || this.mediaRecorder.state === 'recording')) {
          onResult(fullText);
        }
      };

      this.recognition.onerror = (event) => {
        console.error("Fallback Speech Recognition Error:", event.error);
        if (!this.mediaRecorder && onError) onError(event.error);
      };

      this.recognition.onend = () => {
        // Auto-restart recognition if browser paused it while user is still recording
        if (this.isRecording) {
          try {
            this.recognition.start();
          } catch (e) {}
        }
      };

      try {
        this.recognition.start();
      } catch (e) {}
    }
  }

  startFallbackRecognition(onResult, onError, onEnd) {
    if (!this.recognition) {
      if (onError) onError("Browser voice recognition is not supported.");
    }
  }

  stopListening() {
    this.isRecording = false;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }
}
