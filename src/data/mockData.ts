import { CatMachine, TelemetryRecord, TaskRecord, ProximityHazard, IncidentReport, TrainingModule, PreCheckItem } from '../types'

export const CAT_MACHINES: CatMachine[] = [
  {
    id: 'EXC001',
    model: 'CAT 336 Next Gen',
    name: 'Hydraulic Excavator',
    type: 'excavator',
    category: 'Excavation & Trenching',
    operatingWeight: '37,200 kg',
    powerHp: 314,
    fuelCapacityL: 600,
    standardFuelBurnLph: 24.5,
    currentEngineHours: 1530.2,
    fuelLevelPct: 78,
    hydraulicTempC: 68,
    engineRpm: 1850,
    primaryAttachment: '2.4 m³ Heavy Duty Digging Bucket',
    ageYears: 2,
    status: 'active'
  },
  {
    id: 'WLD002',
    model: 'CAT 966 XE',
    name: 'Medium Wheel Loader',
    type: 'wheel_loader',
    category: 'Material Handling & Loading',
    operatingWeight: '23,200 kg',
    powerHp: 321,
    fuelCapacityL: 310,
    standardFuelBurnLph: 19.8,
    currentEngineHours: 2145.0,
    fuelLevelPct: 64,
    hydraulicTempC: 72,
    engineRpm: 1600,
    primaryAttachment: '4.2 m³ Performance Series Bucket',
    ageYears: 3,
    status: 'active'
  },
  {
    id: 'DOZ003',
    model: 'CAT D6 XE Electric Drive',
    name: 'Track-Type Tractor (Dozer)',
    type: 'dozer',
    category: 'Grading & Heavy Earthmoving',
    operatingWeight: '22,700 kg',
    powerHp: 215,
    fuelCapacityL: 341,
    standardFuelBurnLph: 17.2,
    currentEngineHours: 3410.6,
    fuelLevelPct: 82,
    hydraulicTempC: 64,
    engineRpm: 1700,
    primaryAttachment: 'Semi-Universal (SU) Blade with Cat GRADE 3D',
    ageYears: 5,
    status: 'active'
  },
  {
    id: 'ADU004',
    model: 'CAT 745',
    name: 'Articulated Haul Truck',
    type: 'articulated_truck',
    category: 'Off-Highway Hauling',
    operatingWeight: '33,400 kg (Empty) / 74,400 kg (Loaded)',
    powerHp: 504,
    fuelCapacityL: 550,
    standardFuelBurnLph: 28.0,
    currentEngineHours: 4210.8,
    fuelLevelPct: 52,
    hydraulicTempC: 75,
    engineRpm: 1900,
    primaryAttachment: '25 m³ Dual Slope Heavy Dump Body',
    ageYears: 6,
    status: 'idling'
  },
  {
    id: 'GRD005',
    model: 'CAT 140 Motor Grader',
    name: 'All-Wheel Drive Grader',
    type: 'motor_grader',
    category: 'Precision Grading & Roadworks',
    operatingWeight: '19,300 kg',
    powerHp: 250,
    fuelCapacityL: 394,
    standardFuelBurnLph: 16.5,
    currentEngineHours: 1890.4,
    fuelLevelPct: 88,
    hydraulicTempC: 62,
    engineRpm: 1550,
    primaryAttachment: '14 ft (4.2 m) Heavy Duty Moldboard',
    ageYears: 4,
    status: 'active'
  }
]

// Dataset from Challenge Sheet Image 1
export const PROMPT_TELEMETRY_DATA: TelemetryRecord[] = [
  {
    timestamp: '2025-05-01 08:00:00',
    machineId: 'EXC001',
    operatorId: 'OP1001',
    engineHours: 1523.5,
    fuelUsedL: 5.2,
    loadCycles: 12,
    idlingTimeMin: 30,
    seatbeltStatus: 'Fastened',
    safetyAlertTriggered: 'No',
    engineRpm: 1800,
    hydraulicPressurePsi: 4500,
    speedKmh: 2.1
  },
  {
    timestamp: '2025-05-01 10:00:00',
    machineId: 'EXC001',
    operatorId: 'OP1001',
    engineHours: 1524.8,
    fuelUsedL: 3.8,
    loadCycles: 2,
    idlingTimeMin: 55,
    seatbeltStatus: 'Unfastened',
    safetyAlertTriggered: 'Yes',
    engineRpm: 950,
    hydraulicPressurePsi: 1200,
    speedKmh: 0.0
  },
  {
    timestamp: '2025-05-01 14:00:00',
    machineId: 'EXC001',
    operatorId: 'OP1001',
    engineHours: 1526.5,
    fuelUsedL: 6.1,
    loadCycles: 10,
    idlingTimeMin: 15,
    seatbeltStatus: 'Fastened',
    safetyAlertTriggered: 'No',
    engineRpm: 1850,
    hydraulicPressurePsi: 4600,
    speedKmh: 1.8
  },
  {
    timestamp: '2025-05-02 09:00:00',
    machineId: 'EXC001',
    operatorId: 'OP1001',
    engineHours: 1530.2,
    fuelUsedL: 2.0,
    loadCycles: 1,
    idlingTimeMin: 60,
    seatbeltStatus: 'Unfastened',
    safetyAlertTriggered: 'Yes',
    engineRpm: 900,
    hydraulicPressurePsi: 1100,
    speedKmh: 0.0
  }
]

// Dataset from Challenge Sheet Image 2
export const PROMPT_TASK_DATA: TaskRecord[] = [
  {
    taskId: 'T001',
    taskType: 'Earth Excavation',
    weather: 'Sunny',
    operatorSkill: 'Expert',
    machineAgeYrs: 2,
    estimatedTimeMin: 60,
    actualTimeMin: 58,
    status: 'Completed',
    priority: 'High',
    siteZone: 'Sector 4 - Foundation Pit A',
    targetVolumeTons: 120,
    completedVolumeTons: 120,
    assignedMachineId: 'EXC001',
    assignedOperator: 'Alex Mercer (OP1001)'
  },
  {
    taskId: 'T002',
    taskType: 'Trenching',
    weather: 'Rainy',
    operatorSkill: 'Intermediate',
    machineAgeYrs: 4,
    estimatedTimeMin: 45,
    actualTimeMin: 52,
    status: 'Completed',
    priority: 'Critical',
    siteZone: 'Sector 2 - Drainage Line B',
    targetVolumeTons: 85,
    completedVolumeTons: 85,
    assignedMachineId: 'EXC001',
    assignedOperator: 'Alex Mercer (OP1001)'
  },
  {
    taskId: 'T003',
    taskType: 'Material Loading',
    weather: 'Cloudy',
    operatorSkill: 'Beginner',
    machineAgeYrs: 3,
    estimatedTimeMin: 30,
    actualTimeMin: 42,
    status: 'In Progress',
    priority: 'High',
    siteZone: 'Quarry Pit 1 - Stockpile 3',
    targetVolumeTons: 60,
    completedVolumeTons: 38,
    assignedMachineId: 'WLD002',
    assignedOperator: 'Sam Rivera (OP1045)'
  },
  {
    taskId: 'T004',
    taskType: 'Grading',
    weather: 'Sunny',
    operatorSkill: 'Expert',
    machineAgeYrs: 5,
    estimatedTimeMin: 35,
    actualTimeMin: 33,
    status: 'Scheduled',
    priority: 'Medium',
    siteZone: 'North Access Road Corridor',
    targetVolumeTons: 40,
    completedVolumeTons: 0,
    assignedMachineId: 'DOZ003',
    assignedOperator: 'Marcus Vance (OP1012)'
  },
  {
    taskId: 'T005',
    taskType: 'Demolition',
    weather: 'Windy',
    operatorSkill: 'Intermediate',
    machineAgeYrs: 6,
    estimatedTimeMin: 90,
    actualTimeMin: 105,
    status: 'Scheduled',
    priority: 'Critical',
    siteZone: 'Building 7 - Concrete Core',
    targetVolumeTons: 150,
    completedVolumeTons: 0,
    assignedMachineId: 'ADU004',
    assignedOperator: 'David Chen (OP1089)'
  }
]

export const INITIAL_HAZARDS: ProximityHazard[] = [
  {
    id: 'HAZ-01',
    type: 'Personnel (Worker)',
    distanceMeters: 2.8,
    angleDeg: 145, // Rear right blind spot
    dangerLevel: 'CRITICAL',
    timestamp: 'Just now'
  },
  {
    id: 'HAZ-02',
    type: 'Underground Utility',
    distanceMeters: 4.5,
    angleDeg: 30, // Front right
    dangerLevel: 'WARNING',
    timestamp: '2 min ago'
  },
  {
    id: 'HAZ-03',
    type: 'Trench / Drop-off',
    distanceMeters: 6.2,
    angleDeg: 280, // Left flank
    dangerLevel: 'MONITORING',
    timestamp: '5 min ago'
  }
]

export const INITIAL_INCIDENTS: IncidentReport[] = [
  {
    id: 'INC-2025-089',
    timestamp: '2025-05-01 10:02:15',
    machineId: 'EXC001',
    operatorId: 'OP1001',
    incidentType: 'Unbuckled Operation',
    severity: 'High',
    groundCondition: 'Compacted Earth',
    weather: 'Sunny (31°C)',
    description: 'Operator unlatched seatbelt while machine engine was running at 950 RPM during idle standby. Safety audio alarm triggered.',
    telemetrySnapshot: {
      engineHours: 1524.8,
      seatbelt: 'Unfastened',
      fuelLevel: 78,
      engineRpm: 950
    },
    status: 'Logged'
  },
  {
    id: 'INC-2025-084',
    timestamp: '2025-04-29 14:22:00',
    machineId: 'EXC001',
    operatorId: 'OP1001',
    incidentType: 'Near Miss - Proximity',
    severity: 'High',
    groundCondition: 'Muddy / Unstable',
    weather: 'Rainy (18°C)',
    description: 'Ground surveyor entered rear swing radius (2.4m) without radio clearance. Automatic proximity interlock engaged.',
    telemetrySnapshot: {
      engineHours: 1518.2,
      seatbelt: 'Fastened',
      fuelLevel: 62,
      engineRpm: 1800
    },
    status: 'Resolved'
  }
]

export const PRE_CHECK_ITEMS: PreCheckItem[] = [
  {
    id: 'CHK-01',
    area: 'Engine Bay',
    title: 'Engine Oil & Coolant Level',
    description: 'Verify oil dipstick reads between MIN/MAX. Check radiator coolant level in reservoir.',
    passed: true,
    critical: true
  },
  {
    id: 'CHK-02',
    area: 'Hydraulics',
    title: 'Hydraulic Hoses & Cylinders',
    description: 'Inspect boom, stick, and bucket cylinders for weeping, pin wear, and hose chafing.',
    passed: true,
    critical: true
  },
  {
    id: 'CHK-03',
    area: 'Cab & Controls',
    title: 'Operator Seatbelt & Retractor Mechanism',
    description: 'Inspect seatbelt webbing for cuts/fraying, verify buckle clicks and locks securely under tension.',
    passed: false,
    critical: true
  },
  {
    id: 'CHK-04',
    area: 'Tracks & Undercarriage',
    title: 'Track Sag Tension & Sprocket Teeth',
    description: 'Measure track sag between carrier roller and front idler (nominal 45-55 mm).',
    passed: null,
    critical: false
  },
  {
    id: 'CHK-05',
    area: 'Work Tool / Bucket',
    title: 'Quick Coupler Wedge & Bucket Teeth Locking',
    description: 'Verify safety lock pin engaged. Confirm bucket teeth tips have >30% service wear remaining.',
    passed: null,
    critical: true
  }
]

export const TRAINING_MODULES: TrainingModule[] = [
  {
    id: 'TRN-101',
    title: 'Caterpillar Grade 3D Automation & Elevation Guidance',
    durationMin: 18,
    level: 'Intermediate',
    category: 'CAT Technology',
    thumbnail: 'https://images.unsplash.com/photo-1579847188804-ecba0e2ea330?auto=format&fit=crop&w=600&q=80',
    description: 'Master in-cab touchscreens to hit grade 45% faster with zero grade stakes using automated boom & bucket guidance.',
    completed: true,
    progressPct: 100,
    keyLearnings: [
      'Setting bench height reference in CAT Grade display',
      'Using automatic bucket hold to maintain trench slopes',
      'Preventing over-excavation to save backfill costs'
    ]
  },
  {
    id: 'TRN-102',
    title: 'Eco-Operating: Zero-Waste Idling & Hydraulic Throttling',
    durationMin: 12,
    level: 'Beginner',
    category: 'Efficiency',
    thumbnail: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80',
    description: 'Techniques to prevent idling over 5 minutes, saving up to 15% in daily diesel consumption and prolonging DPF filter life.',
    completed: false,
    progressPct: 60,
    keyLearnings: [
      'Understanding CAT Auto-Idle (delays down to 1000 RPM)',
      'Activating Engine Auto-Shutdown timer during haul delays',
      'Matching hydraulic power mode to material density'
    ]
  },
  {
    id: 'TRN-103',
    title: '360° Proximity Safety & Ground Worker Exclusion Zones',
    durationMin: 15,
    level: 'Advanced',
    category: 'Safety',
    thumbnail: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
    description: 'Detecting ground personnel in blind spots, responding to proximity radar sirens, and blind-spot camera interpretation.',
    completed: false,
    progressPct: 20,
    keyLearnings: [
      'Managing 12-meter high-risk swing exclusion radii',
      'Responding to in-cab proximity alerts under 3 seconds',
      'Mandatory horn signal protocol prior to track movement'
    ]
  },
  {
    id: 'TRN-104',
    title: 'Quick Coupler Interlock & Attachment Pressure Relief',
    durationMin: 10,
    level: 'Intermediate',
    category: 'Maintenance',
    thumbnail: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
    description: 'Safe attachment changeouts for breakers, augers, and tilt-rotators without hydraulic pressure spikes.',
    completed: false,
    progressPct: 0,
    keyLearnings: [
      'Relieving residual accumulator pressure in cab controls',
      'Visual verification of positive hydraulic lock engagement',
      'Testing ground push verification before hoisting'
    ]
  }
]
