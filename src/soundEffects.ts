/**
 * Sound effects manager for card game audio
 */

import flipSound from '/flip.mp3?url';

class SoundManager {
  private flipAudio: HTMLAudioElement | null = null;
  private enabled: boolean = true;

  constructor() {
    // Preload sound effects
    this.loadSounds();
  }

  private loadSounds() {
    try {
      this.flipAudio = new Audio(flipSound);
      this.flipAudio.volume = 0.3; // Set volume to 30% for subtle effect
      this.flipAudio.preload = 'auto';
    } catch (error) {
      console.warn('Failed to load sound effects:', error);
    }
  }

  playFlip() {
    if (!this.enabled || !this.flipAudio) return;

    try {
      // Clone the audio to allow overlapping plays
      const sound = this.flipAudio.cloneNode(true) as HTMLAudioElement;
      sound.volume = 0.3;
      sound.play().catch(err => {
        // Ignore autoplay policy errors
        console.debug('Sound play prevented:', err);
      });
    } catch (error) {
      console.debug('Error playing flip sound:', error);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
