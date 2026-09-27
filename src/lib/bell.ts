// A soft singing-bowl bell, made in the browser with Web Audio — no sound file
// to download, so it works offline. Browsers only allow sound after a tap, so
// call unlockBell() from the Start button.

let context: AudioContext | null = null

export function unlockBell() {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return
  context ??= new Ctx()
  if (context.state === 'suspended') void context.resume()
}

export function ringBell(volume = 0.35) {
  if (!context) unlockBell()
  const ctx = context
  if (!ctx) return
  const now = ctx.currentTime
  const out = ctx.createGain()
  out.gain.value = volume
  out.connect(ctx.destination)
  // A bowl's tone: a low fundamental plus slightly inharmonic overtones that fade faster.
  const partials = [
    { freq: 432, gain: 1, decay: 6 },
    { freq: 432 * 2.76, gain: 0.45, decay: 4 },
    { freq: 432 * 5.4, gain: 0.2, decay: 2.5 },
    { freq: 432 * 1.002, gain: 0.5, decay: 6 }, // a slight detune gives the gentle "wah"
  ]
  for (const { freq, gain, decay } of partials) {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    env.gain.setValueAtTime(0, now)
    env.gain.linearRampToValueAtTime(gain, now + 0.02)
    env.gain.exponentialRampToValueAtTime(0.0001, now + decay)
    osc.connect(env).connect(out)
    osc.start(now)
    osc.stop(now + decay + 0.1)
  }
}
