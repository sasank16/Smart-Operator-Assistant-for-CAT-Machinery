import React from 'react'
import { CatMachine } from '../types'
import {
  ShieldAlert,
  HardHat,
  Activity,
  CalendarCheck,
  BrainCircuit,
  GraduationCap,
  Database,
  Radio,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react'

interface NavbarProps {
  machines: CatMachine[]
  selectedMachine: CatMachine
  onSelectMachine: (m: CatMachine) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  seatbeltFastened: boolean
  hasActiveAlert: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  machines,
  selectedMachine,
  onSelectMachine,
  activeTab,
  setActiveTab,
  seatbeltFastened,
  hasActiveAlert
}) => {
  return (
    <header className="sticky top-0 z-50 bg-cat-black/95 backdrop-blur-md border-b border-cat-border shadow-xl">
      {/* Top Hazard Accent Stripe */}
      <div className="h-1.5 w-full hazard-stripes" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & App Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-11 h-11 bg-cat-yellow rounded-lg shadow-md font-display text-cat-black font-black text-2xl tracking-tighter border-2 border-black">
              CAT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-lg text-white tracking-wide uppercase">
                  Smart Operator Assistant
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-cat-yellow/20 text-cat-yellow border border-cat-yellow/40 rounded uppercase">
                  Companion AI
                </span>
              </div>
              <p className="text-xs text-cat-gray font-mono">Heavy Machinery Telematics & Safety System</p>
            </div>
          </div>

          {/* Universal Machine Switcher Dropdown */}
          <div className="relative group">
            <div className="flex items-center space-x-2 bg-cat-card hover:bg-cat-card2 border border-cat-border hover:border-cat-yellow rounded-lg px-3 py-1.5 cursor-pointer transition-all shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-cat-success animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-cat-gray font-mono uppercase">Connected Fleet Unit</span>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {selectedMachine.model} <span className="text-cat-yellow font-normal">({selectedMachine.id})</span>
                  <ChevronDown className="w-3.5 h-3.5 text-cat-gray group-hover:text-cat-yellow" />
                </span>
              </div>
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-72 bg-cat-darker border border-cat-border rounded-xl shadow-2xl p-2 hidden group-hover:block z-50">
              <div className="px-3 py-1.5 text-[11px] font-mono uppercase text-cat-gray border-b border-cat-border/60">
                Select CAT Machine Class
              </div>
              <div className="space-y-1 mt-1">
                {machines.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectMachine(m)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                      m.id === selectedMachine.id
                        ? 'bg-cat-yellow text-cat-black font-bold'
                        : 'text-gray-300 hover:bg-cat-card hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{m.model}</div>
                      <div className={`text-[10px] ${m.id === selectedMachine.id ? 'text-black/80' : 'text-cat-gray'}`}>
                        {m.name} • {m.powerHp} HP
                      </div>
                    </div>
                    <span className="font-mono text-[10px] opacity-75">{m.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Operator Status & Safety Beacon */}
          <div className="flex items-center space-x-4">
            {/* Seatbelt Sensor Pill */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
                seatbeltFastened
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-600/40'
                  : 'bg-red-950/80 text-red-400 border-red-500 animate-pulse'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${seatbeltFastened ? 'bg-emerald-400' : 'bg-red-500'}`} />
              <span>{seatbeltFastened ? 'SEATBELT FASTENED' : 'SEATBELT OFF'}</span>
            </div>

            {/* Operator ID */}
            <div className="hidden sm:flex items-center space-x-2 bg-cat-card border border-cat-border px-3 py-1.5 rounded-lg">
              <HardHat className="w-4 h-4 text-cat-yellow" />
              <div className="text-left font-mono">
                <span className="text-[10px] text-cat-gray block leading-none">OPERATOR</span>
                <span className="text-xs font-bold text-white">OP1001 (A. Mercer)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-cat-border/40 scrollbar-none">
          {[
            { id: 'cockpit', label: '3D Cockpit & Twin', icon: Radio },
            { id: 'tasks', label: 'Daily Task Dashboard', icon: CalendarCheck },
            { id: 'safety', label: 'Safety & Proximity Hazards', icon: ShieldAlert, alert: hasActiveAlert },
            { id: 'anomalies', label: 'Anomaly & Idling Detection', icon: Activity },
            { id: 'predictor', label: 'Task Time ML Predictor', icon: BrainCircuit },
            { id: 'training', label: 'Operator Training Hub', icon: GraduationCap },
            { id: 'telemetry', label: 'Dataset Telemetry Logs', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cat-yellow text-cat-black shadow font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-cat-card'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cat-black' : 'text-cat-yellow'}`} />
                <span>{tab.label}</span>
                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-cat-danger animate-ping" />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
