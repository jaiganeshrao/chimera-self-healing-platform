/**
 * Project Chimera - Autonomous Fault Audio Alert Synthesizer
 * Uses Web Audio API to synthesize a distinct 1.0-second urgent telemetry alert sound.
 * Zero external audio dependencies, guaranteed offline compatibility and zero latency.
 */

class SoundAlertManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private hasInteracted: boolean = false;
  private lastSoundTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('chimera_sound_muted');
        this.isMuted = saved === 'true';
      } catch {
        this.isMuted = false;
      }

      // Pre-warm audio context on first user interaction to comply with browser autoplay policies
      const unlockAudio = () => {
        this.initContext();
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
        this.hasInteracted = true;
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };

      window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
      window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('chimera_sound_muted', String(muted));
    } catch {
      // ignore localStorage errors
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Synthesizes and plays a warning sound for exactly 1.0 second (1000ms).
   * Generates a two-stage energetic dual-tone warning chirp:
   *  - Pulse 1: 0.00s -> 0.42s (880Hz -> 720Hz urgent alert tone)
   *  - Gap:     0.42s -> 0.50s (urgent punctuation)
   *  - Pulse 2: 0.50s -> 1.00s (988Hz -> 780Hz warning tone decaying smoothly to 0 at 1.0s)
   */
  public playFaultSound(options: { force?: boolean; durationMs?: number } = {}): void {
    const { force = false, durationMs = 1000 } = options;
    if (this.isMuted && !force) return;

    // Strict throttle: guarantee exactly 1 sound per fault occurrence (3.5s cooldown)
    const nowMs = Date.now();
    if (nowMs - this.lastSoundTime < 3500) {
      return;
    }
    this.lastSoundTime = nowMs;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const totalDurationSec = durationMs / 1000; // exactly 1.0s

      // Master output gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.35, now);
      masterGain.connect(ctx.destination);

      // Pulse 1: 0.0s to 0.42s
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(720, now + 0.4);

      // Sub-harmonic oscillator for depth
      const sub1 = ctx.createOscillator();
      sub1.type = 'sine';
      sub1.frequency.setValueAtTime(440, now);
      sub1.frequency.exponentialRampToValueAtTime(360, now + 0.4);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.28, now + 0.02); // quick 20ms attack
      gain1.gain.setValueAtTime(0.28, now + 0.35);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.42); // decay pulse 1

      osc1.connect(gain1);
      sub1.connect(gain1);
      gain1.connect(masterGain);

      osc1.start(now);
      sub1.start(now);
      osc1.stop(now + 0.42);
      sub1.stop(now + 0.42);

      // Pulse 2: 0.50s to 1.00s
      const pulse2Start = now + 0.50;
      const osc2 = ctx.createOscillator();
      const sub2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(988, pulse2Start); // B5 (higher pitch urgency)
      osc2.frequency.exponentialRampToValueAtTime(784, now + totalDurationSec);

      sub2.type = 'sine';
      sub2.frequency.setValueAtTime(494, pulse2Start);
      sub2.frequency.exponentialRampToValueAtTime(392, now + totalDurationSec);

      gain2.gain.setValueAtTime(0.001, pulse2Start);
      gain2.gain.linearRampToValueAtTime(0.32, pulse2Start + 0.02);
      gain2.gain.setValueAtTime(0.3, now + 0.85);
      // Clean decay precisely ending at totalDurationSec (1.00s)
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + totalDurationSec);

      osc2.connect(gain2);
      sub2.connect(gain2);
      gain2.connect(masterGain);

      osc2.start(pulse2Start);
      sub2.start(pulse2Start);
      osc2.stop(now + totalDurationSec);
      sub2.stop(now + totalDurationSec);

      // Cleanly disconnect master gain after sound completes
      setTimeout(() => {
        try {
          masterGain.disconnect();
        } catch {
          // ignore
        }
      }, durationMs + 100);
    } catch (err) {
      console.warn('Audio alert could not be synthesized:', err);
    }
  }

  /**
   * Request permission for native desktop notifications
   */
  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    return await Notification.requestPermission();
  }

  /**
   * Dispatch system browser notification if enabled
   */
  public sendSystemNotification(title: string, body: string, icon?: string): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: icon || '/favicon.ico',
          tag: 'chimera-fault-alert',
        });
      } catch (err) {
        console.warn('Failed to send browser notification:', err);
      }
    }
  }
}

export const soundAlert = new SoundAlertManager();
