import { useEffect, useRef, useState } from 'react'

export function useInterval(cb: () => void, ms: number | null) {
  const saved = useRef(cb)
  useEffect(() => { saved.current = cb }, [cb])
  useEffect(() => {
    if (ms === null) return
    const id = setInterval(() => saved.current(), ms)
    return () => clearInterval(id)
  }, [ms])
}

/** Re-renders every `ms` and returns Date.now(). Good for countdowns/timers. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useInterval(() => setNow(Date.now()), ms)
  return now
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => setMatches(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [query])
  return matches
}

/** Simulates network latency so skeleton states are visible. */
export function useFakeLoading(ms = 650, deps: unknown[] = []) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return loading
}

/** Locks body scroll while a modal/drawer is open. */
export function useLockBody(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [locked])
}

/** Short two-tone alert using WebAudio (no asset files). Must follow a user gesture once. */
let ctx: AudioContext | null = null
export function playAlert() {
  try {
    ctx ??= new AudioContext()
    const play = (freq: number, at: number) => {
      const o = ctx!.createOscillator()
      const g = ctx!.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, ctx!.currentTime + at)
      g.gain.exponentialRampToValueAtTime(0.25, ctx!.currentTime + at + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx!.currentTime + at + 0.25)
      o.connect(g).connect(ctx!.destination)
      o.start(ctx!.currentTime + at)
      o.stop(ctx!.currentTime + at + 0.3)
    }
    play(880, 0)
    play(1320, 0.18)
  } catch { /* audio unavailable */ }
}
