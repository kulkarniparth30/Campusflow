import { useState } from 'react'
import { motion } from 'framer-motion'
import type { ODRequest, ODType, Role } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useToast } from '../ui/toast'
import { FileText, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ODRequestPanelProps {
  requests: ODRequest[]
  role: Role
  onSubmit: (type: ODType, reason: string, url: string | null, from: string, to: string) => void
  onApprove: (id: string, stepIndex: number, approved: boolean, note: string) => void
}

export function ODRequestPanel({ requests, role, onSubmit, onApprove }: ODRequestPanelProps) {
  const [type, setType] = useState<ODType>('od')
  const [reason, setReason] = useState('')
  const [url, setUrl] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason || !from || !to) return
    onSubmit(type, reason, url || null, from, to)
    toast('Request Submitted: Your request has been routed for approval.', 'success')
    setReason('')
    setUrl('')
    setFrom('')
    setTo('')
  }

  // Filter pending requests for faculty/admin based on their role
  // For demo: if faculty -> step 1, if admin/hod -> step 2 (assuming simple mapping)
  const pendingForRole = requests.filter(req => {
    const nextPendingStep = req.approval_chain.findIndex(s => s.status === 'pending')
    if (nextPendingStep === -1) return false
    
    // Quick demo mapping: faculty handles step 1 (Subject Faculty), admin handles step 2 (HOD)
    if (role === 'faculty' && req.approval_chain[nextPendingStep].role === 'faculty') return true
    if (role === 'admin' && req.approval_chain[nextPendingStep].role === 'hod') return true
    
    // Fallback: admin can approve anything if not handled properly in demo
    return role === 'admin'
  })

  return (
    <div className="space-y-8">
      {role === 'student' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass glow-border rounded-3xl p-6">
          <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2 mb-4">
            <FileText size={20} className="text-indigo-400" /> New Leave / OD Request
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={type === 'od'} onChange={() => setType('od')} className="accent-indigo-500" />
                <span className="text-sm text-zinc-300">On-Duty (OD)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={type === 'medical'} onChange={() => setType('medical')} className="accent-indigo-500" />
                <span className="text-sm text-zinc-300">Medical Leave</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">From Date</label>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} required className="bg-black/20" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-400">To Date</label>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} required className="bg-black/20" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Reason</label>
              <Input value={reason} onChange={e => setReason(e.target.value)} required placeholder="Brief description..." className="bg-black/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Evidence URL (Optional)</label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="bg-black/20" />
            </div>
            <Button type="submit" className="w-full">Submit Request</Button>
          </form>
        </motion.div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-zinc-100">
          {role === 'student' ? 'My Requests' : 'Pending Approvals'}
        </h3>
        
        <div className="space-y-4">
          {(role === 'student' ? requests : pendingForRole).length === 0 && (
            <div className="text-center p-8 text-zinc-500 text-sm glass rounded-2xl">
              No requests found.
            </div>
          )}

          {(role === 'student' ? requests : pendingForRole).map((req, i) => {
            const nextPendingIndex = req.approval_chain.findIndex(s => s.status === 'pending')
            
            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={req.id} 
                className="glass rounded-2xl p-5 border border-white/5"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider", req.type === 'od' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-rose-500/20 text-rose-300')}>
                        {req.type}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{req.from_date} to {req.to_date}</span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-200">{req.reason}</p>
                    {req.evidence_url && (
                      <a href={req.evidence_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline mt-1 inline-block">
                        View Evidence
                      </a>
                    )}
                  </div>
                  {role !== 'student' && nextPendingIndex !== -1 && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={() => {
                        onApprove(req.id, nextPendingIndex, false, 'Rejected')
                        toast('Request denied.', 'error')
                      }}>
                        Reject
                      </Button>
                      <Button size="sm" className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30" onClick={() => {
                        onApprove(req.id, nextPendingIndex, true, 'Approved')
                        toast('Request approved.', 'success')
                      }}>
                        Approve
                      </Button>
                    </div>
                  )}
                </div>

                {/* Approval Stepper */}
                <div className="relative mt-6">
                  <div className="absolute top-3 left-4 right-4 h-0.5 bg-white/10" />
                  <div className="flex justify-between relative z-10">
                    {req.approval_chain.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2 text-center w-24">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border-2", 
                          step.status === 'approved' ? "bg-[#070b14] border-emerald-500 text-emerald-500" :
                          step.status === 'rejected' ? "bg-[#070b14] border-red-500 text-red-500" :
                          "bg-[#070b14] border-zinc-600 text-zinc-500"
                        )}>
                          {step.status === 'approved' ? <CheckCircle2 size={14} /> :
                           step.status === 'rejected' ? <XCircle size={14} /> :
                           <Clock size={12} />}
                        </div>
                        <span className="text-[10px] text-zinc-400 leading-tight">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Automated Timetable Matching & Attendance Impact Recovery */}
                {(req.matched_sessions && req.matched_sessions.length > 0) && (
                  <div className="mt-5 pt-4 border-t border-cyan-500/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                        Timetable-Linked Session Matching ({req.matched_sessions.length} Slots)
                      </span>
                      {req.credited ? (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                          Auto-Credited to Master Attendance
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                          Awaiting HOD Sign-off
                        </span>
                      )}
                    </div>

                    {/* Matched Session Tags */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {req.matched_sessions.map((slot, sIdx) => (
                        <div key={sIdx} className="rounded-lg bg-slate-900/80 border border-slate-800 p-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-cyan-400">{slot.subject_code}</span>
                            <span className="text-[10px] text-slate-400">{slot.date}</span>
                          </div>
                          <p className="text-[11px] text-slate-300 truncate mt-0.5">{slot.subject_name}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">{slot.start_time} - {slot.end_time} ({slot.hours} hrs)</p>
                        </div>
                      ))}
                    </div>

                    {/* Projected Attendance Recovery Comparison */}
                    {req.attendance_impact && req.attendance_impact.length > 0 && (
                      <div className="rounded-xl bg-cyan-950/20 border border-cyan-500/20 p-3">
                        <p className="text-[11px] font-medium text-cyan-200 mb-2">
                          Projected Attendance Recovery Upon HOD Approval:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {req.attendance_impact.map((impact, impIdx) => (
                            <div key={impIdx} className="flex items-center justify-between bg-slate-900/60 rounded-lg px-2.5 py-1.5 text-xs">
                              <span className="font-mono text-slate-300">{impact.subject_code}</span>
                              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                <span className="text-rose-400">{impact.current_pct}%</span>
                                <span className="text-slate-500">→</span>
                                <span className="text-emerald-400 font-bold">{impact.projected_pct}%</span>
                                <span className="text-cyan-400 text-[10px]">(+{impact.gain_pct}%)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
