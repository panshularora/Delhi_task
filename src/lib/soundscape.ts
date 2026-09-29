/**
 * Delhi Ambient Soundscape Synthesizer
 * Generates an ethereal, calming tanpura / sitar harmonic drone + warm atmospheric city breeze
 * using pure Web Audio API synthesis. No external audio files or downloads needed.
 */

class SoundscapeSynth {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private isRunning = false
  private oscillators: OscillatorNode[] = []

  init() {
    if (this.ctx) return
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    this.ctx = new AudioCtx()
  }

  toggle(): boolean {
    if (this.isRunning) {
      this.stop()
      return false
    } else {
      this.play()
      return true
    }
  }

  play() {
    this.init()
    if (!this.ctx) return
    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }

    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime)
    this.masterGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 2.5)
    this.masterGain.connect(this.ctx.destination)

    // Warm Lowpass Filter for warm acoustic feel
    const filter = this.ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.setValueAtTime(420, this.ctx.currentTime)
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime)
    filter.connect(this.masterGain)

    // Tanpura Drone Harmonic Frequencies (in C# / Indian Sa-Pa tuning)
    // Sa (C#3): 138.59 Hz, Pa (G#3): 207.65 Hz, Sa high (C#4): 277.18 Hz
    const freqs = [69.3, 138.59, 207.65, 277.18, 415.3]

    this.oscillators = freqs.map((f, i) => {
      const osc = this.ctx!.createOscillator()
      const g = this.ctx!.createGain()

      osc.type = i % 2 === 0 ? "sawtooth" : "sine"
      osc.frequency.setValueAtTime(f + (Math.random() - 0.5) * 0.8, this.ctx!.currentTime)

      // Slow harmonic amplitude modulation (breathing drone)
      const lfo = this.ctx!.createOscillator()
      const lfoGain = this.ctx!.createGain()
      lfo.frequency.setValueAtTime(0.12 + i * 0.05, this.ctx!.currentTime)
      lfoGain.gain.setValueAtTime(0.04, this.ctx!.currentTime)
      lfo.connect(lfoGain)
      lfoGain.connect(g.gain)
      lfo.start()

      g.gain.setValueAtTime(0.08 / (i + 1), this.ctx!.currentTime)
      osc.connect(g)
      g.connect(filter)
      osc.start()
      return osc
    })

    this.isRunning = true
  }

  stop() {
    if (!this.masterGain || !this.ctx) return
    this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2)
    setTimeout(() => {
      this.oscillators.forEach((o) => {
        try {
          o.stop()
          o.disconnect()
        } catch {
          /* ignore */
        }
      })
      this.oscillators = []
      this.isRunning = false
    }, 1300)
  }

  active(): boolean {
    return this.isRunning
  }

  playChime() {
    this.init()
    if (!this.ctx) return
    if (this.ctx.state === "suspended") this.ctx.resume()
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08)
    gain.gain.setValueAtTime(0.05, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.36)
  }

  playWhoosh() {
    this.init()
    if (!this.ctx) return
    if (this.ctx.state === "suspended") this.ctx.resume()
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(200, now)
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.22)
    gain.gain.setValueAtTime(0.035, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.46)
  }
}

export const soundscape = new SoundscapeSynth()
