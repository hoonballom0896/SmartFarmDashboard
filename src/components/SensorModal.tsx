import { useEffect, useState } from 'react'
import {
  STATUS_LABEL,
  sensorStatus,
  type Sensor,
  type SensorState,
} from '../farm'
import { useAnimatedNumber } from '../useAnimatedNumber'
import SensorIcon from './SensorIcon'

type Props = {
  sensor: Sensor
  sensors: SensorState
  onChange: (value: number) => void
  onClose: () => void
}

function format(value: number, unit: string) {
  if (unit === 'lux' || unit === 'ppm') return value.toLocaleString('en-US')
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(1)
}

export default function SensorModal({ sensor, sensors, onChange, onClose }: Props) {
  const value = sensors[sensor.id]
  const status = sensorStatus(sensor, value)
  const { display, direction } = useAnimatedNumber(value)
  const [dragging, setDragging] = useState(false)
  // While dragging, follow the finger for responsiveness; otherwise let button
  // jumps and the "적정값" preset glide the fill + thumb smoothly.
  const shown = dragging ? value : display
  const pct = ((shown - sensor.min) / (sensor.max - sensor.min)) * 100

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const statusColor =
    status === 'ok' ? 'text-primary' : 'text-accent'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${sensor.label} 조절`}
    >
      <button
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
      />

      <div className="animate-float-in relative w-full max-w-md rounded-[calc(var(--radius)+0.5rem)] border border-border bg-popover p-7 text-popover-foreground shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <SensorIcon path={sensor.icon} className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-2xl font-semibold">{sensor.label}</h2>
              <p className={`text-sm font-medium ${statusColor}`}>
                {STATUS_LABEL[status]} · 적정 {format(sensor.ideal[0], sensor.unit)}–
                {format(sensor.ideal[1], sensor.unit)}
                {sensor.unit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-7 flex items-end justify-center gap-2">
          <span
            className={`font-mono text-6xl font-semibold tracking-tight transition-all duration-200 ${
              direction === 'up'
                ? '-translate-y-1 text-primary'
                : direction === 'down'
                  ? 'translate-y-1 text-accent'
                  : 'translate-y-0'
            }`}
          >
            {format(sensor.step < 1 ? shown : Math.round(shown), sensor.unit)}
          </span>
          <span className="pb-2 text-lg text-muted-foreground">{sensor.unit}</span>
          <span
            className={`pb-3 text-xl transition-opacity duration-200 ${
              direction === 'up'
                ? 'text-primary opacity-100'
                : direction === 'down'
                  ? 'text-accent opacity-100'
                  : 'opacity-0'
            }`}
            aria-hidden="true"
          >
            {direction === 'down' ? '▾' : '▴'}
          </span>
        </div>

        {/* slider */}
        <div className="mt-7">
          <input
            type="range"
            min={sensor.min}
            max={sensor.max}
            step={sensor.step}
            value={shown}
            onChange={(e) => onChange(Number(e.target.value))}
            onPointerDown={() => setDragging(true)}
            onPointerUp={() => setDragging(false)}
            onPointerLeave={() => setDragging(false)}
            onKeyDown={() => setDragging(true)}
            onKeyUp={() => setDragging(false)}
            aria-label={`${sensor.label} 값`}
            className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-card [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-card [&::-webkit-slider-thumb]:shadow-md"
            style={{
              background: `linear-gradient(to right, var(--primary) ${pct}%, var(--sensor-track) ${pct}%)`,
            }}
          />
          <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
            <span>{format(sensor.min, sensor.unit)}</span>
            <span>{format(sensor.max, sensor.unit)}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <button
            onClick={() => onChange(Math.max(sensor.min, +(value - sensor.step * 5).toFixed(2)))}
            className="rounded-xl border border-border bg-card py-2.5 text-sm font-medium transition hover:border-primary/50"
          >
            − 낮추기
          </button>
          <button
            onClick={() => onChange((sensor.ideal[0] + sensor.ideal[1]) / 2)}
            className="rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            적정값
          </button>
          <button
            onClick={() => onChange(Math.min(sensor.max, +(value + sensor.step * 5).toFixed(2)))}
            className="rounded-xl border border-border bg-card py-2.5 text-sm font-medium transition hover:border-primary/50"
          >
            + 높이기
          </button>
        </div>
      </div>
    </div>
  )
}
