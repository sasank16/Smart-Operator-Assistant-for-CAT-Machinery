import React, { useState } from 'react'
import { CatMachine, TelemetryRecord } from '../types'
import {
  Activity,
  AlertTriangle,
  Flame,
  Fuel,
  TrendingDown,
  Bot,
  Zap,
  CheckCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Power
} from 'lucide-react'

interface BehaviorAnomalyDetectorProps {
  machine: CatMachine
  telemetry: TelemetryRecord
  onSimulateIdle: (mins: number) => void
  onToggleSeatbelt: () => void
}

export const BehaviorAnomalyDetector: React.FC<BehaviorAnomalyDetectorProps> = ({
  machine,
  telemetry,
  onSimulateIdle,
  onToggleSeatbelt
}) => {
  const [autoShutdownActive, setAutoShutdownActive] = useState(false)

  // Calculations for fuel waste: standard idle burns ~2.5L to 3.5L per hour depending on machine size
  const idleHours = telemetry.idlingTimeMin / 60
  const fuelBurnRatePerIdleHour = machine.standardFuelBurnLph * 0.15 // ~15% of working burn
  const wastedFuelLiters = Math.round(idleHours * fuelBurnRatePerIdleHour * 10) / 10
  const fuelCostPerLiter = 1.45 // USD
  const wastedCostUsd = Math.round(wastedFuelLiters * fuelCostPerLiter * 100) / 100
  const carbonImpactKg = Math.round(wastedFuelLiters * 2.68 * 10) / 10 // 2.68kg CO2 per Liter diesel

  const isExcessiveIdle = telemetry.idlingTimeMin >= 30
  const isSevereIdle = telemetry.idlingTimeMin >= 50
  const isUnbuckled = telemetry.seatbeltStatus === 'Unfastened'

  // Anomaly events list
  const anomalies = [
    {
      id: 'ANOM-01',
      title: 'Excessive Engine Idling Event',
      type: 'Efficiency & Emissions',
      severity: isSevereIdle ? 'CRITICAL' : isExcessiveIdle ? 'HIGH' : 'NORMAL',
      active: isExcessiveIdle,
      metric: `${telemetry.idlingTimeMin} min (Threshold: 30 min)`,
      description: isExcessiveIdle
        ? `Machine has been idling for ${telemetry.idlingTimeMin} minutes without hydraulic load. Resulted in ~${wastedFuelLiters}L of unneeded fuel burn.`
        : 'Idling duration is within standard operational envelope (<20 min).'
    },
    {
      id: 'ANOM-02',
      title: 'Unbuckled Machine Operation Pattern',
      type: 'Operator Safety',
      severity: isUnbuckled ? 'CRITICAL' : 'NORMAL',
      active: isUnbuckled,
      metric: `Seatbelt: ${telemetry.seatbeltStatus}`,
      description: isUnbuckled
        ? 'Repeated telematics flag: Engine running while seatbelt remains disconnected. Corresponds with Safety Alert Trigger in dataset.'
        : 'Seatbelt sensor continuously engaged during hydraulic operation.'
    },
    {
      id: 'ANOM-03',
      title: 'High Idle RPM during Inaction',
      type: 'Component Wear',
      severity: telemetry.engineRpm && telemetry.engineRpm > 1200 && isExcessiveIdle ? 'WARNING' : 'NORMAL',
      active: (telemetry.engineRpm || 1000) > 1200 && isExcessiveIdle,
      metric: `${telemetry.engineRpm || 950} RPM at 0 km/h`,
      description: 'Throttle position held above low-idle detent while stationary. Potential hydraulic relief heating.'
    },
    {
      id: 'ANOM-04',
      title: 'Slew & Cycle Hesitation Spike',
      type: 'Productivity Rhythm',
      severity: 'NORMAL',
      active: false,
      metric: '0.94 rhythm index',
      description: 'Dig-to-dump transition timing is smooth and consistent with target payload distribution.'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Top Anomaly Summary Card */}
      <div className="bg-cat-card border border-cat-border rounded-2xl p-5 shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-cat-border/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-5 h-5 text-cat-yellow" /> Anomaly & Behavior Analytics Engine
              </span>
              {(isExcessiveIdle || isUnbuckled) && (
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-cat-danger text-white rounded animate-pulse">
                  UNUSUAL PATTERN DETECTED
                </span>
              )}
            </div>
            <p className="text-xs text-cat-gray font-mono mt-1">
              Real-time pattern analysis across engine telematics, hydraulic duty cycles, and operator habits.
            </p>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-cat-gray font-mono">Test Telematics:</span>
            <button
              onClick={() => onSimulateIdle(15)}
              className="px-2.5 py-1.5 text-xs font-mono bg-cat-darker hover:bg-cat-card text-gray-300 rounded border border-cat-border"
            >
              15 min Idle (Normal)
            </button>
            <button
              onClick={() => onSimulateIdle(55)}
              className="px-2.5 py-1.5 text-xs font-mono bg-amber-950/80 hover:bg-amber-900 border border-amber-500 text-amber-200 rounded font-bold"
            >
              55 min Idle (Prompt Alert)
            </button>
            <button
              onClick={() => onSimulateIdle(60)}
              className="px-2.5 py-1.5 text-xs font-mono bg-red-950/80 hover:bg-red-900 border border-red-500 text-red-200 rounded font-bold"
            >
              60 min Idle (Prompt Alert)
            </button>
          </div>
        </div>

        {/* Idling Impact Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-cat-darker p-3.5 rounded-xl border border-cat-border">
            <div className="text-cat-gray text-xs font-mono flex items-center justify-between">
              <span>CURRENT IDLE DURATION</span>
              <Clock className="w-4 h-4 text-cat-yellow" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${isExcessiveIdle ? 'text-amber-400' : 'text-white'}`}>
                {telemetry.idlingTimeMin}
              </span>
              <span className="text-xs text-cat-gray">minutes</span>
            </div>
            <div className="text-[11px] text-cat-gray mt-1">
              Standard Benchmark: &lt; 20 min
            </div>
          </div>

          <div className="bg-cat-darker p-3.5 rounded-xl border border-cat-border">
            <div className="text-cat-gray text-xs font-mono flex items-center justify-between">
              <span>ESTIMATED FUEL WASTED</span>
              <Fuel className="w-4 h-4 text-cat-yellow" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-400">
                {wastedFuelLiters}
              </span>
              <span className="text-xs text-cat-gray">Liters diesel</span>
            </div>
            <div className="text-[11px] text-cat-gray mt-1">
              Estimated Waste: ${wastedCostUsd} USD
            </div>
          </div>

          <div className="bg-cat-darker p-3.5 rounded-xl border border-cat-border">
            <div className="text-cat-gray text-xs font-mono flex items-center justify-between">
              <span>CARBON FOOTPRINT</span>
              <Flame className="w-4 h-4 text-cat-yellow" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-red-400">
                {carbonImpactKg}
              </span>
              <span className="text-xs text-cat-gray">kg CO₂e</span>
            </div>
            <div className="text-[11px] text-cat-gray mt-1">
              Avoidable with Auto-Shutdown
            </div>
          </div>

          <div className="bg-cat-darker p-3.5 rounded-xl border border-cat-border flex flex-col justify-between">
            <div className="text-cat-gray text-xs font-mono flex items-center justify-between">
              <span>CAT AUTO-SHUTDOWN</span>
              <Power className={`w-4 h-4 ${autoShutdownActive ? 'text-emerald-400' : 'text-cat-gray'}`} />
            </div>
            <button
              onClick={() => {
                setAutoShutdownActive(!autoShutdownActive)
                if (!autoShutdownActive) onSimulateIdle(5)
              }}
              className={`w-full py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                autoShutdownActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-cat-card hover:bg-cat-border text-gray-300 border border-cat-border'
              }`}
            >
              {autoShutdownActive ? 'AES Armed (5 min max)' : 'Arm Auto-Shutdown'}
            </button>
            <div className="text-[10px] text-cat-gray text-center font-mono mt-1">
              Auto cuts engine after 5m idle
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Pattern Cards & AI Copilot Coaching */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identified Patterns Feed */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="text-xs font-mono uppercase text-cat-gray tracking-wider">
            Pattern Detection Matrix
          </h4>

          {anomalies.map((anom) => {
            const isAlert = anom.active
            return (
              <div
                key={anom.id}
                className={`cat-panel rounded-xl p-4 border transition-all ${
                  isAlert
                    ? 'border-red-500/70 bg-gradient-to-r from-red-950/30 via-cat-card to-cat-card'
                    : 'border-cat-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        isAlert ? 'bg-red-500/20 text-red-400' : 'bg-cat-darker text-cat-gray'
                      }`}
                    >
                      {isAlert ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{anom.title}</span>
                        <span className="text-[10px] font-mono text-cat-gray uppercase">
                          ({anom.type})
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{anom.description}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded uppercase ${
                      isAlert
                        ? 'bg-red-950 text-red-400 border border-red-500/50 animate-pulse'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {isAlert ? anom.severity : 'NOMINAL'}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-cat-border/40 flex items-center justify-between text-xs font-mono">
                  <span className="text-cat-gray">Metric: <strong className="text-cat-yellow">{anom.metric}</strong></span>
                  {isAlert && (
                    <span className="text-red-400 font-semibold flex items-center gap-1">
                      ⚠️ Corrective Coaching Suggested
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Smart In-Cab Companion / AI Advisor */}
        <div className="bg-cat-card border border-cat-border rounded-2xl p-5 shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-cat-border/60">
              <div className="p-2 rounded-xl bg-cat-yellow text-cat-black">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wide">
                  CAT® Smart Copilot
                </h3>
                <p className="text-xs text-cat-gray font-mono">Contextual In-Cab AI Advisor</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {/* Dynamic Copilot Message */}
              <div className="p-3.5 bg-cat-darker rounded-xl border border-cat-yellow/30 text-xs space-y-2">
                <div className="flex items-center gap-1.5 text-cat-yellow font-bold uppercase tracking-wider text-[11px]">
                  <Sparkles className="w-3.5 h-3.5" /> Real-time Voice Coach Prompt:
                </div>
                <p className="text-gray-200 leading-relaxed italic">
                  {isExcessiveIdle
                    ? `"Alex, we noticed your machine has been idling for ${telemetry.idlingTimeMin} minutes. To save ~${wastedFuelLiters}L of diesel and keep your operating score high, consider shutting down the engine or arming Auto-Idle."`
                    : isUnbuckled
                    ? `"Safety check: Please click your seatbelt before moving or rotating the cab. Keeping buckled protects you and prevents telemetry compliance strikes."`
                    : `"Great job on your excavation cycles! You are running in optimal power band at 1800 RPM. Productivity is +6% above daily target."`}
                </p>
              </div>

              {/* Actionable Suggestions */}
              <div className="space-y-2 pt-2 text-xs font-mono">
                <div className="text-cat-gray uppercase text-[11px]">Recommended Habit Tweaks:</div>
                <div className="p-2 bg-cat-darker/60 rounded-lg border border-cat-border/60 flex items-start gap-2">
                  <Zap className="w-4 h-4 text-cat-yellow shrink-0 mt-0.5" />
                  <span className="text-gray-300">
                    Switch hydraulic mode to <strong>ECO-Mode</strong> during light grading to cut fuel burn by 12%.
                  </span>
                </div>
                <div className="p-2 bg-cat-darker/60 rounded-lg border border-cat-border/60 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-gray-300">
                    Position haul trucks at a 45° angle to reduce swing cycle time from 18s to 12s.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-cat-border/60">
            <button
              onClick={() => alert('Smart Copilot audio guidance enabled: Voice coaching will chime through in-cab speakers.')}
              className="w-full py-2.5 bg-cat-yellow hover:bg-cat-yellow-dark text-cat-black font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow"
            >
              Test In-Cab Voice Prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
