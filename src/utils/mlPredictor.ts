export interface MLPredictionInput {
  taskType: 'Earth Excavation' | 'Trenching' | 'Material Loading' | 'Grading' | 'Demolition'
  weather: 'Sunny' | 'Rainy' | 'Cloudy' | 'Windy'
  operatorSkill: 'Expert' | 'Intermediate' | 'Beginner'
  machineAgeYrs: number
  targetVolumeTons?: number
}

export interface MLPredictionOutput {
  baseEstimateMin: number
  predictedTimeMin: number
  variancePct: number
  confidenceInterval: {
    min: number
    max: number
  }
  factors: {
    weatherImpactMin: number
    weatherImpactPct: number
    skillImpactMin: number
    skillImpactPct: number
    machineAgeImpactMin: number
    machineAgeImpactPct: number
  }
  recommendations: string[]
  efficiencyScore: number // 100 is benchmark, >100 faster, <100 slower
}

// Baseline expected time for nominal standard run (Sunny, Intermediate, 3yr machine)
const TASK_BASELINES: Record<string, number> = {
  'Earth Excavation': 60,
  'Trenching': 45,
  'Material Loading': 30,
  'Grading': 35,
  'Demolition': 90
}

const WEATHER_COEFFICIENTS: Record<string, number> = {
  'Sunny': -0.04,   // 4% faster due to high traction and optimal visibility
  'Cloudy': 0.02,   // 2% nominal delay
  'Rainy': 0.16,    // 16% delay due to mud, slip, water pumping, trench instability
  'Windy': 0.14     // 14% delay due to dust, boom stability, wind resistance
}

const SKILL_COEFFICIENTS: Record<string, number> = {
  'Expert': -0.06,      // 6% faster (smooth hydraulic transitions, zero rework)
  'Intermediate': 0.03, // 3% slight variance
  'Beginner': 0.32      // 32% slower (longer cycle times, hesitations, repositioning)
}

export function predictTaskDuration(input: MLPredictionInput): MLPredictionOutput {
  const base = TASK_BASELINES[input.taskType] || 45

  const weatherFactor = WEATHER_COEFFICIENTS[input.weather] || 0
  const skillFactor = SKILL_COEFFICIENTS[input.operatorSkill] || 0
  
  // Machine age wear: +1.8% per year over 2 years
  const ageOverBaseline = Math.max(0, input.machineAgeYrs - 2)
  const ageFactor = ageOverBaseline * 0.018

  const weatherImpactMin = Math.round(base * weatherFactor * 10) / 10
  const skillImpactMin = Math.round(base * skillFactor * 10) / 10
  const ageImpactMin = Math.round(base * ageFactor * 10) / 10

  const totalMultiplier = 1 + weatherFactor + skillFactor + ageFactor
  const predicted = Math.round(base * totalMultiplier)

  // Confidence margin based on weather and age risk
  const uncertainty = Math.max(3, Math.round(predicted * (input.weather === 'Rainy' || input.weather === 'Windy' ? 0.08 : 0.04)))

  const recommendations: string[] = []

  if (input.weather === 'Rainy') {
    recommendations.push('Wet soil detected: Reduce trench bench slope by 5° to prevent wall cave-ins.')
    recommendations.push('Engage heavy-lift hydraulic mode for sticky clay spoil removal.')
  } else if (input.weather === 'Windy') {
    recommendations.push('Wind gusts detected: Lower maximum boom elevation when swinging near structures.')
  }

  if (input.operatorSkill === 'Beginner') {
    recommendations.push('Smart Companion Recommendation: Activate CAT Grade Assist with Auto-Stop to prevent over-digging.')
    recommendations.push('Book a 15-min interactive micro-module on cycle time optimization.')
  } else if (input.operatorSkill === 'Expert') {
    recommendations.push('Operator certified for High-Speed ECO mode. Potential fuel savings: 12%.')
  }

  if (input.machineAgeYrs >= 5) {
    recommendations.push(`Machine age (${input.machineAgeYrs} yrs): Monitor hydraulic pump temperature under sustained high-load cycles.`)
  }

  const variancePct = Math.round(((predicted - base) / base) * 100)
  const efficiencyScore = Math.max(40, Math.min(130, Math.round((base / predicted) * 100)))

  return {
    baseEstimateMin: base,
    predictedTimeMin: predicted,
    variancePct,
    confidenceInterval: {
      min: Math.max(10, predicted - uncertainty),
      max: predicted + uncertainty
    },
    factors: {
      weatherImpactMin,
      weatherImpactPct: Math.round(weatherFactor * 100),
      skillImpactMin,
      skillImpactPct: Math.round(skillFactor * 100),
      machineAgeImpactMin: ageImpactMin,
      machineAgeImpactPct: Math.round(ageFactor * 100)
    },
    recommendations,
    efficiencyScore
  }
}

// Validation against Image 2 ground truth
export const MODEL_VALIDATION = [
  { taskId: 'T001', type: 'Earth Excavation', weather: 'Sunny', skill: 'Expert', age: 2, estimated: 60, actual: 58, predicted: 54, accuracy: '93%' },
  { taskId: 'T002', type: 'Trenching', weather: 'Rainy', skill: 'Intermediate', age: 4, estimated: 45, actual: 52, predicted: 55, accuracy: '95%' },
  { taskId: 'T003', type: 'Material Loading', weather: 'Cloudy', skill: 'Beginner', age: 3, estimated: 30, actual: 42, predicted: 41, accuracy: '98%' },
  { taskId: 'T004', type: 'Grading', weather: 'Sunny', skill: 'Expert', age: 5, estimated: 35, actual: 33, predicted: 33, accuracy: '100%' },
  { taskId: 'T005', type: 'Demolition', weather: 'Windy', skill: 'Intermediate', age: 6, estimated: 90, actual: 105, predicted: 112, accuracy: '94%' }
]
