import React from 'react'
import { TelemetryRecord } from '../types'
import { PROMPT_TELEMETRY_DATA, PROMPT_TASK_DATA } from '../data/mockData'
import { Database, Play, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface HistoricalDataViewerProps {
  onLoadTelemetry: (record: TelemetryRecord) => void
}

export const HistoricalDataViewer: React.FC<HistoricalDataViewerProps> = ({ onLoadTelemetry }) => {
  return (
    <div className="space-y-6">
      {/* Telemetry Dataset Section from Image 1 */}
      <div className="bg-cat-card border border-cat-border rounded-2xl p-5 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-cat-border/60 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-5 h-5 text-cat-yellow" /> Machine Telemetry Log
              </span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-cat-yellow/20 text-cat-yellow border border-cat-yellow/40 rounded uppercase">
                Raw Ground Truth
              </span>
            </div>
            <p className="text-xs text-cat-gray font-mono mt-1">
              Field telematics captured from EXC001 (Operator OP1001). Notice the correlation between Idling &gt; 30m, Unfastened seatbelt, and Safety Alerts.
            </p>
          </div>
          <span className="text-xs font-mono text-cat-yellow bg-cat-darker px-3 py-1.5 rounded border border-cat-border">
            4 Shift Sessions
          </span>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-cat-darker text-cat-gray border-b border-cat-border uppercase">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Machine ID</th>
                <th className="py-3 px-3">Operator ID</th>
                <th className="py-3 px-3">Engine Hours</th>
                <th className="py-3 px-3">Fuel Used (L)</th>
                <th className="py-3 px-3">Load Cycles</th>
                <th className="py-3 px-3">Idling Time (min)</th>
                <th className="py-3 px-3">Seatbelt Status</th>
                <th className="py-3 px-3">Safety Alert</th>
                <th className="py-3 px-3 text-right">Simulator Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cat-border/40">
              {PROMPT_TELEMETRY_DATA.map((row, idx) => {
                const isAlert = row.safetyAlertTriggered === 'Yes'
                const isUnfastened = row.seatbeltStatus === 'Unfastened'
                const isExcessiveIdle = row.idlingTimeMin >= 30

                return (
                  <tr
                    key={idx}
                    className={`transition-all hover:bg-cat-darker/70 ${
                      isAlert ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-white">{row.timestamp}</td>
                    <td className="py-3 px-3 text-cat-yellow font-bold">{row.machineId}</td>
                    <td className="py-3 px-3 text-gray-300">{row.operatorId}</td>
                    <td className="py-3 px-3 text-gray-200">{row.engineHours} hrs</td>
                    <td className="py-3 px-3 text-gray-200">{row.fuelUsedL} L</td>
                    <td className="py-3 px-3 text-gray-200 font-semibold">{row.loadCycles}</td>
                    <td className="py-3 px-3">
                      <span className={isExcessiveIdle ? 'text-amber-400 font-bold' : 'text-gray-300'}>
                        {row.idlingTimeMin} min {isExcessiveIdle && '⚠️'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isUnfastened
                            ? 'bg-red-950 text-red-400 border border-red-500/40'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {row.seatbeltStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isAlert
                            ? 'bg-red-600 text-white font-black animate-pulse'
                            : 'bg-cat-darker text-cat-gray border border-cat-border'
                        }`}
                      >
                        {row.safetyAlertTriggered}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onLoadTelemetry(row)}
                        className="px-2.5 py-1 bg-cat-yellow hover:bg-cat-yellow-dark text-cat-black font-bold rounded flex items-center gap-1 ml-auto text-[11px] shadow transition-all active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" /> Replay in Cockpit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-cat-darker rounded-xl border border-cat-border flex items-start gap-2.5 text-xs text-cat-gray font-mono">
          <Info className="w-4 h-4 text-cat-yellow shrink-0 mt-0.5" />
          <span>
            Clicking <strong>"Replay in Cockpit"</strong> updates the active gauges, triggers or resets the safety alarm, and reflects the exact machine state from that timestamp in the 3D twin.
          </span>
        </div>
      </div>

      {/* Task Time Ground Truth Table from Image 2 */}
      <div className="bg-cat-card border border-cat-border rounded-2xl p-5 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-cat-border/60 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-5 h-5 text-cat-yellow" /> Task Estimation Dataset
              </span>
            </div>
            <p className="text-xs text-cat-gray font-mono mt-1">
              Field task durations with environmental conditions (Weather, Operator Skill, Machine Age).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs font-mono text-left">
            <thead className="bg-cat-darker text-cat-gray border-b border-cat-border uppercase">
              <tr>
                <th className="py-3 px-3">Task ID</th>
                <th className="py-3 px-3">Task Type</th>
                <th className="py-3 px-3">Weather</th>
                <th className="py-3 px-3">Operator Skill</th>
                <th className="py-3 px-3">Machine Age</th>
                <th className="py-3 px-3">Estimated Time</th>
                <th className="py-3 px-3 text-cat-yellow">Actual Time</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cat-border/40">
              {PROMPT_TASK_DATA.map((t) => (
                <tr key={t.taskId} className="hover:bg-cat-darker/60">
                  <td className="py-3 px-3 font-bold text-cat-yellow">{t.taskId}</td>
                  <td className="py-3 px-3 font-semibold text-white">{t.taskType}</td>
                  <td className="py-3 px-3">{t.weather}</td>
                  <td className="py-3 px-3">{t.operatorSkill}</td>
                  <td className="py-3 px-3">{t.machineAgeYrs} yrs</td>
                  <td className="py-3 px-3 text-gray-400">{t.estimatedTimeMin} min</td>
                  <td className="py-3 px-3 font-bold text-emerald-400">{t.actualTimeMin} min</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cat-darker text-gray-300 border border-cat-border">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
