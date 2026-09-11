import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Edit3, MapPin, User, Calendar, Filter, Users, AlertTriangle, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import type { Subject, Profile, TimetableSlot, DayOfWeek } from '../../types'

interface TimetableManagementProps {
  subjects: Subject[]
  faculties: Profile[]
  timetable: TimetableSlot[]
  onAddSlot: (slot: Omit<TimetableSlot, 'id'>) => TimetableSlot
  onUpdateSlot: (slotId: string, updates: Partial<Omit<TimetableSlot, 'id'>>) => void
  onRemoveSlot: (slotId: string) => void
}

const DAYS: { id: DayOfWeek; label: string; short: string }[] = [
  { id: 'mon', label: 'Monday', short: 'Mon' },
  { id: 'tue', label: 'Tuesday', short: 'Tue' },
  { id: 'wed', label: 'Wednesday', short: 'Wed' },
  { id: 'thu', label: 'Thursday', short: 'Thu' },
  { id: 'fri', label: 'Friday', short: 'Fri' },
  { id: 'sat', label: 'Saturday', short: 'Sat' },
]

const TIME_SLOTS = ['09:00', '10:15', '11:30', '14:00']

export function TimetableManagement({
  subjects,
  faculties,
  timetable,
  onAddSlot,
  onUpdateSlot,
  onRemoveSlot,
}: TimetableManagementProps) {
  const [selectedDept, setSelectedDept] = useState<string>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null)

  // Form state
  const [formData, setFormData] = useState<{
    subject_id: string
    day: DayOfWeek
    start_time: string
    end_time: string
    room: string
    type: 'lecture' | 'lab' | 'tutorial'
  }>({
    subject_id: '',
    day: 'mon',
    start_time: '09:00',
    end_time: '10:00',
    room: '',
    type: 'lecture',
  })

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Extract unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>()
    subjects.forEach((s) => {
      if (s.department) depts.add(s.department)
    })
    faculties.forEach((f) => {
      if (f.department) depts.add(f.department)
    })
    return ['All', ...Array.from(depts)]
  }, [subjects, faculties])

  // Filtered lists
  const filteredSubjects = useMemo(() => {
    if (selectedDept === 'All') return subjects
    return subjects.filter((s) => s.department === selectedDept)
  }, [subjects, selectedDept])

  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>()
    subjects.forEach((s) => map.set(s.id, s))
    return map
  }, [subjects])

  // Filtered timetable slots by selected department
  const filteredTimetable = useMemo(() => {
    if (selectedDept === 'All') return timetable
    return timetable.filter((slot) => {
      const subj = subjectMap.get(slot.subject_id)
      return subj && subj.department === selectedDept
    })
  }, [timetable, selectedDept, subjectMap])

  const handleCellClick = (day: DayOfWeek, startTime: string) => {
    let endTime = '10:00'
    if (startTime === '09:00') endTime = '10:00'
    else if (startTime === '10:15') endTime = '11:15'
    else if (startTime === '11:30') endTime = '12:30'
    else if (startTime === '14:00') endTime = '15:00'

    setEditingSlot(null)
    setFormData({
      subject_id: filteredSubjects[0]?.id || subjects[0]?.id || '',
      day,
      start_time: startTime,
      end_time: endTime,
      room: 'CS-201',
      type: 'lecture',
    })
    setIsModalOpen(true)
  }

  const handleEditClick = (e: React.MouseEvent, slot: TimetableSlot) => {
    e.stopPropagation()
    setEditingSlot(slot)
    setFormData({
      subject_id: slot.subject_id,
      day: slot.day,
      start_time: slot.start_time,
      end_time: slot.end_time,
      room: slot.room,
      type: slot.type || 'lecture',
    })
    setIsModalOpen(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, slotId: string) => {
    e.stopPropagation()
    setDeleteConfirm(slotId)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      onRemoveSlot(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  const handleSave = () => {
    if (!formData.subject_id || !formData.day || !formData.start_time || !formData.end_time || !formData.room) {
      return
    }

    if (editingSlot) {
      onUpdateSlot(editingSlot.id, formData)
    } else {
      onAddSlot(formData)
    }
    setIsModalOpen(false)
  }

  const getSlot = (day: DayOfWeek, time: string) => {
    return filteredTimetable.filter((t) => t.day === day && t.start_time === time)
  }

  // Calculate faculty weekly workload from assigned timetable slots
  const facultyLoad = useMemo(() => {
    const load: Record<string, { count: number; hours: number; courses: Set<string> }> = {}

    faculties.forEach((f) => {
      load[f.id] = { count: 0, hours: 0, courses: new Set() }
    })

    timetable.forEach((slot) => {
      const subj = subjectMap.get(slot.subject_id)
      if (subj && subj.faculty_id && load[subj.faculty_id]) {
        load[subj.faculty_id].count += 1
        load[subj.faculty_id].courses.add(subj.code)

        const [sH, sM] = slot.start_time.split(':').map(Number)
        const [eH, eM] = slot.end_time.split(':').map(Number)
        const duration = (eH * 60 + eM - (sH * 60 + sM)) / 60
        load[subj.faculty_id].hours += Math.max(0.5, duration)
      }
    })

    return load
  }, [timetable, faculties, subjectMap])

  return (
    <div className="space-y-6">
      {/* Top Controls & Department Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl border border-[#E2E6ED] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#DCE7F8] rounded-xl text-[#2563EB]">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1F1F1F]">Master Timetable & Faculty Scheduling</h2>
            <p className="text-xs text-[#666666]">
              Assign timetable lecture/lab slots to faculty across individual academic departments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#666666]" />
          <span className="text-xs font-semibold text-[#666666]">Department:</span>
          <select
            className="h-9 px-3 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] text-[#1F1F1F] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All Departments' : d}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs gap-1.5 ml-2"
            onClick={() => handleCellClick('mon', '09:00')}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Slot
          </Button>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="bg-white rounded-2xl border border-[#E2E6ED] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            {/* Header row */}
            <div className="grid grid-cols-7 border-b border-[#E2E6ED] bg-[#F5F6F8]">
              <div className="p-3 border-r border-[#E2E6ED] flex items-center justify-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">Time Slot</span>
              </div>
              {DAYS.map((day) => (
                <div key={day.id} className="p-3 border-r border-[#E2E6ED] last:border-0 text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">{day.label}</span>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            {TIME_SLOTS.map((time, idx) => (
              <div
                key={time}
                className={cn('grid grid-cols-7', idx !== TIME_SLOTS.length - 1 && 'border-b border-[#E2E6ED]')}
              >
                <div className="p-3 border-r border-[#E2E6ED] bg-[#F5F6F8] flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-[#1F1F1F]">{time}</span>
                </div>

                {DAYS.map((day) => {
                  const slots = getSlot(day.id, time)

                  return (
                    <div
                      key={`${day.id}-${time}`}
                      className="p-2 border-r border-[#E2E6ED] last:border-0 min-h-[115px] relative group hover:bg-[#F5F6F8]/60 transition-colors cursor-pointer flex flex-col gap-2"
                      onClick={() => handleCellClick(day.id, time)}
                    >
                      {slots.length === 0 ? (
                        <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#2563EB] font-semibold bg-[#DCE7F8] px-2.5 py-1 rounded-lg border border-[#B8CCF0]">
                            <Plus className="w-3 h-3" /> Assign
                          </span>
                        </div>
                      ) : (
                        slots.map((slot) => {
                          const subj = subjectMap.get(slot.subject_id)
                          return (
                            <div
                              key={slot.id}
                              className={cn(
                                'p-2.5 rounded-xl border relative shadow-xs transition-all',
                                slot.type === 'lab'
                                  ? 'bg-cyan-50/70 border-cyan-200'
                                  : slot.type === 'tutorial'
                                  ? 'bg-amber-50/70 border-amber-200'
                                  : 'bg-[#DCE7F8]/50 border-[#B8CCF0]'
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="absolute top-1.5 right-1.5 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 z-10">
                                <button
                                  onClick={(e) => handleEditClick(e, slot)}
                                  className="p-1 rounded-md bg-white text-[#666666] hover:text-[#2563EB] shadow-xs border border-[#E2E6ED]"
                                  title="Edit slot"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteClick(e, slot.id)}
                                  className="p-1 rounded-md bg-white text-[#666666] hover:text-rose-600 shadow-xs border border-[#E2E6ED]"
                                  title="Delete slot"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="font-bold text-[#1F1F1F] text-xs mb-1 pr-12 flex items-center gap-1.5">
                                <span className="font-mono text-[#2563EB]">{subj?.code || 'CS'}</span>
                                <span className="text-[10px] text-[#666666] font-normal truncate">
                                  {subj?.name || 'Class Session'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-[#1F1F1F] font-medium mb-1 truncate">
                                <User className="w-3 h-3 text-[#2563EB] shrink-0" />
                                <span className="truncate">{subj?.faculty_name || 'Unassigned'}</span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-[#666666] font-mono pt-1 border-t border-black/5">
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {slot.room}
                                </span>
                                <span
                                  className={cn(
                                    'uppercase px-1 rounded text-[9px] font-bold',
                                    slot.type === 'lab'
                                      ? 'bg-cyan-200/60 text-cyan-800'
                                      : slot.type === 'tutorial'
                                      ? 'bg-amber-200/60 text-amber-800'
                                      : 'bg-[#B8CCF0]/60 text-[#2563EB]'
                                  )}
                                >
                                  {slot.type || 'Lec'}
                                </span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Faculty Workload Summary */}
      <div className="bg-white rounded-2xl border border-[#E2E6ED] shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[#DCE7F8] rounded-xl text-[#2563EB]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1F1F1F]">Faculty Departmental Workload Matrix</h3>
            <p className="text-xs text-[#666666]">
              Real-time contact hours aggregated across scheduled lecture and laboratory slots.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F5F6F8] text-[#666666] border-b border-[#E2E6ED]">
              <tr>
                <th className="px-4 py-2.5 font-bold uppercase tracking-wider rounded-tl-xl">Faculty Educator</th>
                <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Department</th>
                <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Assigned Courses</th>
                <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Scheduled Slots</th>
                <th className="px-4 py-2.5 font-bold uppercase tracking-wider rounded-tr-xl">Total Contact Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E6ED]">
              {faculties
                .filter((f) => selectedDept === 'All' || f.department === selectedDept)
                .map((faculty) => {
                  const load = facultyLoad[faculty.id]
                  const hours = load?.hours || 0
                  const count = load?.count || 0
                  const courseList = Array.from(load?.courses || [])

                  let loadBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {hours.toFixed(1)} hrs/wk (Optimal)
                    </span>
                  )
                  if (hours === 0) {
                    loadBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
                        0.0 hrs/wk (Unallocated)
                      </span>
                    )
                  } else if (hours > 14) {
                    loadBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" /> {hours.toFixed(1)} hrs/wk (Heavy)
                      </span>
                    )
                  }

                  return (
                    <tr key={faculty.id} className="hover:bg-[#F5F6F8]/60 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#1F1F1F]">
                        {faculty.full_name}
                        <span className="block text-[11px] font-normal text-[#666666]">
                          {faculty.designation || 'Faculty Member'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#666666] font-medium">{faculty.department || 'General'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {courseList.length > 0 ? (
                            courseList.map((c) => (
                              <span
                                key={c}
                                className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#DCE7F8] text-[#2563EB]"
                              >
                                {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-[#999999] italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-[#1F1F1F]">{count} period(s)</td>
                      <td className="px-4 py-3">{loadBadge}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Slot Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-[#E2E6ED] w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[#E2E6ED] bg-[#F5F6F8]">
                <h3 className="font-bold text-[#1F1F1F] text-base">
                  {editingSlot ? 'Edit Timetable Assignment' : 'Assign New Timetable Period'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#666666] hover:text-[#1F1F1F] p-1 rounded-lg hover:bg-[#E2E6ED] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">
                    Course & Faculty
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] text-[#1F1F1F] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  >
                    <option value="">Select course</option>
                    {filteredSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name} ({s.faculty_name || 'Unassigned'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">Day of Week</label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] text-[#1F1F1F] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      value={formData.day}
                      onChange={(e) => setFormData({ ...formData, day: e.target.value as DayOfWeek })}
                    >
                      {DAYS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">Session Type</label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] text-[#1F1F1F] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as 'lecture' | 'lab' | 'tutorial',
                        })
                      }
                    >
                      <option value="lecture">Lecture</option>
                      <option value="lab">Practical Lab</option>
                      <option value="tutorial">Tutorial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">Start Time</label>
                    <Input
                      type="text"
                      placeholder="09:00"
                      className="bg-[#F5F6F8] border-[#E2E6ED] text-xs font-mono font-semibold"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">End Time</label>
                    <Input
                      type="text"
                      placeholder="10:00"
                      className="bg-[#F5F6F8] border-[#E2E6ED] text-xs font-mono font-semibold"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">Room / Lab Hall</label>
                  <Input
                    placeholder="e.g. CS-201, CS-Lab 2"
                    className="bg-[#F5F6F8] border-[#E2E6ED] text-xs font-semibold"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-[#E2E6ED] flex justify-end gap-2 bg-[#F5F6F8]">
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold"
                  onClick={handleSave}
                >
                  {editingSlot ? 'Update Assignment' : 'Confirm Assignment'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-[#E2E6ED] p-5 max-w-sm w-full space-y-3"
            >
              <h4 className="text-base font-bold text-[#1F1F1F]">Remove Timetable Slot</h4>
              <p className="text-[#666666] text-xs leading-relaxed">
                Are you sure you want to remove this scheduled slot? Attendance records and student timetable views
                will be updated immediately.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  onClick={confirmDelete}
                >
                  Delete Slot
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
