import { isSupabaseConfigured, supabase } from './supabase'
import type { PlantId, SensorId } from '../farm'

/** Mirrors the `settings` table the smart-farm control panel writes to. */
export type FarmSettings = {
  target_stage: number
  led_brightness: number
  target_temp: number
  water_level: number
  soil_moisture: number
  light_lux: number
  co2_ppm: number
  humidity: number
  plant: PlantId
}

/** Maps an in-app sensor dial to its column in the `settings` table. */
export const SENSOR_COLUMN: Record<SensorId, keyof FarmSettings> = {
  water: 'water_level',
  soil: 'soil_moisture',
  light: 'light_lux',
  co2: 'co2_ppm',
  temp: 'target_temp',
  humidity: 'humidity',
  led: 'led_brightness',
}

const ROW_ID = 1

const COLUMNS =
  'target_stage, led_brightness, target_temp, water_level, soil_moisture, light_lux, co2_ppm, humidity, plant'

export async function fetchFarmSettings(): Promise<Partial<FarmSettings> | null> {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('settings')
    .select(COLUMNS)
    .eq('id', ROW_ID)
    .maybeSingle()
  if (error || !data) return null
  return data as Partial<FarmSettings>
}

/**
 * Subscribe to live changes on the `settings` row. Returns an unsubscribe fn.
 * Requires `ALTER PUBLICATION supabase_realtime ADD TABLE settings;` (see SQL.txt).
 */
export function subscribeFarmSettings(
  onChange: (s: Partial<FarmSettings>) => void,
): () => void {
  if (!isSupabaseConfigured) return () => {}
  const channel = supabase
    .channel('farm-settings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'settings', filter: `id=eq.${ROW_ID}` },
      (payload) => {
        const row = payload.new as Partial<FarmSettings> | null
        if (row) onChange(row)
      },
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}

/** Push app-side changes back so the panel and app stay in sync. */
export async function pushFarmSettings(patch: Partial<FarmSettings>): Promise<void> {
  if (!isSupabaseConfigured) return
  await supabase
    .from('settings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', ROW_ID)
}

/** Convenience: push a single sensor dial's value to its column. */
export async function pushSensor(id: SensorId, value: number): Promise<void> {
  const column = SENSOR_COLUMN[id]
  const rounded = id === 'temp' ? value : Math.round(value)
  await pushFarmSettings({ [column]: rounded } as Partial<FarmSettings>)
}
