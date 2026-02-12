import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from './services/gemini.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  changeDetection: 1 // OnPush
})
export class AppComponent {
  private geminiService = inject(GeminiService);

  // State signals
  prompt = signal<string>("A cinematic promotional video for 'SSO Advertising and Trading Services Co., Ltd.' celebrating their 12th anniversary. The video features a timeline of growth, modern office scenes, dynamic advertising billboards, and successful trading handshakes. The mood is triumphant and professional. High quality, 4k, photorealistic.");
  
  selectedImage = signal<string | null>(null);
  selectedImageMime = signal<string | null>(null);
  
  isLoading = signal<boolean>(false);
  statusMessage = signal<string>('');
  generatedVideoUrl = signal<string | null>(null);
  error = signal<string | null>(null);

  // Helper to read file
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Result is like "data:image/png;base64,....."
        // We need to extract the base64 part and the mime type
        const matches = result.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          this.selectedImageMime.set(matches[1]);
          this.selectedImage.set(matches[2]);
        }
      };
      
      reader.readAsDataURL(file);
    }
  }

  async generateVideo() {
    if (this.isLoading()) return;
    
    this.isLoading.set(true);
    this.error.set(null);
    this.generatedVideoUrl.set(null);
    this.statusMessage.set('Initializing video generation...');

    // Start a timer to update status messages to keep user engaged (Veo takes time)
    let seconds = 0;
    const interval = setInterval(() => {
      seconds += 5;
      if (seconds < 30) {
        this.statusMessage.set(`Warming up creative engines... (${seconds}s)`);
      } else if (seconds < 60) {
        this.statusMessage.set(`Drafting the storyboard based on your logo... (${seconds}s)`);
      } else if (seconds < 120) {
        this.statusMessage.set(`Rendering high-quality frames... (${seconds}s)`);
      } else {
        this.statusMessage.set(`Polishing final details. Almost there... (${seconds}s)`);
      }
    }, 5000);

    try {
      const url = await this.geminiService.generateVideo(
        this.prompt(),
        this.selectedImage(),
        this.selectedImageMime()
      );
      this.generatedVideoUrl.set(url);
      this.statusMessage.set('Generation complete!');
    } catch (err: any) {
      this.error.set(err.message || 'An unexpected error occurred during generation.');
      this.statusMessage.set('Failed.');
    } finally {
      clearInterval(interval);
      this.isLoading.set(false);
    }
  }
  
  downloadVideo() {
    const url = this.generatedVideoUrl();
    if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'SSO-Promo-Video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
  }
}