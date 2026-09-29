import React, { useState } from 'react'
import { TaskRecord, CatMachine } from '../types'
import {
  Calendar,
  CheckCircle,
  Clock,
  Play,
  Pause,
  Plus,
  Sun,
  CloudRain,
  Cloud,
  Wind,
  Layers,
  MapPin,
  Flame,
  Award,
  Filter
} from 'lucide-react'

interface TaskDashboardProps {
  tasks: TaskRecord[]
  activeMachine: CatMachine
  onUpdateTaskStatus: (taskId: string, newStatus: TaskRecord['status']) => void
  onAddNewTask: (task: TaskRecord) => void
  onSelectTaskForPrediction: (task: TaskRecord) => void
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({
  tasks,
  activeMachine,
  onUpdateTaskStatus,
  onAddNewTask,
  onSelectTaskForPrediction
}) => {
  const [filter, setFilter] = useState<'All' | 'In Progress' | 'Scheduled' | 'Completed'>('All')
  const [showAddModal, setShowAddModal] = useState(false)

  // New task form state
  const [newTaskType, setNewTaskType] = useState<TaskRecord['taskType']>('Earth Excavation')
  const [newWeather, setNewWeather] = useState<TaskRecord['weather']>('Sunny')
  const [newSkill, setNewSkill] = useState<TaskRecord['operatorSkill']>('Intermediate')
  const [newZone, setNewZone] = useState('Sector 3 - Trench Line West')
  const [newTargetTons, setNewTargetTons] = useState(90)
  const [newEstimatedMin, setNewEstimatedMin] = useState(50)
  const [newPriority, setNewPriority] = useState<TaskRecord['priority']>('High')

  const filteredTasks = tasks.filter(t => filter === 'All' || t.status === filter)

  const completedCount = tasks.filter(t => t.status === 'Completed').length
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length
  const totalVolume = tasks.reduce((acc, t) => acc + t.targetVolumeTons, 0)
  const completedVolume = tasks.reduce((acc, t) => acc + t.completedVolumeTons, 0)

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    const newTask: TaskRecord = {
      taskId: `T${(tasks.length + 1).toString().padStart(3, '0')}`,
      taskType: newTaskType,
      weather: newWeather,
      operatorSkill: newSkill,
      machineAgeYrs: activeMachine.ageYears,
      estimatedTimeMin: newEstimatedMin,
      status: 'Scheduled',
      priority: newPriority,
      siteZone: newZone,
      targetVolumeTons: newTargetTons,
      completedVolumeTons: 0,
      assignedMachineId: activeMachine.id,
      assignedOperator: 'Alex Mercer (OP1001)'
    }
    onAddNewTask(newTask)
    setShowAddModal(false)
  }

  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'Sunny': return <Sun className="w-4 h-4 text-amber-400" />
      case 'Rainy': return <CloudRain className="w-4 h-4 text-blue-400" />
      case 'Cloudy': return <Cloud className="w-4 h-4 text-gray-400" />
      case 'Windy': return <Wind className="w-4 h-4 text-teal-400" />
      default: return <Sun className="w-4 h-4 text-amber-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-cat-card border border-cat-border rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-xs text-cat-gray font-mono">
            <span>DAILY WORK ORDERS</span>
            <Calendar className="w-4 h-4 text-cat-yellow" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-white">{tasks.length}</span>
            <span className="text-xs text-emerald-400 font-mono font-semibold">
              {completedCount} Completed / {inProgressCount} Active
            </span>
          </div>
          <div className="text-xs text-cat-gray mt-1">Shift Hours: 08:00 - 17:00</div>
        </div>

        <div className="bg-cat-card border border-cat-border rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-xs text-cat-gray font-mono">
            <span>PAYLOAD / VOLUME GOAL</span>
            <Layers className="w-4 h-4 text-cat-yellow" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-white">{completedVolume}</span>
            <span className="text-xs text-cat-gray font-mono">/ {totalVolume} Tons</span>
          </div>
          <div className="w-full bg-cat-border h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cat-yellow h-full rounded-full transition-all"
              style={{ width: `${Math.round((completedVolume / totalVolume) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-cat-card border border-cat-border rounded-xl p-4 shadow">
          <div className="flex items-center justify-between text-xs text-cat-gray font-mono">
            <span>OPERATOR EFFICIENCY</span>
            <Award className="w-4 h-4 text-cat-yellow" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-emerald-400">96.4%</span>
            <span className="text-xs text-cat-gray font-mono">Benchmark: 90%</span>
          </div>
          <div className="text-xs text-emerald-400 mt-1">Cat Grade 3D Assist Active</div>
        </div>

        <div className="bg-cat-card border border-cat-border rounded-xl p-4 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-cat-gray font-mono">
            <span>QUICK ACTION</span>
            <Plus className="w-4 h-4 text-cat-yellow" />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-2.5 px-4 bg-cat-yellow hover:bg-cat-yellow-dark text-cat-black font-bold rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Work Order
          </button>
          <div className="text-[10px] text-cat-gray text-center font-mono">Assigned to {activeMachine.id}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-cat-card border border-cat-border rounded-xl p-3">
        <div className="flex items-center space-x-1">
          <Filter className="w-4 h-4 text-cat-gray mr-2" />
          {(['All', 'In Progress', 'Scheduled', 'Completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                filter === tab
                  ? 'bg-cat-yellow text-cat-black shadow'
                  : 'text-gray-300 hover:text-white hover:bg-cat-darker'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="text-xs text-cat-gray font-mono">
          Showing <span className="text-white font-bold">{filteredTasks.length}</span> scheduled operations
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTasks.map((task) => {
          const isComplete = task.status === 'Completed'
          const isInProgress = task.status === 'In Progress'
          const progressPct = Math.round((task.completedVolumeTons / task.targetVolumeTons) * 100)

          return (
            <div
              key={task.taskId}
              className={`cat-panel rounded-xl p-4 transition-all border ${
                isInProgress
                  ? 'border-cat-yellow/60 shadow-lg shadow-cat-yellow/5'
                  : 'border-cat-border hover:border-cat-borderLight'
              }`}
            >
              {/* Task Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-cat-darker text-cat-yellow border border-cat-border rounded">
                      {task.taskId}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-white tracking-wide">
                      {task.taskType}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-cat-gray mt-1">
                    <MapPin className="w-3.5 h-3.5 text-cat-yellow" />
                    <span>{task.siteZone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Priority */}
                  <span
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded ${
                      task.priority === 'Critical'
                        ? 'bg-red-950/80 text-red-400 border border-red-500/50'
                        : task.priority === 'High'
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-500/50'
                        : 'bg-blue-950/80 text-blue-400 border border-blue-500/50'
                    }`}
                  >
                    {task.priority}
                  </span>

                  {/* Status */}
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isComplete
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                        : isInProgress
                        ? 'bg-cat-yellow text-cat-black font-bold animate-pulse'
                        : 'bg-cat-darker text-cat-gray border border-cat-border'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>

              {/* Conditions Row */}
              <div className="grid grid-cols-3 gap-2 my-3 p-2 bg-cat-darker/60 rounded-lg text-xs font-mono border border-cat-border/40">
                <div className="flex items-center gap-1.5">
                  {getWeatherIcon(task.weather)}
                  <span className="text-gray-300">{task.weather}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-cat-gray text-[10px] block">SKILL</span>
                  <span>{task.operatorSkill}</span>
                </div>
                <div className="text-gray-300">
                  <span className="text-cat-gray text-[10px] block">MACHINE AGE</span>
                  <span>{task.machineAgeYrs} yrs</span>
                </div>
              </div>

              {/* Progress & Time */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-gray-300">
                  <span>Volume Progress</span>
                  <span className="font-bold text-white">
                    {task.completedVolumeTons} / {task.targetVolumeTons} Tons ({progressPct}%)
                  </span>
                </div>
                <div className="w-full bg-cat-darker h-2 rounded-full overflow-hidden border border-cat-border/60">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isComplete ? 'bg-emerald-500' : 'bg-cat-yellow'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-cat-gray pt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cat-yellow" />
                    <span>Est: <strong className="text-white">{task.estimatedTimeMin} min</strong></span>
                  </div>
                  {task.actualTimeMin && (
                    <div>
                      Actual: <strong className={task.actualTimeMin > task.estimatedTimeMin ? 'text-amber-400' : 'text-emerald-400'}>
                        {task.actualTimeMin} min
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-cat-border/40">
                <button
                  onClick={() => onSelectTaskForPrediction(task)}
                  className="text-xs text-cat-yellow hover:underline flex items-center gap-1 font-mono"
                >
                  ⚡ Open ML Time Estimator
                </button>

                <div className="flex items-center gap-2">
                  {isInProgress ? (
                    <button
                      onClick={() => onUpdateTaskStatus(task.taskId, 'Completed')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Done
                    </button>
                  ) : !isComplete ? (
                    <button
                      onClick={() => onUpdateTaskStatus(task.taskId, 'In Progress')}
                      className="px-3 py-1.5 bg-cat-yellow hover:bg-cat-yellow-dark text-cat-black text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Start Task
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateTaskStatus(task.taskId, 'In Progress')}
                      className="px-3 py-1.5 bg-cat-darker hover:bg-cat-card text-cat-gray text-xs rounded-lg border border-cat-border"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add New Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-cat-darker border border-cat-yellow/60 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="font-heading text-xl font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cat-yellow" /> Create Daily Work Order
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-cat-gray uppercase mb-1">Task Type</label>
                <select
                  value={newTaskType}
                  onChange={(e) => setNewTaskType(e.target.value as any)}
                  className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                >
                  <option value="Earth Excavation">Earth Excavation</option>
                  <option value="Trenching">Trenching</option>
                  <option value="Material Loading">Material Loading</option>
                  <option value="Grading">Grading</option>
                  <option value="Demolition">Demolition</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-cat-gray uppercase mb-1">Weather Forecast</label>
                  <select
                    value={newWeather}
                    onChange={(e) => setNewWeather(e.target.value as any)}
                    className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                  >
                    <option value="Sunny">Sunny</option>
                    <option value="Rainy">Rainy</option>
                    <option value="Cloudy">Cloudy</option>
                    <option value="Windy">Windy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-cat-gray uppercase mb-1">Operator Skill</label>
                  <select
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value as any)}
                    className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                  >
                    <option value="Expert">Expert</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Beginner">Beginner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-cat-gray uppercase mb-1">Job Site Zone</label>
                <input
                  type="text"
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                  placeholder="e.g. Sector 5 - West Trench"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-cat-gray uppercase mb-1">Target (Tons)</label>
                  <input
                    type="number"
                    value={newTargetTons}
                    onChange={(e) => setNewTargetTons(parseInt(e.target.value) || 0)}
                    className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-cat-gray uppercase mb-1">Estimated Min</label>
                  <input
                    type="number"
                    value={newEstimatedMin}
                    onChange={(e) => setNewEstimatedMin(parseInt(e.target.value) || 0)}
                    className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-cat-gray uppercase mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-cat-card border border-cat-border rounded-lg p-2.5 text-white focus:border-cat-yellow outline-hidden"
                  >
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-cat-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-cat-card hover:bg-cat-border text-gray-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cat-yellow text-cat-black font-bold rounded-lg text-xs hover:bg-cat-yellow-dark uppercase tracking-wider"
                >
                  Save Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
