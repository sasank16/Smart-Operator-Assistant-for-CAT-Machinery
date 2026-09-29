export type MachineType = 'excavator' | 'wheel_loader' | 'dozer' | 'articulated_truck' | 'motor_grader'

export interface CatMachine {
  id: string
  model: string
  name: string
  type: MachineType
  category: string
  operatingWeight: string
  powerHp: number
  fuelCapacityL: number
  standardFuelBurnLph: number
  currentEngineHours: number
  fuelLevelPct: number
  hydraulicTempC: number
  engineRpm: number
  primaryAttachment: string
  ageYears: number
  status: 'active' | 'idling' | 'warning' | 'stopped'
}

export interface TelemetryRecord {
  timestamp: string
  machineId: string
  operatorId: string
  engineHours: number
  fuelUsedL: number
  loadCycles: number
  idlingTimeMin: number
  seatbeltStatus: 'Fastened' | 'Unfastened'
  safetyAlertTriggered: 'Yes' | 'No'
  engineRpm?: number
  hydraulicPressurePsi?: number
  speedKmh?: number
}

export interface TaskRecord {
  taskId: string
  taskType: 'Earth Excavation' | 'Trenching' | 'Material Loading' | 'Grading' | 'Demolition'
  weather: 'Sunny' | 'Rainy' | 'Cloudy' | 'Windy'
  operatorSkill: 'Expert' | 'Intermediate' | 'Beginner'
  machineAgeYrs: number
  estimatedTimeMin: number
  actualTimeMin?: number
  status: 'In Progress' | 'Scheduled' | 'Completed' | 'Delayed'
  priority: 'Critical' | 'High' | 'Medium'
  siteZone: string
  targetVolumeTons: number
  completedVolumeTons: number
  assignedMachineId: string
  assignedOperator: string
}

export interface ProximityHazard {
  id: string
  type: 'Personnel (Worker)' | 'Heavy Equipment' | 'Trench / Drop-off' | 'Underground Utility' | 'Structure'
  distanceMeters: number
  angleDeg: number // 0 = front, 90 = right, 180 = rear, 270 = left
  dangerLevel: 'CRITICAL' | 'WARNING' | 'MONITORING'
  timestamp: string
}

export interface IncidentReport {
  id: string
  timestamp: string
  machineId: string
  operatorId: string
  incidentType: 'Near Miss - Proximity' | 'Unbuckled Operation' | 'Excessive Idle Event' | 'Ground Collapse Warning' | 'Attachment Collision'
  severity: 'Low' | 'Medium' | 'High' | 'Severe'
  groundCondition: 'Muddy / Unstable' | 'Rocky' | 'Compacted Earth' | 'Paved / Concrete' | 'Wet Clay'
  weather: string
  description: string
  telemetrySnapshot: {
    engineHours: number
    seatbelt: string
    fuelLevel: number
    engineRpm: number
  }
  status: 'Logged' | 'Under Review' | 'Resolved'
}

export interface TrainingModule {
  id: string
  title: string
  durationMin: number
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  category: 'Safety' | 'Efficiency' | 'CAT Technology' | 'Maintenance'
  thumbnail: string
  description: string
  completed: boolean
  progressPct: number
  keyLearnings: string[]
}

export interface PreCheckItem {
  id: string
  area: 'Engine Bay' | 'Hydraulics' | 'Tracks & Undercarriage' | 'Cab & Controls' | 'Work Tool / Bucket'
  title: string
  description: string
  passed: boolean | null
  critical: boolean
}
