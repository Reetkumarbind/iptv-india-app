export class VoiceSearchService {
  private recognition: SpeechRecognition | null = null;
  private isSupported = false;

  constructor() {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (this.isSupported) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
  }

  isVoiceSearchSupported(): boolean {
    return this.isSupported;
  }

  startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Voice search not supported'));
        return;
      }

      this.recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        resolve(result);
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Voice search error: ${event.error}`));
      };

      this.recognition.onend = () => {
        // Recognition ended
      };

      try {
        this.recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}