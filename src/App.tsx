import React, { useState, useEffect } from 'react'
import {
  CAT_MACHINES,
  PROMPT_TELEMETRY_DATA,
  PROMPT_TASK_DATA,
  INITIAL_HAZARDS,
  INITIAL_INCIDENTS
} from './data/mockData'
import { CatMachine, TelemetryRecord, TaskRecord, ProximityHazard, IncidentReport } from './types'
import { Navbar } from './components/Navbar'
import { TelemetryBar } from './components/TelemetryBar'
import { MachineVisualizer3D } from './components/MachineVisualizer3D'
import { TaskDashboard } from './components/TaskDashboard'
import { SafetyCenter } from './components/SafetyCenter'
import { BehaviorAnomalyDetector } from './components/BehaviorAnomalyDetector'
import { TaskTimePredictor } from './components/TaskTimePredictor'
import { TrainingHub } from './components/TrainingHub'
import { HistoricalDataViewer } from './components/HistoricalDataViewer'
import {
  playSeatbeltWarningSound,
  playProximityAlertSound,
  playCompanionChime
} from './utils/audioAlerts'
import {
  AlertTriangle,
  Siren,
  Sparkles,
  Bot,
  ShieldAlert,
  Zap,
  CheckCircle2,
  HardHat,
  Flame,
  Radio,
  Sliders
} from 'lucide-react'

export const App: React.FC = () => {
  // Machine Selection State
  const [machines, setMachines] = useState<CatMachine[]>(CAT_MACHINES)
  const [selectedMachine, setSelectedMachine] = useState<CatMachine>(CAT_MACHINES[0])

  // Active Tab
  const [activeTab, setActiveTab] = useState<string>('cockpit')

  // Live Telemetry State (Starts with latest telemetry from dataset)
  const [telemetry, setTelemetry] = useState<TelemetryRecord>(PROMPT_TELEMETRY_DATA[0])

  // Daily Tasks State
  const [tasks, setTasks] = useState<TaskRecord[]>(PROMPT_TASK_DATA)

  // Hazards State
  const [hazards, setHazards] = useState<ProximityHazard[]>(INITIAL_HAZARDS)

  // Incidents State
  const [incidents, setIncidents] = useState<IncidentReport[]>(INITIAL_INCIDENTS)

  // Audio & Notification state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [bannerAlert, setBannerAlert] = useState<string | null>(null)

  // When seatbelt is unfastened or changed
  const handleToggleSeatbelt = () => {
    setTelemetry(prev => {
      const newStatus = prev.seatbeltStatus === 'Fastened' ? 'Unfastened' : 'Fastened'
      const alertTriggered = newStatus === 'Unfastened' ? 'Yes' : 'No'

      if (newStatus === 'Unfastened') {
        if (soundEnabled) playSeatbeltWarningSound()
        setBannerAlert('CRITICAL SAFETY ALERT: Operator seatbelt unfastened while engine is running!')
      } else {
        setBannerAlert(null)
      }

      return {
        ...prev,
        seatbeltStatus: newStatus,
        safetyAlertTriggered: alertTriggered
      }
    })
  }

  // Handle Load Cycle increment
  const handleIncrementCycle = () => {
    setTelemetry(prev => ({
      ...prev,
      loadCycles: prev.loadCycles + 1,
      fuelUsedL: Math.round((prev.fuelUsedL + 0.45) * 10) / 10
    }))
    if (soundEnabled) playCompanionChime()
  }

  // Handle Idling simulation
  const handleSimulateIdle = (minutes: number) => {
    setTelemetry(prev => {
      const isExcessive = minutes >= 30
      if (isExcessive) {
        if (soundEnabled) playCompanionChime()
        setBannerAlert(`EXCESSIVE IDLING FLAGGED: Machine idle reached ${minutes} mins without hydraulic load.`)
      }
      return {
        ...prev,
        idlingTimeMin: minutes,
        safetyAlertTriggered: prev.seatbeltStatus === 'Unfastened' || isExcessive ? 'Yes' : 'No'
      }
    })
  }

  // Handle Historical Telemetry Replay
  const handleLoadTelemetryRecord = (record: TelemetryRecord) => {
    setTelemetry(record)
    // Find matching machine if exists
    const matching = machines.find(m => m.id === record.machineId)
    if (matching) setSelectedMachine(matching)

    if (record.safetyAlertTriggered === 'Yes') {
      if (soundEnabled) playSeatbeltWarningSound()
      setBannerAlert(`REPLAY ALERT: Historical safety incident active from ${record.timestamp}`)
    } else {
      setBannerAlert(null)
    }
    setActiveTab('cockpit')
  }

  // Update Task Status
  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskRecord['status']) => {
    setTasks(prev =>
      prev.map(t =>
        t.taskId === taskId
          ? {
              ...t,
              status: newStatus,
              completedVolumeTons: newStatus === 'Completed' ? t.targetVolumeTons : t.completedVolumeTons
            }
          : t
      )
    )
  }

  // Add Task
  const handleAddNewTask = (newTask: TaskRecord) => {
    setTasks(prev => [newTask, ...prev])
  }

  // Switch to ML Predictor for a given task
  const handleSelectTaskForPrediction = (_task: TaskRecord) => {
    setActiveTab('predictor')
  }

  // Proximity Hazard Management
  const handleAddHazard = (haz: ProximityHazard) => {
    setHazards(prev => [haz, ...prev])
    if (soundEnabled) playProximityAlertSound(haz.dangerLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING')
    setBannerAlert(`PROXIMITY WARNING: ${haz.type} detected at ${haz.distanceMeters}m!`)
  }

  const handleDismissHazard = (id: string) => {
    setHazards(prev => prev.filter(h => h.id !== id))
  }

  // Incident Logger
  const handleLogIncident = (report: IncidentReport) => {
    setIncidents(prev => [report, ...prev])
    setBannerAlert(`INCIDENT RECORDED: ${report.id} logged to safety database.`)
  }

  // Machine Switch Handler
  const handleSelectMachine = (m: CatMachine) => {
    setSelectedMachine(m)
    setTelemetry(prev => ({
      ...prev,
      machineId: m.id,
      engineHours: m.currentEngineHours
    }))
  }

  const hasCriticalSafetyAlert =
    telemetry.seatbeltStatus === 'Unfastened' ||
    telemetry.safetyAlertTriggered === 'Yes' ||
    hazards.some(h => h.dangerLevel === 'CRITICAL' && h.distanceMeters < 3.0)

  return (
    <div className="min-h-screen bg-cat-black text-gray-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        machines={machines}
        selectedMachine={selectedMachine}
        onSelectMachine={handleSelectMachine}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        seatbeltFastened={telemetry.seatbeltStatus === 'Fastened'}
        hasActiveAlert={hasCriticalSafetyAlert}
      />

      {/* Global Warning Banner if Critical Alert Active */}
      {hasCriticalSafetyAlert && (
        <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between shadow-lg animate-pulse font-mono text-xs">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <Siren className="w-5 h-5 shrink-0" />
            <span className="font-bold uppercase tracking-wider">
              {telemetry.seatbeltStatus === 'Unfastened'
                ? 'CRITICAL ALERT: SEATBELT UNFASTENED WHILE OPERATING MACHINE'
                : 'SAFETY WARNING: PROXIMITY HAZARD WITHIN EXCLUSION RADIUS'}
            </span>
            <span className="hidden md:inline text-red-100">— Telemetry alarm active on {selectedMachine.id}</span>
          </div>
          <button
            onClick={handleToggleSeatbelt}
            className="px-3 py-1 bg-white text-black font-bold rounded uppercase text-[11px] hover:bg-gray-100"
          >
            {telemetry.seatbeltStatus === 'Unfastened' ? 'Buckle Seatbelt' : 'Acknowledge'}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Real-time Telemetry Bar */}
        <TelemetryBar
          machine={selectedMachine}
          telemetry={telemetry}
          onToggleSeatbelt={handleToggleSeatbelt}
          onIncrementCycle={handleIncrementCycle}
          onSimulateIdle={handleSimulateIdle}
        />

        {/* Tab 1: 3D Cockpit & Moving Machine Twin */}
        {activeTab === 'cockpit' && (
          <div className="space-y-6">
            {/* The Moving Machine 3D Digital Twin */}
            <MachineVisualizer3D
              machine={selectedMachine}
              seatbeltFastened={telemetry.seatbeltStatus === 'Fastened'}
              hazards={hazards}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
            />

            {/* In-Cab Assistant Companion & Quick Action Dock */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Smart In-Cab Companion Advice */}
              <div className="lg:col-span-2 bg-cat-card border border-cat-border rounded-2xl p-5 shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-cat-border/60">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-cat-yellow text-cat-black">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wide">
                          Smart Operator Companion
                        </h3>
                        <p className="text-xs text-cat-gray font-mono">
                          Workday Copilot • Machine: {selectedMachine.model}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-cat-darker text-cat-yellow border border-cat-border rounded">
                      Live Telematics Sync
                    </span>
                  </div>

                  <div className="mt-4 p-4 bg-cat-darker rounded-xl border border-cat-yellow/30 text-xs font-mono space-y-2">
                    <div className="text-cat-yellow font-bold uppercase text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Active Field Guidance:
                    </div>
                    <p className="text-gray-200 leading-relaxed">
                      {telemetry.seatbeltStatus === 'Unfastened' ? (
                        <span className="text-red-400 font-bold">
                          "Safety interlock warning: Seatbelt is unfastened. Machine safety alert is logging to company telematics. Please buckle up before articulating the hydraulic boom."
                        </span>
                      ) : telemetry.idlingTimeMin >= 30 ? (
                        <span className="text-amber-400 font-bold">
                          "Excessive idling detected ({telemetry.idlingTimeMin} mins). You have burned ~{(telemetry.idlingTimeMin * 0.05).toFixed(1)}L of fuel while waiting. Recommend activating Cat Engine Auto-Shutdown."
                        </span>
                      ) : (
                        <span>
                          "Operator Alex, hydraulic temperature is nominal at {selectedMachine.hydraulicTempC}°C. Soil conditions in Sector 4 are dry and stable. You have completed {telemetry.loadCycles} passes with zero safety strikes."
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-cat-border/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <span className="text-cat-gray">Quick Command Bar:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSimulateIdle(55)}
                      className="px-2.5 py-1.5 bg-cat-darker hover:bg-cat-card text-amber-300 rounded border border-cat-border"
                    >
                      Simulate 55m Idle
                    </button>
                    <button
                      onClick={handleToggleSeatbelt}
                      className="px-2.5 py-1.5 bg-cat-darker hover:bg-cat-card text-red-300 rounded border border-cat-border"
                    >
                      Toggle Seatbelt
                    </button>
                    <button
                      onClick={() =>
                        handleAddHazard({
                          id: `HAZ-${Date.now().toString().slice(-4)}`,
                          type: 'Personnel (Worker)',
                          distanceMeters: 2.3,
                          angleDeg: 120,
                          dangerLevel: 'CRITICAL',
                          timestamp: 'Just now'
                        })
                      }
                      className="px-2.5 py-1.5 bg-cat-yellow hover:bg-cat-yellow-dark text-cat-black font-bold rounded"
                    >
                      Trigger Worker Hazard
                    </button>
                  </div>
                </div>
              </div>

              {/* Machine Status & Specifications Widget */}
              <div className="bg-cat-card border border-cat-border rounded-2xl p-5 shadow space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-cat-border/60">
                  <h4 className="font-heading text-sm font-bold text-white uppercase tracking-wider">
                    Equipment Profile
                  </h4>
                  <span className="text-cat-yellow font-bold">{selectedMachine.id}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-cat-border/40">
                    <span className="text-cat-gray">Model</span>
                    <span className="text-white font-bold">{selectedMachine.model}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-cat-border/40">
                    <span className="text-cat-gray">Engine Power</span>
                    <span className="text-white">{selectedMachine.powerHp} HP (Tier 4 Final)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-cat-border/40">
                    <span className="text-cat-gray">Operating Weight</span>
                    <span className="text-white">{selectedMachine.operatingWeight}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-cat-border/40">
                    <span className="text-cat-gray">Attachment</span>
                    <span className="text-cat-yellow truncate max-w-[160px] text-right">
                      {selectedMachine.primaryAttachment}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-cat-gray">Machine Age</span>
                    <span className="text-white">{selectedMachine.ageYears} Years</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('tasks')}
                  className="w-full py-2 bg-cat-darker hover:bg-cat-yellow hover:text-cat-black text-gray-300 font-bold uppercase rounded-lg border border-cat-border transition-all text-center block"
                >
                  View Assigned Tasks →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Daily Task Dashboard */}
        {activeTab === 'tasks' && (
          <TaskDashboard
            tasks={tasks}
            activeMachine={selectedMachine}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onAddNewTask={handleAddNewTask}
            onSelectTaskForPrediction={handleSelectTaskForPrediction}
          />
        )}

        {/* Tab 3: Safety & Proximity Radar */}
        {activeTab === 'safety' && (
          <SafetyCenter
            machine={selectedMachine}
            telemetry={telemetry}
            hazards={hazards}
            incidents={incidents}
            onAddHazard={handleAddHazard}
            onDismissHazard={handleDismissHazard}
            onLogIncident={handleLogIncident}
            onToggleSeatbelt={handleToggleSeatbelt}
          />
        )}

        {/* Tab 4: Anomaly & Idling Detection */}
        {activeTab === 'anomalies' && (
          <BehaviorAnomalyDetector
            machine={selectedMachine}
            telemetry={telemetry}
            onSimulateIdle={handleSimulateIdle}
            onToggleSeatbelt={handleToggleSeatbelt}
          />
        )}

        {/* Tab 5: Task Time ML Predictor */}
        {activeTab === 'predictor' && <TaskTimePredictor />}

        {/* Tab 6: Operator Training Hub */}
        {activeTab === 'training' && <TrainingHub machine={selectedMachine} />}

        {/* Tab 7: Dataset Telemetry Logs */}
        {activeTab === 'telemetry' && (
          <HistoricalDataViewer onLoadTelemetry={handleLoadTelemetryRecord} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-cat-border bg-cat-darker py-4 text-xs font-mono text-cat-gray">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>CAT® Telematics Gateway v2.4 • Connected to In-Cab SMCS</span>
          </div>
          <div>Caterpillar Smart Operator Assistant Prototype • Built for CAT Hackathon 2026</div>
        </div>
      </footer>
    </div>
  )
}

export default App
