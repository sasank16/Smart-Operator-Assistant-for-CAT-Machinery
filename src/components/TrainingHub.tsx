import React, { useState } from 'react'
import { TrainingModule, PreCheckItem, CatMachine } from '../types'
import { TRAINING_MODULES, PRE_CHECK_ITEMS } from '../data/mockData'
import {
  GraduationCap,
  PlayCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Video,
  Clock,
  BookOpen,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react'

interface TrainingHubProps {
  machine: CatMachine
}

export const TrainingHub: React.FC<TrainingHubProps> = ({ machine }) => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'elearning' | 'instructor' | 'certification'>('simulation')
  const [preChecks, setPreChecks] = useState<PreCheckItem[]>(PRE_CHECK_ITEMS)
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(TRAINING_MODULES[0])
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [instructorSlot, setInstructorSlot] = useState('Tomorrow, 09:30 AM')

  const toggleCheck = (id: string, status: boolean) => {
    setPreChecks(prev =>
      prev.map(item => (item.id === id ? { ...item, passed: status } : item))
    )
  }

  const passedChecksCount = preChecks.filter(c => c.passed === true).length
  const allChecksComplete = preChecks.every(c => c.passed !== null)
  const allPassed = preChecks.every(c => c.passed === true)

  const handleBookInstructor = (e: React.FormEvent) => {
    e.preventDefault()
    setBookingSuccess(true)
    setTimeout(() => setBookingSuccess(false), 5000)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-cat-card border border-cat-border rounded-2xl p-5 shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-cat-yellow" /> Operator Training & Simulation Hub
              </span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-cat-yellow/20 text-cat-yellow border border-cat-yellow/40 rounded uppercase">
                Caterpillar University
              </span>
            </div>
            <p className="text-xs text-cat-gray font-mono mt-1">
              Multi-format learning center: pre-shift walk-around simulation, video micro-courses, and 1-on-1 instructor coaching.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex bg-cat-darker p-1 rounded-xl border border-cat-border space-x-1">
            {[
              { id: 'simulation', label: '1. Walk-Around Simulator', icon: ShieldCheck },
              { id: 'elearning', label: '2. E-Learning Modules', icon: Video },
              { id: 'instructor', label: '3. Book Instructor', icon: Calendar },
              { id: 'certification', label: '4. Skill Badges', icon: Award }
            ].map(tab => {
              const Icon = tab.icon
              const isSel = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSel
                      ? 'bg-cat-yellow text-cat-black font-bold shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab 1: Walk-Around Pre-Inspection Simulator */}
      {activeTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inspection Items List */}
          <div className="lg:col-span-7 bg-cat-card border border-cat-border rounded-2xl p-5 shadow space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cat-border/60">
              <div>
                <h3 className="font-heading text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cat-yellow" /> Pre-Shift Machine Walk-Around Inspection
                </h3>
                <p className="text-xs text-cat-gray font-mono">
                  Mandatory OSHA & CAT 360° Safety Verification Checklist
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-cat-yellow bg-cat-darker px-2.5 py-1 rounded border border-cat-border">
                {passedChecksCount} / {preChecks.length} Passed
              </span>
            </div>

            <div className="space-y-3">
              {preChecks.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.passed === true
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : item.passed === false
                      ? 'bg-red-950/30 border-red-500/60'
                      : 'bg-cat-darker border-cat-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cat-black text-cat-yellow border border-cat-border">
                          {item.area}
                        </span>
                        <h4 className="text-xs font-bold text-white">{item.title}</h4>
                        {item.critical && (
                          <span className="text-[9px] font-mono text-red-400 border border-red-500/40 px-1 rounded uppercase">
                            Critical
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-cat-gray mt-1">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button
                        onClick={() => toggleCheck(item.id, true)}
                        className={`p-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                          item.passed === true
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-cat-card text-gray-300 border-cat-border hover:border-emerald-500 hover:text-emerald-400'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                      </button>
                      <button
                        onClick={() => toggleCheck(item.id, false)}
                        className={`p-1.5 rounded-lg border text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                          item.passed === false
                            ? 'bg-red-600 text-white border-red-500'
                            : 'bg-cat-card text-gray-300 border-cat-border hover:border-red-500 hover:text-red-400'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Fail
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Verification Sign-off */}
            <div className="pt-3 border-t border-cat-border flex items-center justify-between">
              <span className="text-xs text-cat-gray font-mono">
                Operator Sign-off: <strong>Alex Mercer (OP1001)</strong>
              </span>
              <button
                disabled={!allChecksComplete}
                onClick={() => alert('Pre-Shift Inspection Cleared: Engine ignition lock released.')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all font-mono ${
                  allChecksComplete && allPassed
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow'
                    : 'bg-cat-darker text-cat-gray cursor-not-allowed border border-cat-border'
                }`}
              >
                {allPassed ? 'Authorize Machine Operation' : 'Resolve Critical Items First'}
              </button>
            </div>
          </div>

          {/* Interactive 3D Inspection Diagram Guide */}
          <div className="lg:col-span-5 bg-cat-card border border-cat-border rounded-2xl p-5 shadow flex flex-col justify-between">
            <div>
              <h3 className="font-heading text-base font-bold text-white uppercase tracking-wide flex items-center gap-2 pb-3 border-b border-cat-border/60">
                <Sparkles className="w-4 h-4 text-cat-yellow" /> Walk-Around Simulation Hotspots
              </h3>

              <div className="relative mt-4 bg-cat-darker rounded-xl p-4 border border-cat-border flex flex-col items-center justify-center">
                <div className="w-full text-center py-6">
                  <div className="text-4xl mb-2">🚜</div>
                  <div className="font-heading font-bold text-white text-base">{machine.model}</div>
                  <div className="text-xs text-cat-gray font-mono">{machine.category}</div>
                </div>

                <div className="w-full space-y-2 mt-2 text-xs font-mono">
                  <div className="p-2 bg-cat-card rounded border border-cat-border flex items-center justify-between">
                    <span>1. Engine Bay (Dipstick & Coolant)</span>
                    <span className="text-emerald-400">PASSED</span>
                  </div>
                  <div className="p-2 bg-cat-card rounded border border-cat-border flex items-center justify-between">
                    <span>2. Hydraulic Cylinders & Line Pressure</span>
                    <span className="text-emerald-400">PASSED</span>
                  </div>
                  <div className="p-2 bg-cat-card rounded border border-cat-border flex items-center justify-between">
                    <span>3. In-Cab Seatbelt & Emergency E-Stop</span>
                    <span className="text-red-400 font-bold">DEFECT FLAGGED</span>
                  </div>
                  <div className="p-2 bg-cat-card rounded border border-cat-border flex items-center justify-between">
                    <span>4. Tracks / Undercarriage Tension</span>
                    <span className="text-cat-yellow">PENDING</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-cat-darker rounded-xl border border-cat-yellow/30 text-xs font-mono text-gray-300">
              <span className="text-cat-yellow font-bold block mb-1">Safety Note:</span>
              CAT safety guidelines mandate testing horn, backup alarm, and seatbelt lock before turning key to START position.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: E-Learning Micro-Video Modules */}
      {activeTab === 'elearning' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Video List */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-mono uppercase text-cat-gray tracking-wider">
              Assigned Video Curriculum
            </h3>
            {TRAINING_MODULES.map((mod) => (
              <div
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedModule?.id === mod.id
                    ? 'bg-cat-card border-cat-yellow shadow-md'
                    : 'bg-cat-card/60 border-cat-border hover:bg-cat-card'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cat-darker text-cat-yellow border border-cat-border">
                      {mod.category}
                    </span>
                    <h4 className="font-bold text-white text-sm mt-1">{mod.title}</h4>
                  </div>
                  <PlayCircle className="w-5 h-5 text-cat-yellow shrink-0 ml-2" />
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-cat-gray font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {mod.durationMin} mins
                  </span>
                  <span>•</span>
                  <span>{mod.level}</span>
                  <span>•</span>
                  <span className={mod.completed ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                    {mod.completed ? '100% Completed' : `${mod.progressPct}% in progress`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Video Player & Takeaways */}
          <div className="lg:col-span-7 bg-cat-card border border-cat-border rounded-2xl p-6 shadow">
            {selectedModule ? (
              <div className="space-y-4">
                {/* Simulated Video Player Screen */}
                <div className="relative w-full h-64 bg-cat-black rounded-xl overflow-hidden border border-cat-border flex items-center justify-center group">
                  <img
                    src={selectedModule.thumbnail}
                    alt={selectedModule.title}
                    className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                  <button
                    onClick={() => alert(`Starting video stream for "${selectedModule.title}"`)}
                    className="relative z-10 w-16 h-16 rounded-full bg-cat-yellow text-cat-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <PlayCircle className="w-10 h-10 fill-current" />
                  </button>
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-xs font-mono text-white">
                    <span>{selectedModule.title}</span>
                    <span>{selectedModule.durationMin}:00 HD</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-heading text-lg font-bold text-white">{selectedModule.title}</h3>
                  <p className="text-xs text-gray-300 mt-1">{selectedModule.description}</p>
                </div>

                <div className="p-4 bg-cat-darker rounded-xl border border-cat-border space-y-2 text-xs font-mono">
                  <div className="text-cat-yellow font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Key Field Takeaways:
                  </div>
                  {selectedModule.keyLearnings.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-gray-300">
                      <span className="text-cat-yellow font-bold">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => alert('Certificate of Completion recorded on Caterpillar University server!')}
                    className="px-5 py-2.5 bg-cat-yellow hover:bg-cat-yellow-dark text-cat-black font-bold rounded-lg text-xs uppercase tracking-wider font-mono shadow"
                  >
                    Complete & Claim CEU Credit
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Tab 3: Instructor Booking */}
      {activeTab === 'instructor' && (
        <div className="max-w-2xl mx-auto bg-cat-card border border-cat-border rounded-2xl p-6 shadow space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-cat-border/60">
            <div className="p-2.5 rounded-xl bg-cat-yellow text-cat-black">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wide">
                Book Caterpillar Certified Instructor
              </h3>
              <p className="text-xs text-cat-gray font-mono">
                1-on-1 Virtual In-Cab Mentoring or On-Site Equipment Field Coaching
              </p>
            </div>
          </div>

          {bookingSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-mono rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Session confirmed for <strong>{instructorSlot}</strong> with Senior Instructor Dave Miller (CAT Peoria).</span>
            </div>
          )}

          <form onSubmit={handleBookInstructor} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-cat-gray uppercase mb-1">Select Mentor Specialization</label>
              <select className="w-full bg-cat-darker border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden">
                <option>Excavator Precision Grade & 3D GPS Guidance</option>
                <option>Eco-Operating & Fuel Burn Minimization</option>
                <option>Extreme Weather Earthmoving & Safety Management</option>
                <option>Wheel Loader Aggregate Weighing & Production Measurement</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-cat-gray uppercase mb-1">Instructor Preference</label>
                <select className="w-full bg-cat-darker border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden">
                  <option>Dave Miller (CAT Senior Certified Instructor)</option>
                  <option>Sarah Jenkins (Hydraulic Systems Specialist)</option>
                  <option>Robert Kovacs (Production Trenching Specialist)</option>
                </select>
              </div>

              <div>
                <label className="block text-cat-gray uppercase mb-1">Available Coaching Slot</label>
                <select
                  value={instructorSlot}
                  onChange={(e) => setInstructorSlot(e.target.value)}
                  className="w-full bg-cat-darker border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                >
                  <option>Tomorrow, 09:30 AM</option>
                  <option>Tomorrow, 02:00 PM</option>
                  <option>Friday, 10:00 AM</option>
                  <option>Next Monday, 08:00 AM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-cat-gray uppercase mb-1">Coaching Objective / Specific Questions</label>
              <textarea
                rows={3}
                placeholder="e.g. Need assistance with bench slopes and reducing cycle hesitations in rainy soil..."
                className="w-full bg-cat-darker border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cat-yellow hover:bg-cat-yellow-dark text-cat-black font-bold uppercase tracking-wider rounded-lg text-xs font-mono shadow-lg transition-all"
            >
              Confirm 1-on-1 Instructor Booking
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Certification Badges & Progression */}
      {activeTab === 'certification' && (
        <div className="bg-cat-card border border-cat-border rounded-2xl p-6 shadow space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-cat-border/60">
            <div>
              <h3 className="font-heading text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <Award className="w-5 h-5 text-cat-yellow" /> Operator Certification & Mastery Tier
              </h3>
              <p className="text-xs text-cat-gray font-mono">
                Operator ID: OP1001 (Alex Mercer) • Level: Intermediate Technician
              </p>
            </div>
            <span className="text-xs font-mono text-cat-yellow bg-cat-darker px-3 py-1.5 rounded border border-cat-yellow/40">
              Level 3 Operator
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Zero Idle Champion', desc: 'Maintained idle below 15% across 40 hours of operations', unlocked: true, icon: '⚡' },
              { title: 'Seatbelt 100% Shield', desc: 'Consecutive 100 shifts with zero unbuckled movements', unlocked: true, icon: '🛡️' },
              { title: 'Grade 3D Master', desc: 'Achieved sub-centimeter trench grading accuracy', unlocked: true, icon: '📐' },
              { title: 'Master Excavator Instructor', desc: 'Complete 15 advanced simulator modules and 500 bucket hours', unlocked: false, icon: '👑' }
            ].map((badge, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border text-center flex flex-col items-center justify-between ${
                  badge.unlocked
                    ? 'bg-cat-darker border-cat-yellow/50 shadow-md'
                    : 'bg-cat-darker/40 border-cat-border/40 opacity-50'
                }`}
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div>
                  <h4 className="font-bold text-white text-xs">{badge.title}</h4>
                  <p className="text-[11px] text-cat-gray mt-1 leading-snug">{badge.desc}</p>
                </div>
                <span
                  className={`mt-3 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    badge.unlocked ? 'bg-cat-yellow text-cat-black' : 'bg-cat-card text-cat-gray'
                  }`}
                >
                  {badge.unlocked ? 'Earned' : 'In Progress'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
