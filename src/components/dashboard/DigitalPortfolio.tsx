import { motion, AnimatePresence } from 'framer-motion'
import { 
  Award, 
  Plus, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  FolderOpen, 
  Image as ImageIcon, 
  FileText, 
  Eye, 
  X, 
  CheckCircle2, 
  Building2, 
  Calendar,
  Camera,
  UploadCloud
} from 'lucide-react'
import { useState } from 'react'
import type { Achievement } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardHint, CardHeader, CardTitle } from '../ui/card'
import { Input, Textarea } from '../ui/input'
import { cn } from '../../lib/utils'
import { useToast } from '../ui/toast'

const categoryTones: Record<string, 'cyan' | 'blue' | 'emerald' | 'amber'> = {
  hackathon: 'cyan',
  leadership: 'amber',
  opensource: 'emerald',
  academic: 'blue',
}

const SAMPLE_EVENT_PHOTOS = [
  { label: 'Hackathon Presentation', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80' },
  { label: 'Technical Workshop', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80' },
  { label: 'Open Source Sprint', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80' },
  { label: 'Stage Prize Ceremony', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80' },
]

export function DigitalPortfolio({
  items,
  onAdd,
}: {
  items: Achievement[]
  onAdd: (payload: Omit<Achievement, 'id' | 'student_id' | 'verified'>) => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('hackathon')
  const [issuer, setIssuer] = useState('')
  const [imageProofUrl, setImageProofUrl] = useState('')
  const [certificateUrl, setCertificateUrl] = useState('')
  const [inspectingItem, setInspectingItem] = useState<Achievement | null>(null)

  const verified = items.filter((i) => i.verified).length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast('Please provide a milestone title.', 'error')
      return
    }
    onAdd({
      title: title.trim(),
      description: description.trim() || null,
      category,
      issuer: issuer.trim() || 'Self-reported',
      awarded_on: new Date().toISOString().slice(0, 10),
      image_proof_url: imageProofUrl.trim() || null,
      certificate_url: certificateUrl.trim() || null,
    })
    toast('Achievement added! Verification request dispatched to faculty.', 'success')
    setTitle('')
    setDescription('')
    setIssuer('')
    setImageProofUrl('')
    setCertificateUrl('')
    setOpen(false)
  }

  return (
    <Card className="h-full flex flex-col relative">
      <CardHeader>
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Digital Achievement Portfolio</CardTitle>
            <Badge tone="cyan" className="flex items-center gap-1">
              <Sparkles size={10} className="animate-pulse" />
              Verified Repository
            </Badge>
          </div>
          <CardHint>
            {verified} faculty-verified · {items.length} credentials with photo & certificate evidence
          </CardHint>
        </div>
        <Button size="sm" onClick={() => setOpen((v) => !v)} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold">
          <Plus size={14} className={cn("transition-transform", open && "rotate-45")} /> {open ? 'Cancel' : 'Add Credential'}
        </Button>
      </CardHeader>

      <AnimatePresence>
        {open && (
          <motion.form
            initial={{ opacity: 0, height: 0, scale: 0.98 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            className="mb-4 space-y-3 rounded-2xl border border-[#E2E6ED] bg-white p-4 overflow-hidden origin-top shadow-md"
            onSubmit={handleSubmit}
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
              <UploadCloud size={14} /> New Credential Submission
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Input
                placeholder="Title (e.g. Smart India Hackathon Finalist)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#F5F6F8] text-xs border-[#E2E6ED] text-[#1F1F1F]"
              />
              <Input
                placeholder="Issuing Org / College (e.g. IEEE, MoE, Google)"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="bg-[#F5F6F8] text-xs border-[#E2E6ED] text-[#1F1F1F]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
              >
                <option value="hackathon">Hackathon / Innovation</option>
                <option value="academic">Academic / Research</option>
                <option value="leadership">Leadership / Club</option>
                <option value="opensource">Open Source Contribution</option>
              </select>

              <div className="flex items-center text-xs text-[#666666] px-1">
                Submissions are sent to faculty verification queue with proofs.
              </div>
            </div>

            {/* Event Photo Proof Upload / Selector */}
            <div className="rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] p-3 space-y-2">
              <label className="text-xs font-semibold text-[#1F1F1F] flex items-center gap-1.5">
                <Camera size={13} className="text-[#2563EB]" /> Event Attendance / Participation Photo Proof
              </label>
              <Input
                placeholder="Image URL (e.g. https://... or select below)"
                value={imageProofUrl}
                onChange={(e) => setImageProofUrl(e.target.value)}
                className="bg-white text-xs h-8 border-[#E2E6ED]"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-[#666666]">Quick Attach Samples:</span>
                {SAMPLE_EVENT_PHOTOS.map((sp) => (
                  <button
                    key={sp.label}
                    type="button"
                    onClick={() => {
                      setImageProofUrl(sp.url)
                      toast(`Attached: ${sp.label}`, 'success')
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-[#DCE7F8] hover:bg-[#B8CCF0] text-[#2563EB] border border-[#B8CCF0] transition-all cursor-pointer"
                  >
                    + {sp.label}
                  </button>
                ))}
              </div>
              {imageProofUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={imageProofUrl}
                    alt="Proof preview"
                    className="w-16 h-12 rounded-lg object-cover border border-[#B8CCF0]"
                  />
                  <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                    <CheckCircle2 size={12} /> Event photo attached
                  </span>
                </div>
              )}
            </div>

            {/* Certificate Upload / URL */}
            <div className="rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] p-3 space-y-2">
              <label className="text-xs font-semibold text-[#1F1F1F] flex items-center gap-1.5">
                <FileText size={13} className="text-[#2563EB]" /> Certificate Document / Registration Proof
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Certificate Document URL (e.g. https://campusflow.edu/cert.pdf)"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                  className="bg-white text-xs h-8 flex-1 border-[#E2E6ED]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCertificateUrl('https://campusflow.edu/credentials/cert_verified_record.pdf')
                    toast('Attached verified certificate document', 'success')
                  }}
                  className="text-xs px-2.5 py-1 rounded-xl bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0] hover:bg-[#B8CCF0] transition-all shrink-0 cursor-pointer"
                >
                  Attach PDF
                </button>
              </div>
            </div>

            <Textarea
              placeholder="Brief description of the milestone, impact, or verifiable team contributions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-16 text-xs bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F]"
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" type="submit" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold">
                Submit to Portfolio
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Cards List */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#666666] space-y-2 py-12">
            <FolderOpen size={36} className="text-[#666666]" />
            <p className="text-sm">No portfolio items recorded yet.</p>
          </div>
        ) : (
          items.map((a, i) => {
            const tone = categoryTones[a.category] || 'cyan'

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={a.id}
                onClick={() => setInspectingItem(a)}
                className="group flex flex-col sm:flex-row items-start gap-4 rounded-2xl border border-[#E2E6ED] bg-white p-4 hover:border-[#B8CCF0] hover:shadow-md transition-all cursor-pointer"
              >
                {/* Thumbnail if photo proof attached */}
                {a.image_proof_url ? (
                  <div className="relative w-full sm:w-28 h-20 rounded-xl overflow-hidden shrink-0 border border-[#E2E6ED]">
                    <img
                      src={a.image_proof_url}
                      alt={a.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye size={16} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0] shrink-0">
                    <Award size={22} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <p className="truncate text-sm font-bold text-[#1F1F1F]">
                        {a.title}
                      </p>
                      <Badge tone={tone}>{a.category}</Badge>
                    </div>

                    {a.verified ? (
                      <Badge tone="emerald" className="shrink-0 flex items-center gap-1">
                        <ShieldCheck size={11} /> 
                        <span>Verified</span>
                        <Sparkles size={10} className="animate-pulse ml-0.5" />
                      </Badge>
                    ) : (
                      <Badge tone="amber" className="shrink-0 flex items-center gap-1">
                        <Clock size={11} /> Review Pending
                      </Badge>
                    )}
                  </div>

                  {a.description && (
                    <p className="mt-1 text-xs text-[#666666] line-clamp-2">{a.description}</p>
                  )}

                  <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[#666666] flex-wrap">
                    <span className="flex items-center gap-1 rounded bg-[#F5F6F8] border border-[#E2E6ED] px-2 py-0.5 text-[#1F1F1F] font-medium">
                      <Building2 size={11} className="text-[#2563EB]" />
                      {a.issuer}
                    </span>

                    {a.awarded_on && (
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar size={11} />
                        {a.awarded_on}
                      </span>
                    )}

                    {a.image_proof_url && (
                      <span className="inline-flex items-center gap-1 text-[#2563EB] text-[10px] font-semibold bg-[#DCE7F8] px-2 py-0.5 rounded-md border border-[#B8CCF0]">
                        <ImageIcon size={10} /> Photo Proof
                      </span>
                    )}

                    {a.certificate_url && (
                      <span className="inline-flex items-center gap-1 text-[#2563EB] text-[10px] font-semibold bg-[#DCE7F8] px-2 py-0.5 rounded-md border border-[#B8CCF0]">
                        <FileText size={10} /> Certificate PDF
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Credential Inspector Modal */}
      <AnimatePresence>
        {inspectingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[#E2E6ED] bg-white p-6 shadow-2xl overflow-hidden text-[#1F1F1F]"
            >
              <div className="flex items-start justify-between pb-4 border-b border-[#E2E6ED]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0]">
                      {inspectingItem.category}
                    </span>
                    <h3 className="text-lg font-bold text-[#1F1F1F]">{inspectingItem.title}</h3>
                  </div>
                  <p className="text-xs text-[#666666] mt-1">
                    Issued by <strong className="text-[#1F1F1F]">{inspectingItem.issuer}</strong> · Awarded on {inspectingItem.awarded_on || 'Recent'}
                  </p>
                </div>
                <button
                  onClick={() => setInspectingItem(null)}
                  className="p-1.5 rounded-xl text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 my-3 pr-1">
                {/* Event Photo Proof */}
                {inspectingItem.image_proof_url && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
                      <Camera size={13} /> Event Attendance Photo Proof
                    </span>
                    <div className="rounded-2xl overflow-hidden border border-[#E2E6ED] max-h-64 bg-[#F5F6F8]">
                      <img
                        src={inspectingItem.image_proof_url}
                        alt="Event evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                {inspectingItem.description && (
                  <div className="p-3.5 rounded-2xl bg-[#F5F6F8] border border-[#E2E6ED] text-xs text-[#1F1F1F] leading-relaxed">
                    <p className="font-semibold text-[#1F1F1F] mb-1">Credential Summary & Impact:</p>
                    {inspectingItem.description}
                  </div>
                )}

                {/* Verification & Certificate Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl border border-[#E2E6ED] bg-[#F5F6F8] space-y-2">
                    <span className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">Faculty Verification</span>
                    <div className="flex items-center gap-2">
                      {inspectingItem.verified ? (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <span className="text-xs text-emerald-800 font-semibold">Verified & Endorsed by Academic Council</span>
                        </>
                      ) : (
                        <>
                          <Clock size={16} className="text-amber-600 shrink-0" />
                          <span className="text-xs text-amber-800 font-semibold">Pending Faculty Review</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl border border-[#E2E6ED] bg-[#F5F6F8] space-y-2">
                    <span className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">Document Certificate</span>
                    {inspectingItem.certificate_url ? (
                      <a
                        href={inspectingItem.certificate_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        <FileText size={13} /> View Official Certificate PDF <ExternalLink size={11} />
                      </a>
                    ) : (
                      <p className="text-xs text-[#666666] italic">Self-attested without digital PDF.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E6ED] flex justify-end">
                <Button
                  size="sm"
                  onClick={() => setInspectingItem(null)}
                  className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  )
}

