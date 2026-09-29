import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { CatMachine, ProximityHazard } from '../types'
import {
  Eye,
  RotateCw,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
  AlertTriangle,
  Sun,
  CloudRain,
  Wind,
  Layers,
  Users,
  Megaphone,
  Lightbulb
} from 'lucide-react'
import { playMachineHornSound, playProximityAlertSound } from '../utils/audioAlerts'

interface MachineVisualizerProps {
  machine: CatMachine
  seatbeltFastened: boolean
  hazards: ProximityHazard[]
  onHazardClick?: (hazard: ProximityHazard) => void
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
}

type SoilType = 'sand' | 'mud' | 'rock'
type WeatherEffect = 'clear' | 'rain' | 'dust'

export const MachineVisualizer3D: React.FC<MachineVisualizerProps> = ({
  machine,
  seatbeltFastened,
  hazards,
  soundEnabled,
  setSoundEnabled
}) => {
  const mountRef = useRef<HTMLDivElement>(null)
  const [motionMode, setMotionMode] = useState<'working' | 'traveling' | 'idle' | 'stopped'>('working')
  const [viewPreset, setViewPreset] = useState<'orbit' | 'top' | 'cab' | 'side'>('orbit')
  const [activeSpeed, setActiveSpeed] = useState<number>(1)
  const [soilType, setSoilType] = useState<SoilType>('sand')
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffect>('clear')
  const [lightsOn, setLightsOn] = useState<boolean>(true)
  const [workerInDanger, setWorkerInDanger] = useState<boolean>(false)

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const machineGroupRef = useRef<THREE.Group | null>(null)
  const animatedPartsRef = useRef<Record<string, THREE.Object3D>>({})
  const radarSweepRef = useRef<THREE.Mesh | null>(null)
  const hazardMarkersRef = useRef<THREE.Group | null>(null)
  const seatbeltBeaconRef = useRef<THREE.Mesh | null>(null)
  const soilMoundRef = useRef<THREE.Group | null>(null)
  const workersGroupRef = useRef<THREE.Group | null>(null)
  const workerMeshesRef = useRef<{ worker1: THREE.Group | null; worker2: THREE.Group | null }>({ worker1: null, worker2: null })
  const particlesRef = useRef<THREE.Points | null>(null)
  const dirtSpillRef = useRef<THREE.Points | null>(null)
  const workLightsRef = useRef<THREE.SpotLight[]>([])
  const groundPadRef = useRef<THREE.Mesh | null>(null)

  const animationFrameId = useRef<number | null>(null)
  const isDragging = useRef<boolean>(false)
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const cameraAngle = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 5,
    radius: 18
  })

  // Colors
  const CAT_YELLOW = 0xffcd11
  const CAT_BLACK = 0x181818
  const CAT_GREY = 0x3a3a3a
  const CHROME = 0xcccccc
  const GLASS = 0x334455

  // Soil colors
  const SOIL_COLORS: Record<SoilType, { pad: number; mound: number; roughness: number }> = {
    sand: { pad: 0x8a6e45, mound: 0xc49e62, roughness: 0.85 },
    mud: { pad: 0x2e2319, mound: 0x3d2c1e, roughness: 0.3 }, // shiny slick mud
    rock: { pad: 0x4a4744, mound: 0x6e6b66, roughness: 0.95 }
  }

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth
    const height = mount.clientHeight

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0x0e1117)
    scene.fog = new THREE.FogExp2(0x0e1117, 0.022)

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    cameraRef.current = camera
    updateCameraPosition()

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    rendererRef.current = renderer
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfff3db, 2.3)
    sunLight.position.set(16, 26, 16)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 1024
    sunLight.shadow.mapSize.height = 1024
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 60
    sunLight.shadow.camera.left = -16
    sunLight.shadow.camera.right = 16
    sunLight.shadow.camera.top = 16
    sunLight.shadow.camera.bottom = -16
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x00d4ff, 0.75)
    rimLight.position.set(-16, 12, -16)
    scene.add(rimLight)

    // Work Headlights (Toggleable)
    createWorkHeadlights(scene)

    // Ground Construction Soil Pad & Trench Pit
    createGroundAndSoils(scene, soilType)

    // Soil / Sand Stockpiles & Safety Cones
    createSoilPilesAndCones(scene)

    // 3D Construction Workers (Personnel)
    createWorkers(scene)

    // Weather / Dust / Rain Particle System
    createParticleSystem(scene, weatherEffect)

    // Dynamic Dirt Falling from Bucket
    createDirtSpillSystem(scene)

    // Proximity Radar Ring Plane
    createRadarPlane(scene)

    // Build the 3D Machine Model based on machine type
    buildMachineModel(scene, machine.type)

    // Build Hazard Markers Group
    const hazardGroup = new THREE.Group()
    hazardMarkersRef.current = hazardGroup
    scene.add(hazardGroup)
    updateHazardMarkers(hazards)

    // Mouse Interaction for Orbiting
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true
      prevMousePos.current = { x: e.clientX, y: e.clientY }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - prevMousePos.current.x
      const dy = e.clientY - prevMousePos.current.y
      prevMousePos.current = { x: e.clientX, y: e.clientY }

      cameraAngle.current.theta -= dx * 0.008
      cameraAngle.current.phi = Math.max(0.1, Math.min(Math.PI / 2.2, cameraAngle.current.phi + dy * 0.008))
      updateCameraPosition()
    }

    const onMouseUp = () => {
      isDragging.current = false
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      cameraAngle.current.radius = Math.max(8, Math.min(34, cameraAngle.current.radius + e.deltaY * 0.02))
      updateCameraPosition()
    }

    mount.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    mount.addEventListener('wheel', onWheel, { passive: false })

    // Resize Handler
    const onResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return
      const w = mountRef.current.clientWidth
      const h = mountRef.current.clientHeight
      cameraRef.current.aspect = w / h
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // Animation Loop
    let clock = new THREE.Clock()
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate)
      const elapsed = clock.getElapsedTime()
      const speed = activeSpeed

      // Animate Radar Sweep Line
      if (radarSweepRef.current) {
        radarSweepRef.current.rotation.z = -elapsed * 1.5
      }

      // Animate Seatbelt warning beacon
      if (seatbeltBeaconRef.current) {
        if (!seatbeltFastened) {
          seatbeltBeaconRef.current.visible = true
          const pulse = (Math.sin(elapsed * 10) + 1) * 0.5
          ;(seatbeltBeaconRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + pulse * 0.7
          seatbeltBeaconRef.current.scale.setScalar(1 + pulse * 0.4)
        } else {
          seatbeltBeaconRef.current.visible = false
        }
      }

      // Animate Worker 1 Walking / Moving
      animateWorkers(elapsed)

      // Animate Weather / Dust / Rain particles
      animateParticles(elapsed)

      // Animate Dirt fall from bucket
      animateDirtSpill(elapsed)

      // Animate Machine Mechanics
      animateMachine(elapsed, speed)

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    animate()

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
      mount.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      mount.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', onResize)
      if (rendererRef.current?.domElement) {
        mount.removeChild(rendererRef.current.domElement)
      }
      renderer.dispose()
    }
  }, [machine.type])

  // Update Hazard pins when hazards prop changes
  useEffect(() => {
    updateHazardMarkers(hazards)
  }, [hazards])

  // Update Soil material colors
  useEffect(() => {
    if (groundPadRef.current) {
      const colors = SOIL_COLORS[soilType]
      const mat = groundPadRef.current.material as THREE.MeshStandardMaterial
      mat.color.setHex(colors.pad)
      mat.roughness = colors.roughness
    }
    if (soilMoundRef.current) {
      const colors = SOIL_COLORS[soilType]
      soilMoundRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial
          if (mat && mat.color) {
            mat.color.setHex(colors.mound)
            mat.roughness = colors.roughness
          }
        }
      })
    }
  }, [soilType])

  // Update weather particles
  useEffect(() => {
    if (sceneRef.current) {
      createParticleSystem(sceneRef.current, weatherEffect)
    }
  }, [weatherEffect])

  // Toggle headlights
  useEffect(() => {
    workLightsRef.current.forEach((light) => {
      light.intensity = lightsOn ? 2.5 : 0.0
    })
  }, [lightsOn])

  // Update view preset
  useEffect(() => {
    if (viewPreset === 'orbit') {
      cameraAngle.current = { theta: Math.PI / 4, phi: Math.PI / 5, radius: 18 }
    } else if (viewPreset === 'top') {
      cameraAngle.current = { theta: 0, phi: 0.05, radius: 24 }
    } else if (viewPreset === 'side') {
      cameraAngle.current = { theta: Math.PI / 2, phi: Math.PI / 6, radius: 16 }
    } else if (viewPreset === 'cab') {
      cameraAngle.current = { theta: Math.PI / 1.1, phi: Math.PI / 4, radius: 10 }
    }
    updateCameraPosition()
  }, [viewPreset])

  const updateCameraPosition = () => {
    if (!cameraRef.current) return
    const { theta, phi, radius } = cameraAngle.current
    const x = radius * Math.sin(phi) * Math.sin(theta)
    const y = radius * Math.cos(phi) + 2
    const z = radius * Math.sin(phi) * Math.cos(theta)
    cameraRef.current.position.set(x, y, z)
    cameraRef.current.lookAt(0, 2.5, 0)
  }

  // Work Floodlights on boom & cab
  const createWorkHeadlights = (scene: THREE.Scene) => {
    workLightsRef.current = []
    const spot1 = new THREE.SpotLight(0xffeedd, 2.5, 25, Math.PI / 5, 0.4)
    spot1.position.set(0, 5, 2)
    spot1.target.position.set(0, 0, 7)
    scene.add(spot1)
    scene.add(spot1.target)
    workLightsRef.current.push(spot1)

    const spot2 = new THREE.SpotLight(0xfff0cc, 2.0, 20, Math.PI / 4, 0.5)
    spot2.position.set(-1, 3.5, 1)
    spot2.target.position.set(-3, 0, 5)
    scene.add(spot2)
    scene.add(spot2.target)
    workLightsRef.current.push(spot2)
  }

  // Ground Construction Soil Pad & Trench Pit
  const createGroundAndSoils = (scene: THREE.Scene, type: SoilType) => {
    const colors = SOIL_COLORS[type]

    // Main Excavation Ground Pad
    const padGeo = new THREE.CylinderGeometry(15, 16, 0.5, 36)
    const padMat = new THREE.MeshStandardMaterial({
      color: colors.pad,
      roughness: colors.roughness,
      metalness: 0.1
    })
    const pad = new THREE.Mesh(padGeo, padMat)
    pad.position.y = -0.25
    pad.receiveShadow = true
    groundPadRef.current = pad
    scene.add(pad)

    // Site Grid lines
    const grid = new THREE.GridHelper(32, 32, 0xffcd11, 0x333333)
    grid.position.y = 0.01
    scene.add(grid)

    // Excavation Trench Cutout Pit in front of machine
    const trenchMat = new THREE.MeshStandardMaterial({ color: 0x1b140d, roughness: 0.9 })
    const trench = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.6, 6.0), trenchMat)
    trench.position.set(0, -0.28, 4.5)
    scene.add(trench)

    // Trench Edge safety warning barrier
    const trenchLip = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.1, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x221105 })
    )
    trenchLip.position.set(0, 0.05, 1.5)
    scene.add(trenchLip)
  }

  // Soil Stockpiles, Sand Mounds & Traffic Cones
  const createSoilPilesAndCones = (scene: THREE.Scene) => {
    const moundGroup = new THREE.Group()
    soilMoundRef.current = moundGroup
    const colors = SOIL_COLORS[soilType]

    const moundMat = new THREE.MeshStandardMaterial({
      color: colors.mound,
      roughness: colors.roughness
    })

    // Large Excavated Dirt Stockpile (Left rear)
    const pile1 = new THREE.Mesh(new THREE.ConeGeometry(3.5, 2.2, 16), moundMat)
    pile1.position.set(-6.5, 1.1, -3.5)
    pile1.castShadow = true
    pile1.receiveShadow = true
    moundGroup.add(pile1)

    // Secondary Sand Spoil Mound (Right front)
    const pile2 = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.6, 14), moundMat)
    pile2.position.set(6.0, 0.8, 3.0)
    pile2.castShadow = true
    pile2.receiveShadow = true
    moundGroup.add(pile2)

    // Small gravel heaps near trench
    for (let i = 0; i < 4; i++) {
      const smallHeap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.3), moundMat)
      smallHeap.position.set(-3.5 + i * 2.2, 0.3, 7.2)
      smallHeap.castShadow = true
      moundGroup.add(smallHeap)
    }

    // Safety Traffic Cones around perimeter
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff4400, roughness: 0.4 })
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const conePositions = [
      [3.0, 0.35, -4.5],
      [-3.0, 0.35, -4.5],
      [5.5, 0.35, -1.0],
      [-5.5, 0.35, -1.0],
      [3.8, 0.35, 6.5],
      [-3.8, 0.35, 6.5]
    ]

    conePositions.forEach((pos) => {
      const coneHolder = new THREE.Group()
      coneHolder.position.set(pos[0], pos[1], pos[2])

      const coneBody = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.7, 12), coneMat)
      coneHolder.add(coneBody)

      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.15, 12), stripeMat)
      stripe.position.y = 0.05
      coneHolder.add(stripe)

      const base = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.35), coneMat)
      base.position.y = -0.33
      coneHolder.add(base)

      moundGroup.add(coneHolder)
    })

    scene.add(moundGroup)
  }

  // 3D Stylized Construction Workers (Personnel)
  const createWorkers = (scene: THREE.Scene) => {
    const workersGroup = new THREE.Group()
    workersGroupRef.current = workersGroup

    // Worker 1: Ground Surveyor (Dave) - starts at rear right
    const worker1 = createWorkerFigure(0xff6600, 'Surveyor Dave')
    worker1.position.set(4.5, 0, -3.2)
    workerMeshesRef.current.worker1 = worker1
    workersGroup.add(worker1)

    // Worker 2: Trench Banksman / Spotter (Carlos) - stands near right trench edge
    const worker2 = createWorkerFigure(0xffee00, 'Spotter Carlos')
    worker2.position.set(-4.0, 0, 3.8)
    workerMeshesRef.current.worker2 = worker2
    workersGroup.add(worker2)

    scene.add(workersGroup)
  }

  // Create a 3D stylized human worker figure
  const createWorkerFigure = (vestColorHex: number, name: string) => {
    const worker = new THREE.Group()

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 }) // Dark blue work pants
    const vestMat = new THREE.MeshStandardMaterial({ color: vestColorHex, roughness: 0.3 }) // High-vis vest
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd2a679, roughness: 0.6 })
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 }) // White hardhat
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xcccccc })

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.18), bodyMat)
    leftLeg.position.set(-0.12, 0.35, 0)
    worker.add(leftLeg)

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.7, 0.18), bodyMat)
    rightLeg.position.set(0.12, 0.35, 0)
    worker.add(rightLeg)

    // Torso with High-Vis Safety Vest
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.55, 0.26), vestMat)
    torso.position.set(0, 0.95, 0)
    torso.castShadow = true
    worker.add(torso)

    // Reflective Vest Stripes
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.27), stripeMat)
    stripe.position.set(0, 0.95, 0)
    worker.add(stripe)

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), skinMat)
    head.position.set(0, 1.34, 0)
    worker.add(head)

    // Hard Hat
    const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16), helmetMat)
    helmet.position.set(0, 1.44, 0)
    worker.add(helmet)

    const helmetBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.03, 16), helmetMat)
    helmetBrim.position.set(0, 1.4, 0.03)
    worker.add(helmetBrim)

    // Arms with Safety Clipboard / Radio
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), vestMat)
    leftArm.position.set(-0.28, 0.92, 0)
    worker.add(leftArm)

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), vestMat)
    rightArm.position.set(0.28, 0.92, 0.08)
    rightArm.rotation.x = -Math.PI / 4
    worker.add(rightArm)

    // Floating Hazard Indicator / Name Tag Sphere
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xff3300 })
    )
    beacon.position.set(0, 1.7, 0)
    worker.add(beacon)

    return worker
  }

  // Particle System (Dust, Rain, Clear)
  const createParticleSystem = (scene: THREE.Scene, effect: WeatherEffect) => {
    if (particlesRef.current) {
      scene.remove(particlesRef.current)
      particlesRef.current = null
    }

    if (effect === 'clear') return

    const particleCount = effect === 'rain' ? 800 : 400
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24
      positions[i * 3 + 1] = Math.random() * 12
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: effect === 'rain' ? 0x88ccff : 0xd2b48c,
      size: effect === 'rain' ? 0.12 : 0.22,
      transparent: true,
      opacity: effect === 'rain' ? 0.6 : 0.45
    })

    const points = new THREE.Points(geo, mat)
    particlesRef.current = points
    scene.add(points)
  }

  // Dynamic Dirt falling from Excavator / Loader Bucket
  const createDirtSpillSystem = (scene: THREE.Scene) => {
    const count = 60
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.8
      pos[i * 3 + 1] = -Math.random() * 2.5
      pos[i * 3 + 2] = 4.0 + (Math.random() - 0.5) * 0.8
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))

    const mat = new THREE.PointsMaterial({
      color: 0x5a3e20,
      size: 0.18,
      transparent: true,
      opacity: 0.8
    })

    const spill = new THREE.Points(geo, mat)
    dirtSpillRef.current = spill
    scene.add(spill)
  }

  // Animate dynamic dirt particles dropping
  const animateDirtSpill = (elapsed: number) => {
    if (!dirtSpillRef.current || motionMode !== 'working') {
      if (dirtSpillRef.current) dirtSpillRef.current.visible = false
      return
    }

    dirtSpillRef.current.visible = true
    const positions = dirtSpillRef.current.geometry.attributes.position.array as Float32Array
    const count = positions.length / 3

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] -= 0.08 // fall down
      if (positions[i * 3 + 1] < 0.1) {
        positions[i * 3 + 1] = 2.4 + Math.random() * 0.6
        positions[i * 3] = (Math.random() - 0.5) * 0.9
        positions[i * 3 + 2] = 4.2 + (Math.random() - 0.5) * 0.9
      }
    }
    dirtSpillRef.current.geometry.attributes.position.needsUpdate = true
  }

  // Animate falling rain or swirling dust
  const animateParticles = (elapsed: number) => {
    if (!particlesRef.current) return
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array
    const count = pos.length / 3

    for (let i = 0; i < count; i++) {
      if (weatherEffect === 'rain') {
        pos[i * 3 + 1] -= 0.35 // Fast rain drop
        if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 12
      } else {
        // Swirling dust
        pos[i * 3] += Math.sin(elapsed + i) * 0.03
        pos[i * 3 + 2] += 0.04
        if (pos[i * 3 + 2] > 12) pos[i * 3 + 2] = -12
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  }

  // Animate Worker 1 Walking into/out of danger zone
  const animateWorkers = (elapsed: number) => {
    const w1 = workerMeshesRef.current.worker1
    if (w1) {
      if (workerInDanger) {
        // Walk right into the 2.2m danger zone near rear tracks
        w1.position.x = 2.0 + Math.sin(elapsed * 2) * 0.2
        w1.position.z = -1.8
      } else {
        // Normal patrol path outside safe radius
        w1.position.x = 4.8 + Math.sin(elapsed * 0.8) * 0.8
        w1.position.z = -3.5 + Math.cos(elapsed * 0.8) * 0.5
      }
      w1.position.y = Math.abs(Math.sin(elapsed * 4)) * 0.06 // walking bob
    }

    const w2 = workerMeshesRef.current.worker2
    if (w2) {
      w2.rotation.y = Math.sin(elapsed * 0.5) * 0.3
    }
  }

  // Create 360° Safety Radar Rings on Ground
  const createRadarPlane = (scene: THREE.Scene) => {
    const radarGroup = new THREE.Group()

    // Safe zone ring (>6m)
    const safeRing = new THREE.RingGeometry(6.9, 7.05, 64)
    const safeMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, opacity: 0.4, transparent: true })
    const safeMesh = new THREE.Mesh(safeRing, safeMat)
    safeMesh.rotation.x = Math.PI / 2
    safeMesh.position.y = 0.03
    radarGroup.add(safeMesh)

    // Caution zone ring (4m)
    const cautionRing = new THREE.RingGeometry(4.4, 4.55, 64)
    const cautionMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, opacity: 0.6, transparent: true })
    const cautionMesh = new THREE.Mesh(cautionRing, cautionMat)
    cautionMesh.rotation.x = Math.PI / 2
    cautionMesh.position.y = 0.03
    radarGroup.add(cautionMesh)

    // Critical Danger zone ring (2.5m)
    const dangerRing = new THREE.RingGeometry(2.4, 2.55, 64)
    const dangerMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, opacity: 0.8, transparent: true })
    const dangerMesh = new THREE.Mesh(dangerRing, dangerMat)
    dangerMesh.rotation.x = Math.PI / 2
    dangerMesh.position.y = 0.03
    radarGroup.add(dangerMesh)

    // Animated rotating radar sweep sector
    const sweepGeo = new THREE.CircleGeometry(7, 32, 0, Math.PI / 3)
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0xffcd11,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    })
    const sweep = new THREE.Mesh(sweepGeo, sweepMat)
    sweep.rotation.x = Math.PI / 2
    sweep.position.y = 0.04
    radarSweepRef.current = sweep
    radarGroup.add(sweep)

    scene.add(radarGroup)
  }

  // Build Procedural 3D CAT Machine
  const buildMachineModel = (scene: THREE.Scene, type: string) => {
    if (machineGroupRef.current) {
      scene.remove(machineGroupRef.current)
    }

    const root = new THREE.Group()
    machineGroupRef.current = root
    animatedPartsRef.current = {}

    const yellowMat = new THREE.MeshStandardMaterial({ color: CAT_YELLOW, roughness: 0.35, metalness: 0.4 })
    const blackMat = new THREE.MeshStandardMaterial({ color: CAT_BLACK, roughness: 0.8, metalness: 0.2 })
    const greyMat = new THREE.MeshStandardMaterial({ color: CAT_GREY, roughness: 0.5, metalness: 0.5 })
    const chromeMat = new THREE.MeshStandardMaterial({ color: CHROME, roughness: 0.2, metalness: 0.85 })
    const glassMat = new THREE.MeshPhysicalMaterial({ color: GLASS, roughness: 0.1, transmission: 0.8, transparent: true, opacity: 0.7 })

    if (type === 'excavator') {
      const undercarriage = new THREE.Group()
      
      const leftTrack = createTrackAssembly(blackMat, greyMat)
      leftTrack.position.set(-1.4, 0.5, 0)
      undercarriage.add(leftTrack)

      const rightTrack = createTrackAssembly(blackMat, greyMat)
      rightTrack.position.set(1.4, 0.5, 0)
      undercarriage.add(rightTrack)

      const centerCarbody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 2.5), blackMat)
      centerCarbody.position.y = 0.6
      centerCarbody.castShadow = true
      undercarriage.add(centerCarbody)
      root.add(undercarriage)

      const upperStructure = new THREE.Group()
      upperStructure.position.y = 1.0
      animatedPartsRef.current.upperStructure = upperStructure

      const counterWeight = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.4), yellowMat)
      counterWeight.position.set(0, 0.7, -1.5)
      counterWeight.castShadow = true
      upperStructure.add(counterWeight)

      const cwStrip = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.3, 1.42), blackMat)
      cwStrip.position.set(0, 0.3, -1.5)
      upperStructure.add(cwStrip)

      const engineHood = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.8), yellowMat)
      engineHood.position.set(0.5, 0.6, 0.1)
      engineHood.castShadow = true
      upperStructure.add(engineHood)

      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8), greyMat)
      exhaust.position.set(0.8, 1.4, -0.6)
      upperStructure.add(exhaust)

      const cab = new THREE.Group()
      cab.position.set(-0.7, 0.2, 0.4)
      const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 1.4), blackMat)
      cabBody.position.y = 0.75
      cab.add(cabBody)

      const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.0), glassMat)
      frontGlass.position.set(0, 0.8, 0.71)
      cab.add(frontGlass)

      const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.8), glassMat)
      sideGlass.position.set(-0.51, 0.9, 0)
      sideGlass.rotation.y = -Math.PI / 2
      cab.add(sideGlass)

      const beaconGeo = new THREE.SphereGeometry(0.2, 16, 16)
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 })
      const beacon = new THREE.Mesh(beaconGeo, beaconMat)
      beacon.position.set(0, 0.9, 0.2)
      seatbeltBeaconRef.current = beacon
      cab.add(beacon)

      const strobe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15), new THREE.MeshBasicMaterial({ color: 0xffaa00 }))
      strobe.position.set(0, 1.55, 0)
      cab.add(strobe)

      upperStructure.add(cab)

      const boomPivot = new THREE.Group()
      boomPivot.position.set(0.2, 0.8, 0.9)
      animatedPartsRef.current.boom = boomPivot

      const boomMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 4.5), yellowMat)
      boomMesh.position.set(0, 0.6, 2.0)
      boomMesh.rotation.x = -Math.PI / 6
      boomMesh.castShadow = true
      boomPivot.add(boomMesh)

      const cylBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.2), blackMat)
      cylBase.position.set(0, 0.1, 1.0)
      cylBase.rotation.x = -Math.PI / 5
      boomPivot.add(cylBase)

      const cylRod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8), chromeMat)
      cylRod.position.set(0, 0.6, 1.8)
      cylRod.rotation.x = -Math.PI / 5
      boomPivot.add(cylRod)

      const stickPivot = new THREE.Group()
      stickPivot.position.set(0, 1.7, 3.8)
      animatedPartsRef.current.stick = stickPivot

      const stickMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 3.0), yellowMat)
      stickMesh.position.set(0, -0.6, 1.2)
      stickMesh.rotation.x = Math.PI / 4
      stickMesh.castShadow = true
      stickPivot.add(stickMesh)

      const bucketPivot = new THREE.Group()
      bucketPivot.position.set(0, -1.6, 2.2)
      animatedPartsRef.current.bucket = bucketPivot

      const bucketMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), blackMat)
      bucketMesh.castShadow = true
      bucketPivot.add(bucketMesh)

      for (let i = -0.35; i <= 0.35; i += 0.18) {
        const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 4), yellowMat)
        tooth.position.set(i, -0.4, 0.5)
        tooth.rotation.x = Math.PI / 2
        bucketPivot.add(tooth)
      }

      stickPivot.add(bucketPivot)
      boomPivot.add(stickPivot)
      upperStructure.add(boomPivot)
      root.add(upperStructure)

    } else if (type === 'wheel_loader') {
      const loaderChassis = new THREE.Group()
      
      const rearFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 2.8), yellowMat)
      rearFrame.position.set(0, 1.4, -1.2)
      rearFrame.castShadow = true
      loaderChassis.add(rearFrame)

      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 1.4), blackMat)
      cab.position.set(0, 2.4, -0.4)
      loaderChassis.add(cab)

      const wheels: THREE.Mesh[] = []
      const tireGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.6, 24)
      const positions = [
        [-1.3, 0.85, 1.4],
        [1.3, 0.85, 1.4],
        [-1.3, 0.85, -1.6],
        [1.3, 0.85, -1.6]
      ]
      positions.forEach((pos) => {
        const tire = new THREE.Mesh(tireGeo, blackMat)
        tire.rotation.z = Math.PI / 2
        tire.position.set(pos[0], pos[1], pos[2])
        tire.castShadow = true
        loaderChassis.add(tire)
        wheels.push(tire)
      })
      animatedPartsRef.current.wheels = { children: wheels } as unknown as THREE.Object3D

      const liftArmPivot = new THREE.Group()
      liftArmPivot.position.set(0, 1.4, 0.8)
      animatedPartsRef.current.loaderArms = liftArmPivot

      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 3.2), yellowMat)
      leftArm.position.set(-0.8, 0.2, 1.4)
      liftArmPivot.add(leftArm)

      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 3.2), yellowMat)
      rightArm.position.set(0.8, 0.2, 1.4)
      liftArmPivot.add(rightArm)

      const bucketPivot = new THREE.Group()
      bucketPivot.position.set(0, 0.2, 2.8)
      animatedPartsRef.current.loaderBucket = bucketPivot

      const bucket = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.0), blackMat)
      bucket.position.set(0, 0.2, 0.3)
      bucketPivot.add(bucket)
      liftArmPivot.add(bucketPivot)

      loaderChassis.add(liftArmPivot)
      root.add(loaderChassis)

    } else {
      const dozerBody = new THREE.Group()
      
      const leftTrack = createTrackAssembly(blackMat, greyMat)
      leftTrack.position.set(-1.3, 0.5, 0)
      dozerBody.add(leftTrack)

      const rightTrack = createTrackAssembly(blackMat, greyMat)
      rightTrack.position.set(1.3, 0.5, 0)
      dozerBody.add(rightTrack)

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 3.2), yellowMat)
      body.position.set(0, 1.4, -0.2)
      body.castShadow = true
      dozerBody.add(body)

      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 1.6), blackMat)
      cab.position.set(0, 2.5, -0.5)
      dozerBody.add(cab)

      const bladePivot = new THREE.Group()
      bladePivot.position.set(0, 0.6, 1.8)
      animatedPartsRef.current.dozerBlade = bladePivot

      const blade = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 0.4), blackMat)
      blade.position.set(0, 0.2, 0.6)
      blade.castShadow = true
      bladePivot.add(blade)

      dozerBody.add(bladePivot)
      root.add(dozerBody)
    }

    scene.add(root)
  }

  const createTrackAssembly = (trackMat: THREE.Material, rollerMat: THREE.Material) => {
    const track = new THREE.Group()
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.8, 4.2), trackMat)
    belt.castShadow = true
    track.add(belt)

    for (let z = -1.6; z <= 1.6; z += 0.8) {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 16), rollerMat)
      roller.rotation.z = Math.PI / 2
      roller.position.set(0, -0.1, z)
      track.add(roller)
    }
    return track
  }

  const updateHazardMarkers = (hazardList: ProximityHazard[]) => {
    const group = hazardMarkersRef.current
    if (!group) return

    while (group.children.length > 0) {
      group.remove(group.children[0])
    }

    hazardList.forEach(haz => {
      const rad = (haz.angleDeg * Math.PI) / 180
      const x = haz.distanceMeters * Math.sin(rad)
      const z = haz.distanceMeters * Math.cos(rad)

      const pinGroup = new THREE.Group()
      pinGroup.position.set(x, 1.2, z)

      const color = haz.dangerLevel === 'CRITICAL' ? 0xef4444 : haz.dangerLevel === 'WARNING' ? 0xf59e0b : 0x10b981

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
      )
      pinGroup.add(sphere)

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      )
      stem.position.y = -0.6
      pinGroup.add(stem)

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.45, 16),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
      )
      ring.rotation.x = Math.PI / 2
      ring.position.y = -1.18
      pinGroup.add(ring)

      group.add(pinGroup)
    })
  }

  const animateMachine = (elapsed: number, speed: number) => {
    const parts = animatedPartsRef.current

    if (motionMode === 'stopped') {
      return
    }

    if (motionMode === 'idle') {
      if (machineGroupRef.current) {
        machineGroupRef.current.position.y = Math.sin(elapsed * 18) * 0.015
      }
      return
    }

    if (machine.type === 'excavator') {
      if (parts.upperStructure && parts.boom && parts.stick && parts.bucket) {
        if (motionMode === 'working') {
          const t = elapsed * 0.9 * speed
          parts.upperStructure.rotation.y = Math.sin(t * 0.5) * 0.65
          parts.boom.rotation.x = -Math.sin(t) * 0.25 - 0.1
          parts.stick.rotation.x = Math.cos(t) * 0.35 + 0.2
          parts.bucket.rotation.x = Math.sin(t + 0.5) * 0.65
        } else if (motionMode === 'traveling') {
          if (machineGroupRef.current) {
            machineGroupRef.current.position.z = Math.sin(elapsed * 1.2) * 1.5
            machineGroupRef.current.position.y = Math.abs(Math.sin(elapsed * 8)) * 0.03
          }
        }
      }
    } else if (machine.type === 'wheel_loader') {
      if (parts.loaderArms && parts.loaderBucket) {
        if (motionMode === 'working') {
          const t = elapsed * 0.8 * speed
          parts.loaderArms.rotation.x = Math.sin(t) * 0.35 - 0.1
          parts.loaderBucket.rotation.x = -Math.cos(t) * 0.45
        }
      }
    } else if (parts.dozerBlade) {
      const t = elapsed * speed
      parts.dozerBlade.rotation.x = Math.sin(t) * 0.15
      parts.dozerBlade.position.y = 0.6 + Math.sin(t * 0.8) * 0.2
    }
  }

  // Trigger Heavy In-Cab Air Horn
  const handleHonkHorn = () => {
    if (soundEnabled) {
      playMachineHornSound()
    }
  }

  // Toggle Worker into Danger Zone
  const handleToggleWorkerDanger = () => {
    const nextState = !workerInDanger
    setWorkerInDanger(nextState)
    if (nextState && soundEnabled) {
      playProximityAlertSound('CRITICAL')
    }
  }

  return (
    <div className="relative w-full h-[540px] bg-cat-darker rounded-xl overflow-hidden border border-cat-border shadow-2xl flex flex-col">
      {/* Top Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-wrap items-center justify-between px-4 py-3 bg-gradient-to-b from-cat-black/95 to-transparent backdrop-blur-xs gap-2">
        <div className="flex items-center space-x-3">
          <span className="px-2.5 py-1 text-xs font-bold rounded bg-cat-yellow text-cat-black tracking-wider uppercase flex items-center gap-1.5 shadow">
            <Sparkles className="w-3.5 h-3.5" /> 3D Digital Twin & Jobsite
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-wide">{machine.model}</span>
            <span className="text-xs text-cat-gray font-mono">{machine.name} • {machine.primaryAttachment}</span>
          </div>
        </div>

        {/* View Angle Presets */}
        <div className="flex items-center bg-cat-card/90 border border-cat-border rounded-lg p-0.5 space-x-1">
          <button
            onClick={() => setViewPreset('orbit')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              viewPreset === 'orbit' ? 'bg-cat-yellow text-cat-black font-bold shadow' : 'text-gray-300 hover:text-white'
            }`}
          >
            3D Orbit
          </button>
          <button
            onClick={() => setViewPreset('top')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              viewPreset === 'top' ? 'bg-cat-yellow text-cat-black font-bold shadow' : 'text-gray-300 hover:text-white'
            }`}
          >
            Site Radar
          </button>
          <button
            onClick={() => setViewPreset('cab')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              viewPreset === 'cab' ? 'bg-cat-yellow text-cat-black font-bold shadow' : 'text-gray-300 hover:text-white'
            }`}
          >
            In-Cab POV
          </button>
          <button
            onClick={() => setViewPreset('side')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
              viewPreset === 'side' ? 'bg-cat-yellow text-cat-black font-bold shadow' : 'text-gray-300 hover:text-white'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {/* 3D Canvas Mounting Area */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Floating Seatbelt Alert Overlay when unfastened */}
      {!seatbeltFastened && (
        <div className="absolute top-16 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-cat-danger/90 border border-red-400 text-white rounded-lg shadow-lg animate-bounce">
          <AlertTriangle className="w-5 h-5 text-white" />
          <div className="text-xs">
            <p className="font-bold uppercase tracking-wider">Seatbelt Alert</p>
            <p className="text-[11px] text-red-100">Operator unbuckled while machine active</p>
          </div>
        </div>
      )}

      {/* Ground Worker Proximity Alert Floating Pill */}
      {workerInDanger && (
        <div className="absolute top-28 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-red-600/90 border border-red-400 text-white rounded-lg shadow-xl animate-pulse">
          <Users className="w-5 h-5 text-white animate-spin" />
          <div className="text-xs font-mono">
            <p className="font-bold uppercase tracking-wider">PERSONNEL IN DANGER ZONE (&lt; 2.5M)</p>
            <p className="text-[11px] text-red-100">Surveyor Dave is within rear swing radius (2.1m)</p>
          </div>
        </div>
      )}

      {/* Proximity Hazard Mini Radar HUD Legend */}
      <div className="absolute top-16 right-4 z-10 bg-cat-black/85 backdrop-blur-md border border-cat-border rounded-lg p-3 text-xs font-mono space-y-1.5 shadow-xl">
        <div className="text-[11px] font-bold text-cat-yellow uppercase tracking-wider flex items-center justify-between gap-3">
          <span>Proximity Radar</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <span className="w-2.5 h-2.5 rounded-full bg-cat-danger" />
          <span>&lt; 2.5m Critical Zone</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <span className="w-2.5 h-2.5 rounded-full bg-cat-warning" />
          <span>2.5m - 5m Caution Zone</span>
        </div>
        <div className="flex items-center gap-2 text-gray-300">
          <span className="w-2.5 h-2.5 rounded-full bg-cat-success" />
          <span>&gt; 5m Clear Zone</span>
        </div>

        {/* Dynamic Personnel Tags */}
        <div className="pt-2 border-t border-cat-border/60 text-[10px] space-y-1">
          <div className="text-cat-yellow font-bold uppercase flex items-center gap-1">
            <Users className="w-3 h-3" /> Ground Crew on Site:
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Surveyor (Dave):</span>
            <span className={workerInDanger ? 'text-red-400 font-bold' : 'text-emerald-400'}>
              {workerInDanger ? '2.1m (Critical)' : '4.8m (Safe)'}
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Spotter (Carlos):</span>
            <span className="text-amber-400 font-bold">4.0m (Caution)</span>
          </div>
        </div>
      </div>

      {/* Interactive Environment & Jobsite Control Bar */}
      <div className="absolute bottom-12 left-0 right-0 z-10 px-4 py-1.5 bg-cat-black/80 backdrop-blur-xs border-t border-cat-border/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* Soil Condition Switcher */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] text-cat-gray uppercase flex items-center gap-1">
            <Layers className="w-3 h-3 text-cat-yellow" /> Soil:
          </span>
          <button
            onClick={() => setSoilType('sand')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              soilType === 'sand' ? 'bg-amber-600 text-white font-bold' : 'bg-cat-card text-gray-300 hover:text-white'
            }`}
          >
            Sand / Gravel
          </button>
          <button
            onClick={() => setSoilType('mud')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              soilType === 'mud' ? 'bg-yellow-950 text-amber-300 border border-amber-600 font-bold' : 'bg-cat-card text-gray-300 hover:text-white'
            }`}
          >
            Wet Mud & Clay
          </button>
          <button
            onClick={() => setSoilType('rock')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              soilType === 'rock' ? 'bg-stone-600 text-white font-bold' : 'bg-cat-card text-gray-300 hover:text-white'
            }`}
          >
            Rocky Rubble
          </button>
        </div>

        {/* Weather FX */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] text-cat-gray uppercase">Weather FX:</span>
          <button
            onClick={() => setWeatherEffect('clear')}
            className={`p-1 rounded transition-all ${weatherEffect === 'clear' ? 'bg-cat-yellow text-cat-black font-bold' : 'bg-cat-card text-gray-300'}`}
            title="Clear Sky"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setWeatherEffect('rain')}
            className={`p-1 rounded transition-all ${weatherEffect === 'rain' ? 'bg-blue-500 text-white font-bold' : 'bg-cat-card text-gray-300'}`}
            title="Rain & Puddles"
          >
            <CloudRain className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setWeatherEffect('dust')}
            className={`p-1 rounded transition-all ${weatherEffect === 'dust' ? 'bg-amber-500 text-black font-bold' : 'bg-cat-card text-gray-300'}`}
            title="Windy Dust Haze"
          >
            <Wind className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interactive Site Actions (Worker test & Horn) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleWorkerDanger}
            className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 ${
              workerInDanger
                ? 'bg-red-600 text-white shadow-lg animate-pulse'
                : 'bg-cat-card hover:bg-cat-border text-cat-yellow border border-cat-yellow/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {workerInDanger ? 'Move Worker Away' : 'Walk Worker into Hazard (<2.5m)'}
          </button>

          <button
            onClick={handleHonkHorn}
            title="Honk Heavy Equipment Air Horn"
            className="px-2.5 py-1 rounded text-[11px] font-bold uppercase bg-cat-card hover:bg-cat-yellow hover:text-cat-black text-gray-200 border border-cat-border transition-all flex items-center gap-1"
          >
            <Megaphone className="w-3.5 h-3.5 text-cat-yellow" /> Honk Horn
          </button>

          <button
            onClick={() => setLightsOn(!lightsOn)}
            title="Toggle Work LED Headlights"
            className={`p-1 rounded border transition-all ${
              lightsOn ? 'bg-amber-400/20 text-amber-300 border-amber-400' : 'bg-cat-card text-cat-gray border-cat-border'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Mechanical Motion Toolbar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2 bg-gradient-to-t from-cat-black via-cat-black/90 to-transparent backdrop-blur-xs border-t border-cat-border/60">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-cat-gray font-mono uppercase tracking-wider">Motion:</span>
          <button
            onClick={() => setMotionMode('working')}
            className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
              motionMode === 'working'
                ? 'bg-cat-yellow text-cat-black shadow-md'
                : 'bg-cat-card text-gray-300 hover:bg-cat-border'
            }`}
          >
            Digging / Cycle
          </button>
          <button
            onClick={() => setMotionMode('traveling')}
            className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
              motionMode === 'traveling'
                ? 'bg-cat-yellow text-cat-black shadow-md'
                : 'bg-cat-card text-gray-300 hover:bg-cat-border'
            }`}
          >
            Traveling
          </button>
          <button
            onClick={() => setMotionMode('idle')}
            className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
              motionMode === 'idle'
                ? 'bg-amber-400 text-cat-black shadow-md'
                : 'bg-cat-card text-gray-300 hover:bg-cat-border'
            }`}
          >
            Idle Engine
          </button>
          <button
            onClick={() => setMotionMode('stopped')}
            className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
              motionMode === 'stopped'
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-cat-card text-gray-300 hover:bg-cat-border'
            }`}
          >
            Parked
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-cat-gray font-mono">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.5"
              value={activeSpeed}
              onChange={(e) => setActiveSpeed(parseFloat(e.target.value))}
              className="w-20 accent-cat-yellow cursor-pointer"
            />
            <span className="text-xs font-mono text-cat-yellow">{activeSpeed}x</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute in-cab sound' : 'Enable in-cab sound'}
            className="p-1.5 rounded-lg bg-cat-card border border-cat-border text-gray-300 hover:text-cat-yellow hover:border-cat-yellow transition-all"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cat-yellow" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
