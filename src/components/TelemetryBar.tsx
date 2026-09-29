import React from 'react'
import { CatMachine, TelemetryRecord } from '../types'
import {
  Clock,
  Fuel,
  Repeat,
  Timer,
  AlertTriangle,
  Flame,
  Gauge,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface TelemetryBarProps {
  machine: CatMachine
  telemetry: TelemetryRecord
  onToggleSeatbelt: () => void
  onIncrementCycle: () => void
  onSimulateIdle: (minutes: number) => void
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  machine,
  telemetry,
  onToggleSeatbelt,
  onIncrementCycle,
  onSimulateIdle
}) => {
  const isExcessiveIdle = telemetry.idlingTimeMin >= 30
  const isSeatbeltOff = telemetry.seatbeltStatus === 'Unfastened'

  return (
    <div className="bg-cat-card border border-cat-border rounded-xl p-3 shadow-lg">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Engine Hours */}
        <div className="bg-cat-darker/80 border border-cat-border/80 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-cat-gray text-[11px] font-mono">
            <span>ENGINE HOURS</span>
            <Clock className="w-3.5 h-3.5 text-cat-yellow" />
          </div>
          <div className="mt-1">
            <span className="text-xl font-bold font-mono text-white">{telemetry.engineHours.toFixed(1)}</span>
            <span className="text-xs text-cat-gray ml-1">hrs</span>
          </div>
          <div className="text-[10px] text-cat-gray truncate mt-0.5">SMCS Service Due: +120h</div>
        </div>

        {/* Fuel Consumption */}
        <div className="bg-cat-darker/80 border border-cat-border/80 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-cat-gray text-[11px] font-mono">
            <span>FUEL USAGE (SESSION)</span>
            <Fuel className="w-3.5 h-3.5 text-cat-yellow" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold font-mono text-white">{telemetry.fuelUsedL.toFixed(1)}</span>
              <span className="text-xs text-cat-gray ml-1">L</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">{machine.fuelLevelPct}% tank</span>
          </div>
          <div className="w-full bg-cat-border h-1 rounded-full mt-1 overflow-hidden">
            <div
              className="bg-cat-yellow h-full rounded-full transition-all"
              style={{ width: `${machine.fuelLevelPct}%` }}
            />
          </div>
        </div>

        {/* Load Cycles */}
        <div className="bg-cat-darker/80 border border-cat-border/80 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-cat-gray text-[11px] font-mono">
            <span>LOAD CYCLES</span>
            <Repeat className="w-3.5 h-3.5 text-cat-yellow" />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold font-mono text-white">{telemetry.loadCycles}</span>
              <span className="text-xs text-cat-gray ml-1">passes</span>
            </div>
            <button
              onClick={onIncrementCycle}
              title="Record a completed bucket/load cycle"
              className="text-[10px] bg-cat-card hover:bg-cat-yellow hover:text-cat-black text-gray-300 font-mono px-2 py-0.5 rounded border border-cat-border transition-all"
            >
              + Pass
            </button>
          </div>
          <div className="text-[10px] text-cat-gray truncate mt-0.5">Payload: ~28.4 tons</div>
        </div>

        {/* Idling Time (Excessive Idle Warning) */}
        <div
          className={`border rounded-lg p-2.5 flex flex-col justify-between transition-all ${
            isExcessiveIdle
              ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
              : 'bg-cat-darker/80 border-cat-border/80'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className={isExcessiveIdle ? 'text-amber-400 font-bold' : 'text-cat-gray'}>
              IDLING TIME {isExcessiveIdle && '⚠️'}
            </span>
            <Timer className={`w-3.5 h-3.5 ${isExcessiveIdle ? 'text-amber-400 animate-pulse' : 'text-cat-yellow'}`} />
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div>
              <span className={`text-xl font-bold font-mono ${isExcessiveIdle ? 'text-amber-400' : 'text-white'}`}>
                {telemetry.idlingTimeMin}
              </span>
              <span className="text-xs text-cat-gray ml-1">min</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onSimulateIdle(15)}
                className="text-[9px] px-1 py-0.5 bg-cat-card hover:bg-cat-border rounded text-gray-300 font-mono"
                title="Set 15 min idle"
              >
                15m
              </button>
              <button
                onClick={() => onSimulateIdle(55)}
                className="text-[9px] px-1 py-0.5 bg-amber-900/60 hover:bg-amber-700 text-amber-300 rounded font-mono font-bold"
                title="Simulate 55 min excessive idle"
              >
                55m
              </button>
            </div>
          </div>
          <div className="text-[10px] truncate mt-0.5">
            {isExcessiveIdle ? (
              <span className="text-amber-400 font-semibold">Exceeds 30m threshold!</span>
            ) : (
              <span className="text-cat-gray">Optimal &lt; 20m</span>
            )}
          </div>
        </div>

        {/* Seatbelt Compliance (Click to Toggle) */}
        <div
          className={`border rounded-lg p-2.5 flex flex-col justify-between cursor-pointer transition-all ${
            isSeatbeltOff
              ? 'bg-red-950/50 border-red-500 text-red-200 animate-pulse'
              : 'bg-cat-darker/80 border-cat-border/80'
          }`}
          onClick={onToggleSeatbelt}
          title="Click to toggle seatbelt sensor"
        >
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className={isSeatbeltOff ? 'text-red-400 font-bold' : 'text-cat-gray'}>
              SEATBELT {isSeatbeltOff && '🚨'}
            </span>
            {isSeatbeltOff ? (
              <XCircle className="w-3.5 h-3.5 text-red-500 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <div className="mt-1">
            <span className={`text-base font-bold font-mono uppercase ${isSeatbeltOff ? 'text-red-400' : 'text-emerald-400'}`}>
              {telemetry.seatbeltStatus}
            </span>
          </div>
          <div className="text-[10px] text-cat-gray flex items-center justify-between mt-0.5">
            <span>Click to toggle</span>
            <span className="text-cat-yellow underline text-[9px]">Sensor Test</span>
          </div>
        </div>

        {/* Engine RPM & Hydraulic Temp */}
        <div className="bg-cat-darker/80 border border-cat-border/80 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-cat-gray text-[11px] font-mono">
            <span>ENGINE RPM / TEMP</span>
            <Gauge className="w-3.5 h-3.5 text-cat-yellow" />
          </div>
          <div className="mt-1 flex items-baseline justify-between font-mono">
            <span className="text-lg font-bold text-white">{telemetry.engineRpm || machine.engineRpm}</span>
            <span className="text-xs text-cat-yellow">{machine.hydraulicTempC}°C</span>
          </div>
          <div className="text-[10px] text-cat-gray truncate mt-0.5">
            Pressure: {telemetry.hydraulicPressurePsi || 4500} PSI
          </div>
        </div>
      </div>
    </div>
  )
}
