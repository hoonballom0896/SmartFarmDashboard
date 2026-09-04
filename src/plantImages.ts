import type { PlantId } from './farm'

import bok1 from './imports/plant_stage1.png'
import bok2 from './imports/plant_stage2.png'
import bok3 from './imports/plant_stage3.png'
import bok4 from './imports/plant_stage4.png'
import bok5 from './imports/plant_stage5.png'
import bok6 from './imports/plant_stage6.png'
import let1 from './imports/plant_stage11.png'
import let2 from './imports/plant_stage12.png'
import let3 from './imports/plant_stage13.png'
import let4 from './imports/plant_stage14.png'
import let5 from './imports/plant_stage15.png'
import let6 from './imports/plant_stage16.png'
import logo from './imports/LOGO.png'

export const LOGO = logo

/** Six growth stages per plant, index 0 = seedling … index 5 = harvest-ready. */
const STAGES: Record<PlantId, string[]> = {
  bokchoy: [bok1, bok2, bok3, bok4, bok5, bok6],
  lettuce: [let1, let2, let3, let4, let5, let6],
}

export const MAX_STAGE = 6

/** stage is 1-based (1…6). */
export function plantImage(plant: PlantId, stage: number): string {
  const arr = STAGES[plant]
  const idx = Math.min(Math.max(stage, 1), arr.length) - 1
  return arr[idx]
}
