import { SENSORS, sensorStatus, type Plant, type SensorId, type SensorState } from '../farm'
import { MAX_STAGE, plantImage } from '../plantImages'
import SensorIcon from './SensorIcon'

type Props = {
  plant: Plant
  stage: number
  sensors: SensorState
  onSelect: (id: SensorId) => void
  onOpenCamera: () => void
}

const STATUS_DOT: Record<'low' | 'ok' | 'high', string> = {
  low: 'bg-accent',
  ok: 'bg-primary',
  high: 'bg-accent',
}

function formatValue(value: number, unit: string) {
  if (unit === 'lux' || unit === 'ppm') return value.toLocaleString('en-US')
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(1)
}

export default function RadialHome({ plant, stage, sensors, onSelect, onOpenCamera }: Props) {
  const count = SENSORS.length
  const radius = 42

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="text-center">
        <p className="font-display text-sm font-medium tracking-[0.2em] text-muted-foreground">
          스마트팜 · 실시간
        </p>
        <h1 className="mt-1.5 font-display text-3xl font-semibold sm:text-4xl">
          오늘의 {plant.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {plant.tagline} · {stage}/{MAX_STAGE}단계
        </p>
      </div>

      <div className="relative mt-2 aspect-square w-full max-w-[min(680px,70vh)]">
        <div className="pointer-events-none absolute inset-0 rounded-full border border-border/70" />
        <div className="pointer-events-none absolute inset-[16%] rounded-full border border-dashed border-border/60" />

        {/* plant mascot — tap for the live camera */}
        <button
          onClick={onOpenCamera}
          aria-label={`${plant.name} 실시간 카메라 보기`}
          className="group absolute left-1/2 top-1/2 flex h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card shadow-[var(--shadow-soft)] transition-transform duration-300 hover:scale-[1.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="absolute inset-[5%] rounded-full bg-secondary/60" />
          <img
            src={plantImage(plant.id, stage)}
            alt={`${plant.name} ${stage}단계`}
            className="animate-sway relative h-[88%] w-[88%] select-none object-contain drop-shadow-sm"
          />
          <span className="absolute bottom-[8%] flex items-center gap-1 rounded-full bg-foreground/80 px-2.5 py-1 text-[0.65rem] font-medium text-background opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7l-7 5 7 5V7zM1 5h15v14H1z" />
            </svg>
            실시간
          </span>
        </button>

        {/* sensor nodes */}
        {SENSORS.map((sensor, i) => {
          const angle = (i / count) * 2 * Math.PI - Math.PI / 2
          const x = 50 + radius * Math.cos(angle)
          const y = 50 + radius * Math.sin(angle)
          const status = sensorStatus(sensor, sensors[sensor.id])
          return (
            <button
              key={sensor.id}
              onClick={() => onSelect(sensor.id)}
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 60}ms` }}
              className="animate-float-in group absolute flex w-[26%] max-w-[150px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border border-border/80 bg-card px-3 py-3 text-center shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-x-1/2 hover:-translate-y-[calc(50%+5px)] hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <SensorIcon path={sensor.icon} className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">{sensor.short}</span>
              </span>
              <span className="font-mono text-lg font-semibold leading-none text-card-foreground sm:text-xl">
                {formatValue(sensors[sensor.id], sensor.unit)}
                <span className="ml-0.5 text-[0.6rem] font-normal text-muted-foreground">
                  {sensor.unit}
                </span>
              </span>
              <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        항목을 눌러 값을 조절하세요
      </p>
    </div>
  )
}
