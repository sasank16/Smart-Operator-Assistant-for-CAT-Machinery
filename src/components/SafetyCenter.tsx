import React, { useState } from 'react'
import { ProximityHazard, IncidentReport, CatMachine, TelemetryRecord } from '../types'
import {
  ShieldAlert,
  AlertTriangle,
  Radio,
  FileText,
  Plus,
  Users,
  Download,
  CheckCircle2,
  XCircle,
  Siren,
  BellRing
} from 'lucide-react'

interface SafetyCenterProps {
  machine: CatMachine
  telemetry: TelemetryRecord
  hazards: ProximityHazard[]
  incidents: IncidentReport[]
  onAddHazard: (hazard: ProximityHazard) => void
  onDismissHazard: (id: string) => void
  onLogIncident: (incident: IncidentReport) => void
  onToggleSeatbelt: () => void
}

export const SafetyCenter: React.FC<SafetyCenterProps> = ({
  machine,
  telemetry,
  hazards,
  incidents,
  onAddHazard,
  onDismissHazard,
  onLogIncident,
  onToggleSeatbelt
}) => {
  const [showLogModal, setShowLogModal] = useState(false)
  const isSeatbeltOff = telemetry.seatbeltStatus === 'Unfastened'

  // New incident form state
  const [incidentType, setIncidentType] = useState<IncidentReport['incidentType']>('Near Miss - Proximity')
  const [severity, setSeverity] = useState<IncidentReport['severity']>('High')
  const [groundCondition, setGroundCondition] = useState<IncidentReport['groundCondition']>('Muddy / Unstable')
  const [weatherCondition, setWeatherCondition] = useState('Rainy / Low Visibility')
  const [description, setDescription] = useState('')

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault()
    const newReport: IncidentReport = {
      id: `INC-2025-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      machineId: machine.id,
      operatorId: telemetry.operatorId,
      incidentType,
      severity,
      groundCondition,
      weather: weatherCondition,
      description: description || `Incident flagged during ${machine.name} operation.`,
      telemetrySnapshot: {
        engineHours: telemetry.engineHours,
        seatbelt: telemetry.seatbeltStatus,
        fuelLevel: machine.fuelLevelPct,
        engineRpm: machine.engineRpm
      },
      status: 'Logged'
    }
    onLogIncident(newReport)
    setShowLogModal(false)
    setDescription('')
  }

  // Quick hazard simulation
  const handleSimulateHazard = (type: ProximityHazard['type'], dist: number, angle: number, danger: ProximityHazard['dangerLevel']) => {
    const newHaz: ProximityHazard = {
      id: `HAZ-${Date.now().toString().slice(-4)}`,
      type,
      distanceMeters: dist,
      angleDeg: angle,
      dangerLevel: danger,
      timestamp: 'Just now'
    }
    onAddHazard(newHaz)
  }

  return (
    <div className="space-y-6">
      {/* Real-time Seatbelt Compliance Warning Card */}
      <div
        className={`rounded-2xl p-5 border transition-all ${
          isSeatbeltOff
            ? 'bg-gradient-to-r from-red-950 via-cat-darker to-red-950/80 border-red-500 shadow-xl shadow-red-950/40'
            : 'bg-cat-card border-cat-border'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl ${
                isSeatbeltOff ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {isSeatbeltOff ? <Siren className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-bold text-white uppercase tracking-wider">
                  1. Seatbelt Compliance Monitor
                </span>
                <span
                  className={`px-2 py-0.5 text-xs font-mono font-bold rounded ${
                    isSeatbeltOff ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {isSeatbeltOff ? 'CRITICAL NON-COMPLIANCE' : 'COMPLIANT'}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 max-w-xl">
                {isSeatbeltOff
                  ? 'SAFETY ALERT: Operator seatbelt is unfastened while engine is running! Telematics has logged a safety infraction (Matches telemetry dataset alert).'
                  : 'Operator seatbelt sensor actively locked. In-cab telematics indicates full OSHA & ISO safety compliance.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSeatbelt}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider font-mono transition-all flex items-center gap-2 shadow ${
                isSeatbeltOff
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                  : 'bg-red-600 hover:bg-red-500 text-white'
              }`}
            >
              {isSeatbeltOff ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {isSeatbeltOff ? 'Fasten Seatbelt' : 'Unbuckle (Trigger Alert)'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Proximity Hazards Radar & Sensor Array */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Map & Live Sensors */}
        <div className="lg:col-span-2 bg-cat-card border border-cat-border rounded-2xl p-5 shadow">
          <div className="flex items-center justify-between pb-3 border-b border-cat-border/60">
            <div>
              <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <Radio className="w-5 h-5 text-cat-yellow animate-pulse" /> 2. 360° Proximity Hazard Radar
              </h3>
              <p className="text-xs text-cat-gray font-mono">Ultrasonic & LiDAR Blind-Spot Surveillance</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSimulateHazard('Personnel (Worker)', 2.1, 135, 'CRITICAL')}
                className="px-2.5 py-1 text-[11px] font-mono bg-red-950/80 hover:bg-red-900 border border-red-500 text-red-200 rounded"
              >
                + Trigger Worker &lt; 2.5m
              </button>
              <button
                onClick={() => handleSimulateHazard('Trench / Drop-off', 4.8, 270, 'WARNING')}
                className="px-2.5 py-1 text-[11px] font-mono bg-amber-950/80 hover:bg-amber-900 border border-amber-500 text-amber-200 rounded"
              >
                + Trench Edge Hazard
              </button>
            </div>
          </div>

          {/* Radar Visual Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-4">
            {/* Visual Circular Radar Screen */}
            <div className="relative w-64 h-64 mx-auto bg-cat-darker rounded-full border-2 border-cat-yellow/30 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Concentric distance rings */}
              <div className="absolute w-52 h-52 rounded-full border border-dashed border-emerald-500/40" />
              <div className="absolute w-36 h-36 rounded-full border border-amber-500/50" />
              <div className="absolute w-20 h-20 rounded-full border-2 border-red-500/70" />

              {/* Crosshairs */}
              <div className="absolute w-full h-[1px] bg-cat-yellow/20" />
              <div className="absolute h-full w-[1px] bg-cat-yellow/20" />

              {/* Rotating Sweep Beam */}
              <div className="absolute inset-0 rounded-full animate-sweep origin-center pointer-events-none bg-gradient-to-tr from-transparent via-cat-yellow/10 to-transparent" />

              {/* Center Machine Icon */}
              <div className="relative z-10 w-9 h-9 rounded-lg bg-cat-yellow text-cat-black flex items-center justify-center font-bold text-xs shadow-lg">
                {machine.id.slice(0, 3)}
              </div>

              {/* Dynamic Blips */}
              {hazards.map((haz) => {
                const rad = ((haz.angleDeg - 90) * Math.PI) / 180
                // scale distance: 7m = 110px radius
                const r = Math.min(115, (haz.distanceMeters / 7) * 110)
                const x = 128 + r * Math.cos(rad)
                const y = 128 + r * Math.sin(rad)
                const color = haz.dangerLevel === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-400'

                return (
                  <div
                    key={haz.id}
                    style={{ left: `${x}px`, top: `${y}px` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${color} flex items-center justify-center text-[8px] font-bold text-black animate-ping z-20 shadow cursor-pointer`}
                    title={`${haz.type} at ${haz.distanceMeters}m`}
                  />
                )
              })}
            </div>

            {/* Live Detected Hazards List */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-cat-gray uppercase flex justify-between">
                <span>Active Target Feed ({hazards.length})</span>
                <span className="text-emerald-400">Sensors: Nominal</span>
              </div>

              {hazards.length === 0 ? (
                <div className="p-4 text-center text-xs text-cat-gray font-mono border border-cat-border rounded-lg bg-cat-darker/40">
                  No immediate proximity hazards within 7m envelope.
                </div>
              ) : (
                hazards.map((haz) => (
                  <div
                    key={haz.id}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-mono ${
                      haz.dangerLevel === 'CRITICAL'
                        ? 'bg-red-950/40 border-red-500 text-red-200'
                        : 'bg-amber-950/40 border-amber-500 text-amber-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{haz.type}</span>
                      </div>
                      <div className="text-[11px] text-cat-gray mt-0.5">
                        Distance: <strong className="text-white">{haz.distanceMeters}m</strong> • Bearing: {haz.angleDeg}°
                      </div>
                    </div>
                    <button
                      onClick={() => onDismissHazard(haz.id)}
                      className="px-2 py-1 text-[10px] bg-cat-darker hover:bg-cat-card text-gray-300 rounded border border-cat-border"
                    >
                      Acknowledge
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 3. Incident Logging & Reports Quick Panel */}
        <div className="bg-cat-card border border-cat-border rounded-2xl p-5 shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cat-border/60">
              <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-5 h-5 text-cat-yellow" /> 3. Incident Logging
              </h3>
              <button
                onClick={() => setShowLogModal(true)}
                className="px-2.5 py-1 text-xs font-bold bg-cat-yellow text-cat-black rounded hover:bg-cat-yellow-dark flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Log Event
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-xs text-cat-gray font-mono">Recent Safety Incidents & Near-Misses:</div>
              {incidents.slice(0, 3).map((inc) => (
                <div key={inc.id} className="p-3 bg-cat-darker rounded-xl border border-cat-border text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-cat-yellow font-bold">{inc.id}</span>
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${
                        inc.severity === 'High' ? 'bg-red-950 text-red-400' : 'bg-amber-950 text-amber-400'
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </div>
                  <div className="font-semibold text-white">{inc.incidentType}</div>
                  <div className="text-[11px] text-cat-gray line-clamp-2">{inc.description}</div>
                  <div className="text-[10px] text-cat-gray/80 font-mono pt-1">
                    Conditions: {inc.groundCondition} • {inc.weather}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-cat-border/60">
            <button
              onClick={() => alert('Exporting OSHA / CAT Safety Audit Report as JSON/PDF...')}
              className="w-full py-2 bg-cat-darker hover:bg-cat-card text-gray-300 text-xs font-mono rounded-lg border border-cat-border flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export Safety Audit Report
            </button>
          </div>
        </div>
      </div>

      {/* Incident Logging Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-cat-darker border border-cat-yellow/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-heading text-xl font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cat-yellow" /> File Operator Incident / Near-Miss
            </h3>

            <form onSubmit={handleCreateIncident} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-cat-gray uppercase mb-1">Incident Type</label>
                  <select
                    value={incidentType}
                    onChange={(e) => setIncidentType(e.target.value as any)}
                    className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                  >
                    <option value="Near Miss - Proximity">Near Miss - Proximity</option>
                    <option value="Unbuckled Operation">Unbuckled Operation</option>
                    <option value="Excessive Idle Event">Excessive Idle Event</option>
                    <option value="Ground Collapse Warning">Ground Collapse Warning</option>
                    <option value="Attachment Collision">Attachment Collision</option>
                  </select>
                </div>
                <div>
                  <label className="block text-cat-gray uppercase mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-cat-gray uppercase mb-1">Working Ground Condition</label>
                  <select
                    value={groundCondition}
                    onChange={(e) => setGroundCondition(e.target.value as any)}
                    className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                  >
                    <option value="Muddy / Unstable">Muddy / Unstable</option>
                    <option value="Compacted Earth">Compacted Earth</option>
                    <option value="Rocky">Rocky</option>
                    <option value="Paved / Concrete">Paved / Concrete</option>
                    <option value="Wet Clay">Wet Clay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-cat-gray uppercase mb-1">Weather Context</label>
                  <input
                    type="text"
                    value={weatherCondition}
                    onChange={(e) => setWeatherCondition(e.target.value)}
                    className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-cat-gray uppercase mb-1">Incident Description & Root Cause</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail operator actions, proximity radar trigger distance, or site hazards encountered..."
                  className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                  required
                />
              </div>

              {/* Automatic Telematics Snapshot Info */}
              <div className="p-3 bg-cat-black rounded-lg border border-cat-border text-[11px] text-cat-gray space-y-1">
                <div className="text-cat-yellow font-bold">Auto-attached Telemetry Snapshot:</div>
                <div className="flex justify-between">
                  <span>Machine ID: {machine.id}</span>
                  <span>Engine Hours: {telemetry.engineHours}h</span>
                  <span>Seatbelt: {telemetry.seatbeltStatus}</span>
                  <span>RPM: {machine.engineRpm}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-cat-border">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-cat-card hover:bg-cat-border text-gray-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cat-yellow text-cat-black font-bold rounded-lg text-xs hover:bg-cat-yellow-dark uppercase tracking-wider"
                >
                  Submit Incident Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
