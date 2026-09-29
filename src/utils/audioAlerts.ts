// Web Audio API synthesizers for in-cab audio alerts

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playSeatbeltWarningSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    // Two-tone urgent chime (European/Heavy equipment ISO 7731 compliant)
    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'square'
    osc2.type = 'triangle'

    osc1.frequency.setValueAtTime(880, now)
    osc1.frequency.setValueAtTime(660, now + 0.15)
    osc1.frequency.setValueAtTime(880, now + 0.3)

    osc2.frequency.setValueAtTime(440, now)
    osc2.frequency.setValueAtTime(330, now + 0.15)
    osc2.frequency.setValueAtTime(440, now + 0.3)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.55)
    osc2.stop(now + 0.55)
  } catch (e) {
    console.error('Audio play error', e)
  }
}

export function playProximityAlertSound(severity: 'CRITICAL' | 'WARNING') {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    const freq = severity === 'CRITICAL' ? 1200 : 750
    osc.frequency.setValueAtTime(freq, now)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.25)
  } catch (e) {
    console.error('Audio play error', e)
  }
}

export function playCompanionChime() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(523.25, now) // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08) // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16) // G5

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.35)
  } catch (e) {
    console.error('Audio play error', e)
  }
}

export function playMachineHornSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    // Dual-tone heavy equipment air horn (310Hz + 380Hz)
    osc1.type = 'sawtooth'
    osc2.type = 'triangle'

    osc1.frequency.setValueAtTime(310, now)
    osc2.frequency.setValueAtTime(380, now)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.65)
    osc2.stop(now + 0.65)
  } catch (e) {
    console.error('Audio play error', e)
  }
}
