export type ThemeMode = 'light' | 'dark'
export type PlantId = 'bokchoy' | 'lettuce'
export type Screen = 'home' | 'diary'

export type Plant = {
  id: PlantId
  name: string
  emoji: string
  tagline: string
}

export const PLANTS: Record<PlantId, Plant> = {
  bokchoy: {
    id: 'bokchoy',
    name: '청경채',
    emoji: '🥬',
    tagline: '아삭한 잎이 자라는 중',
  },
  lettuce: {
    id: 'lettuce',
    name: '상추',
    emoji: '🌿',
    tagline: '부드러운 잎을 펼치는 중',
  },
}

export type SensorId =
  | 'water'
  | 'soil'
  | 'light'
  | 'co2'
  | 'temp'
  | 'humidity'
  | 'led'

export type Sensor = {
  id: SensorId
  label: string
  short: string
  unit: string
  min: number
  max: number
  step: number
  /** Recommended operating window, used for the status hint. */
  ideal: [number, number]
  icon: string // SVG path data (24x24 viewBox)
}

export const SENSORS: Sensor[] = [
  {
    id: 'water',
    label: '물통 수위',
    short: '수위',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    ideal: [40, 90],
    icon: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z',
  },
  {
    id: 'soil',
    label: '토양 습도',
    short: '토양',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    ideal: [55, 80],
    icon: 'M4 14c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2M4 18c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2M12 3v6m0 0 3-3m-3 3L9 6',
  },
  {
    id: 'light',
    label: '조도',
    short: '조도',
    unit: 'lux',
    min: 0,
    max: 20000,
    step: 100,
    ideal: [8000, 15000],
    icon: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  },
  {
    id: 'co2',
    label: '이산화탄소',
    short: 'CO₂',
    unit: 'ppm',
    min: 300,
    max: 2000,
    step: 10,
    ideal: [600, 1200],
    icon: 'M7 15a4 4 0 1 1 1.5-7.7A5 5 0 0 1 18 9a3.5 3.5 0 0 1-.5 6H7Z',
  },
  {
    id: 'temp',
    label: '온도',
    short: '온도',
    unit: '°C',
    min: 0,
    max: 45,
    step: 0.5,
    ideal: [18, 24],
    icon: 'M12 3a2 2 0 0 0-2 2v9.2a4 4 0 1 0 4 0V5a2 2 0 0 0-2-2Zm0 13a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z',
  },
  {
    id: 'humidity',
    label: '습도',
    short: '습도',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    ideal: [55, 75],
    icon: 'M12 3s5.5 6 5.5 10a5.5 5.5 0 0 1-11 0C6.5 9 12 3 12 3Zm-1.5 9a2.5 2.5 0 0 0 2.5 2.5',
  },
  {
    id: 'led',
    label: 'LED 조사량',
    short: 'LED',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    ideal: [60, 100],
    icon: 'M9 18h6m-5 3h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2h6c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z',
  },
]

export type SensorState = Record<SensorId, number>

export const DEFAULT_SENSOR_STATE: SensorState = {
  water: 72,
  soil: 64,
  light: 11200,
  co2: 840,
  temp: 21.5,
  humidity: 63,
  led: 80,
}

export type SensorStatus = 'low' | 'ok' | 'high'

export function sensorStatus(sensor: Sensor, value: number): SensorStatus {
  if (value < sensor.ideal[0]) return 'low'
  if (value > sensor.ideal[1]) return 'high'
  return 'ok'
}

export const STATUS_LABEL: Record<SensorStatus, string> = {
  low: '낮음',
  ok: '적정',
  high: '높음',
}
