import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { CatMachine, ProximityHazard } from '../types'
import { Eye, RotateCw, ShieldAlert, Sparkles, Volume2, VolumeX, Maximize2, Zap, AlertTriangle } from 'lucide-react'

interface MachineVisualizerProps {
  machine: CatMachine
  seatbeltFastened: boolean
  hazards: ProximityHazard[]
  onHazardClick?: (hazard: ProximityHazard) => void
  soundEnabled: boolean
  setSoundEnabled: (v: boolean) => void
}

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
  const [hoveredHazard, setHoveredHazard] = useState<ProximityHazard | null>(null)

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const machineGroupRef = useRef<THREE.Group | null>(null)
  const animatedPartsRef = useRef<Record<string, THREE.Object3D>>({})
  const radarSweepRef = useRef<THREE.Mesh | null>(null)
  const hazardMarkersRef = useRef<THREE.Group | null>(null)
  const seatbeltBeaconRef = useRef<THREE.Mesh | null>(null)
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

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width = mount.clientWidth
    const height = mount.clientHeight

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0x0e1117)
    scene.fog = new THREE.FogExp2(0x0e1117, 0.025)

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xfff4d6, 2.4)
    sunLight.position.set(15, 25, 15)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 1024
    sunLight.shadow.mapSize.height = 1024
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 60
    sunLight.shadow.camera.left = -15
    sunLight.shadow.camera.right = 15
    sunLight.shadow.camera.top = 15
    sunLight.shadow.camera.bottom = -15
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x00c8ff, 0.8)
    rimLight.position.set(-15, 10, -15)
    scene.add(rimLight)

    // Ground Grid & Construction Soil Pad
    createGround(scene)

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
      cameraAngle.current.radius = Math.max(8, Math.min(32, cameraAngle.current.radius + e.deltaY * 0.02))
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

  // Update Hazard pins when hazards prop change
  useEffect(() => {
    updateHazardMarkers(hazards)
  }, [hazards])

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

  // Create Ground Grid & Work Site Dirt Pad
  const createGround = (scene: THREE.Scene) => {
    // Dirt Pad
    const padGeo = new THREE.CylinderGeometry(14, 15, 0.4, 32)
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x221d17,
      roughness: 0.9,
      metalness: 0.1
    })
    const pad = new THREE.Mesh(padGeo, padMat)
    pad.position.y = -0.2
    pad.receiveShadow = true
    scene.add(pad)

    // Site Grid lines
    const grid = new THREE.GridHelper(30, 30, 0xffcd11, 0x2a2a2a)
    grid.position.y = 0.01
    scene.add(grid)
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
    // Clean old machine if exists
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
      // 1. Tracks / Undercarriage
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

      // 2. Superstructure / Cabin & Engine housing (Rotates 360°)
      const upperStructure = new THREE.Group()
      upperStructure.position.y = 1.0
      animatedPartsRef.current.upperStructure = upperStructure

      // Counterweight (Rear)
      const counterWeight = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.4), yellowMat)
      counterWeight.position.set(0, 0.7, -1.5)
      counterWeight.castShadow = true
      upperStructure.add(counterWeight)

      // Black counterweight bottom band with CAT logo strip
      const cwStrip = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.3, 1.42), blackMat)
      cwStrip.position.set(0, 0.3, -1.5)
      upperStructure.add(cwStrip)

      // Engine hood
      const engineHood = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.8), yellowMat)
      engineHood.position.set(0.5, 0.6, 0.1)
      engineHood.castShadow = true
      upperStructure.add(engineHood)

      // Exhaust pipe
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8), greyMat)
      exhaust.position.set(0.8, 1.4, -0.6)
      upperStructure.add(exhaust)

      // Cabin (Front Left)
      const cab = new THREE.Group()
      cab.position.set(-0.7, 0.2, 0.4)
      const cabBody = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 1.4), blackMat)
      cabBody.position.y = 0.75
      cab.add(cabBody)

      // Cab Glass windows
      const frontGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.0), glassMat)
      frontGlass.position.set(0, 0.8, 0.71)
      cab.add(frontGlass)

      const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.8), glassMat)
      sideGlass.position.set(-0.51, 0.9, 0)
      sideGlass.rotation.y = -Math.PI / 2
      cab.add(sideGlass)

      // Seatbelt warning hologram in cab
      const beaconGeo = new THREE.SphereGeometry(0.2, 16, 16)
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.8 })
      const beacon = new THREE.Mesh(beaconGeo, beaconMat)
      beacon.position.set(0, 0.9, 0.2)
      seatbeltBeaconRef.current = beacon
      cab.add(beacon)

      // Cab Roof Safety Strobe
      const strobe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15), new THREE.MeshBasicMaterial({ color: 0xffaa00 }))
      strobe.position.set(0, 1.55, 0)
      cab.add(strobe)

      upperStructure.add(cab)

      // 3. Boom Arm (Pivots up and down)
      const boomPivot = new THREE.Group()
      boomPivot.position.set(0.2, 0.8, 0.9)
      animatedPartsRef.current.boom = boomPivot

      const boomMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 4.5), yellowMat)
      boomMesh.position.set(0, 0.6, 2.0)
      boomMesh.rotation.x = -Math.PI / 6
      boomMesh.castShadow = true
      boomPivot.add(boomMesh)

      // Hydraulic Boom Cylinder
      const cylBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.2), blackMat)
      cylBase.position.set(0, 0.1, 1.0)
      cylBase.rotation.x = -Math.PI / 5
      boomPivot.add(cylBase)

      const cylRod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8), chromeMat)
      cylRod.position.set(0, 0.6, 1.8)
      cylRod.rotation.x = -Math.PI / 5
      boomPivot.add(cylRod)

      // 4. Stick Arm (Pivots at end of boom)
      const stickPivot = new THREE.Group()
      stickPivot.position.set(0, 1.7, 3.8)
      animatedPartsRef.current.stick = stickPivot

      const stickMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 3.0), yellowMat)
      stickMesh.position.set(0, -0.6, 1.2)
      stickMesh.rotation.x = Math.PI / 4
      stickMesh.castShadow = true
      stickPivot.add(stickMesh)

      // 5. Bucket (Articulated at end of stick)
      const bucketPivot = new THREE.Group()
      bucketPivot.position.set(0, -1.6, 2.2)
      animatedPartsRef.current.bucket = bucketPivot

      const bucketMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.9), blackMat)
      bucketMesh.castShadow = true
      bucketPivot.add(bucketMesh)

      // Bucket Teeth
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
      // Wheel Loader 3D
      const loaderChassis = new THREE.Group()
      
      // Rear Engine frame
      const rearFrame = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.4, 2.8), yellowMat)
      rearFrame.position.set(0, 1.4, -1.2)
      rearFrame.castShadow = true
      loaderChassis.add(rearFrame)

      // Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 1.4), blackMat)
      cab.position.set(0, 2.4, -0.4)
      loaderChassis.add(cab)

      // 4 Massive Loader Tires
      const wheels: THREE.Mesh[] = []
      const tireGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.6, 24)
      const positions = [
        [-1.3, 0.85, 1.4],
        [1.3, 0.85, 1.4],
        [-1.3, 0.85, -1.6],
        [1.3, 0.85, -1.6]
      ]
      positions.forEach((pos, idx) => {
        const tire = new THREE.Mesh(tireGeo, blackMat)
        tire.rotation.z = Math.PI / 2
        tire.position.set(pos[0], pos[1], pos[2])
        tire.castShadow = true
        loaderChassis.add(tire)
        wheels.push(tire)
      })
      animatedPartsRef.current.wheels = { children: wheels } as unknown as THREE.Object3D

      // Lift Arms
      const liftArmPivot = new THREE.Group()
      liftArmPivot.position.set(0, 1.4, 0.8)
      animatedPartsRef.current.loaderArms = liftArmPivot

      const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 3.2), yellowMat)
      leftArm.position.set(-0.8, 0.2, 1.4)
      liftArmPivot.add(leftArm)

      const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 3.2), yellowMat)
      rightArm.position.set(0.8, 0.2, 1.4)
      liftArmPivot.add(rightArm)

      // Bucket
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
      // Track-Type Dozer / Hauler / Grader
      const dozerBody = new THREE.Group()
      
      // Undercarriage tracks
      const leftTrack = createTrackAssembly(blackMat, greyMat)
      leftTrack.position.set(-1.3, 0.5, 0)
      dozerBody.add(leftTrack)

      const rightTrack = createTrackAssembly(blackMat, greyMat)
      rightTrack.position.set(1.3, 0.5, 0)
      dozerBody.add(rightTrack)

      // Main Dozer Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 3.2), yellowMat)
      body.position.set(0, 1.4, -0.2)
      body.castShadow = true
      dozerBody.add(body)

      // Cab
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 1.6), blackMat)
      cab.position.set(0, 2.5, -0.5)
      dozerBody.add(cab)

      // Front Push Blade
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
    // Main track belt loop
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.8, 4.2), trackMat)
    belt.castShadow = true
    track.add(belt)

    // Rollers
    for (let z = -1.6; z <= 1.6; z += 0.8) {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 16), rollerMat)
      roller.rotation.z = Math.PI / 2
      roller.position.set(0, -0.1, z)
      track.add(roller)
    }
    return track
  }

  // Update Hazard Pins on 3D radar field
  const updateHazardMarkers = (hazardList: ProximityHazard[]) => {
    const group = hazardMarkersRef.current
    if (!group) return

    // Clear old pins
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

      // Marker Head
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 16, 16),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
      )
      pinGroup.add(sphere)

      // Marker Stem
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      )
      stem.position.y = -0.6
      pinGroup.add(stem)

      // Pulsing pulse ring on ground under hazard
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

  // Mechanical kinematic animation loop
  const animateMachine = (elapsed: number, speed: number) => {
    const parts = animatedPartsRef.current

    if (motionMode === 'stopped') {
      return
    }

    if (motionMode === 'idle') {
      // Gentle engine vibration
      if (machineGroupRef.current) {
        machineGroupRef.current.position.y = Math.sin(elapsed * 18) * 0.015
      }
      return
    }

    if (machine.type === 'excavator') {
      if (parts.upperStructure && parts.boom && parts.stick && parts.bucket) {
        if (motionMode === 'working') {
          // Digging Cycle
          const t = elapsed * 0.9 * speed
          // Slew left and right
          parts.upperStructure.rotation.y = Math.sin(t * 0.5) * 0.65

          // Boom raise and lower
          parts.boom.rotation.x = -Math.sin(t) * 0.25 - 0.1

          // Stick curl and stretch
          parts.stick.rotation.x = Math.cos(t) * 0.35 + 0.2

          // Bucket scoop and dump
          parts.bucket.rotation.x = Math.sin(t + 0.5) * 0.65
        } else if (motionMode === 'traveling') {
          // Moving forward
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

  return (
    <div className="relative w-full h-[450px] bg-cat-darker rounded-xl overflow-hidden border border-cat-border shadow-2xl flex flex-col">
      {/* Top Overlay Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-cat-black/90 to-transparent backdrop-blur-xs">
        <div className="flex items-center space-x-3">
          <span className="px-2.5 py-1 text-xs font-bold rounded bg-cat-yellow text-cat-black tracking-wider uppercase flex items-center gap-1.5 shadow">
            <Sparkles className="w-3.5 h-3.5" /> 3D Digital Twin
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

      {/* Proximity Hazard Mini Radar HUD Legend */}
      <div className="absolute top-16 right-4 z-10 bg-cat-black/80 backdrop-blur-md border border-cat-border rounded-lg p-2.5 text-xs font-mono space-y-1.5 shadow-lg">
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
      </div>

      {/* Bottom Interactive Motion Control Toolbar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2.5 bg-gradient-to-t from-cat-black/95 via-cat-black/80 to-transparent backdrop-blur-xs border-t border-cat-border/60">
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
