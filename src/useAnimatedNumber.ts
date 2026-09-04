import { useEffect, useRef, useState } from 'react'

export type Direction = 'up' | 'down' | 'none'

/**
 * Tweens a displayed number toward `target` so button/step jumps read as the
 * value climbing or dropping. Also reports the direction of the latest change
 * so callers can flash color / nudge the readout.
 */
export function useAnimatedNumber(target: number, duration = 450) {
  const [display, setDisplay] = useState(target)
  const [direction, setDirection] = useState<Direction>('none')
  const fromRef = useRef(target)
  const startRef = useRef(0)
  const rafRef = useRef<number>(0)
  const dirTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const from = display
    if (from === target) return
    fromRef.current = from
    startRef.current = performance.now()

    setDirection(target > from ? 'up' : 'down')
    clearTimeout(dirTimer.current)
    dirTimer.current = setTimeout(() => setDirection('none'), duration + 120)

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(fromRef.current + (target - fromRef.current) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
      else setDisplay(target)
    }
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  return { display, direction }
}
