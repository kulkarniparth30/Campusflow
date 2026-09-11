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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass glow-border rounded-3xl p-6 bg-white border border-[#E2E6ED]">
          <h3 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2 mb-4">
            <FileText size={20} className="text-[#2563EB]" /> New Leave / OD Request
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={type === 'od'} onChange={() => setType('od')} className="accent-[#2563EB]" />
                <span className="text-xs text-[#1F1F1F] font-semibold">On-Duty (OD)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={type === 'medical'} onChange={() => setType('medical')} className="accent-[#2563EB]" />
                <span className="text-xs text-[#1F1F1F] font-semibold">Medical Leave</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-[#666666]">From Date</label>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} required className="bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#666666]">To Date</label>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} required className="bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F]" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#666666]">Reason</label>
              <Input value={reason} onChange={e => setReason(e.target.value)} required placeholder="Brief description..." className="bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F] placeholder:text-[#999999]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-[#666666]">Evidence URL (Optional)</label>
              <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F] placeholder:text-[#999999]" />
            </div>
            <Button type="submit" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold">Submit Request</Button>
          </form>
        </motion.div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#1F1F1F]">
          {role === 'student' ? 'My Requests' : 'Pending Approvals'}
        </h3>
        
        <div className="space-y-4">
          {(role === 'student' ? requests : pendingForRole).length === 0 && (
            <div className="text-center p-8 text-[#666666] text-xs glass rounded-2xl bg-white border border-[#E2E6ED]">
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
                className="glass rounded-2xl p-5 border border-[#E2E6ED] bg-white shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider", req.type === 'od' ? 'bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0]' : 'bg-rose-50 text-rose-700 border border-rose-200')}>
                        {req.type}
                      </span>
                      <span className="text-xs text-[#666666] font-mono">{req.from_date} to {req.to_date}</span>
                    </div>
                    <p className="mt-1 text-sm text-[#1F1F1F] font-medium">{req.reason}</p>
                    {req.evidence_url && (
                      <a href={req.evidence_url} target="_blank" rel="noreferrer" className="text-xs text-[#2563EB] hover:underline mt-1 inline-block">
                        View Evidence
                      </a>
                    )}
                  </div>
                  {role !== 'student' && nextPendingIndex !== -1 && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => {
                        onApprove(req.id, nextPendingIndex, false, 'Rejected')
                        toast('Request denied.', 'error')
                      }}>
                        Reject
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => {
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
                  <div className="absolute top-3 left-4 right-4 h-0.5 bg-[#E2E6ED]" />
                  <div className="flex justify-between relative z-10">
                    {req.approval_chain.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2 text-center w-24">
                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border-2", 
                          step.status === 'approved' ? "bg-white border-emerald-600 text-emerald-600" :
                          step.status === 'rejected' ? "bg-white border-rose-600 text-rose-600" :
                          "bg-white border-[#E2E6ED] text-[#666666]"
                        )}>
                          {step.status === 'approved' ? <CheckCircle2 size={14} /> :
                           step.status === 'rejected' ? <XCircle size={14} /> :
                           <Clock size={12} />}
                        </div>
                        <span className="text-[10px] text-[#666666] leading-tight">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Automated Timetable Matching & Attendance Impact Recovery */}
                {(req.matched_sessions && req.matched_sessions.length > 0) && (
                  <div className="mt-5 pt-4 border-t border-[#E2E6ED] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wider flex items-center gap-1.5">
                        Timetable-Linked Session Matching ({req.matched_sessions.length} Slots)
                      </span>
                      {req.credited ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          Auto-Credited to Master Attendance
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                          Awaiting HOD Sign-off
                        </span>
                      )}
                    </div>

                    {/* Matched Session Tags */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {req.matched_sessions.map((slot, sIdx) => (
                        <div key={sIdx} className="rounded-lg bg-[#F5F6F8] border border-[#E2E6ED] p-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#2563EB]">{slot.subject_code}</span>
                            <span className="text-[10px] text-[#666666]">{slot.date}</span>
                          </div>
                          <p className="text-[11px] text-[#1F1F1F] truncate mt-0.5">{slot.subject_name}</p>
                          <p className="text-[10px] text-[#666666] font-mono mt-1">{slot.start_time} - {slot.end_time} ({slot.hours} hrs)</p>
                        </div>
                      ))}
                    </div>

                    {/* Projected Attendance Recovery Comparison */}
                    {req.attendance_impact && req.attendance_impact.length > 0 && (
                      <div className="rounded-xl bg-[#DCE7F8] border border-[#B8CCF0] p-3">
                        <p className="text-[11px] font-medium text-[#2563EB] mb-2">
                          Projected Attendance Recovery Upon HOD Approval:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {req.attendance_impact.map((impact, impIdx) => (
                            <div key={impIdx} className="flex items-center justify-between bg-white border border-[#E2E6ED] rounded-lg px-2.5 py-1.5 text-xs">
                              <span className="font-mono text-[#1F1F1F]">{impact.subject_code}</span>
                              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                <span className="text-rose-600">{impact.current_pct}%</span>
                                <span className="text-[#666666]">→</span>
                                <span className="text-emerald-600 font-bold">{impact.projected_pct}%</span>
                                <span className="text-[#2563EB] text-[10px]">(+{impact.gain_pct}%)</span>
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
