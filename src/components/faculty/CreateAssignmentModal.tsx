import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, FileText, UploadCloud, Calendar, Clock, AlertTriangle } from 'lucide-react'
import type { AssignmentKind, Subject } from '../../types'
import { Button } from '../ui/button'
import { Input, Textarea } from '../ui/input'
import { useCampusStore } from '../../store/campus'
import { useToast } from '../ui/toast'

interface CreateAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  subjects: Subject[]
}

export function CreateAssignmentModal({ isOpen, onClose, subjects }: CreateAssignmentModalProps) {
  const createAssignment = useCampusStore((s) => s.createAssignment)
  const { toast } = useToast()

  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<AssignmentKind>('assignment')
  const [urgency, setUrgency] = useState(3)
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  })
  const [dueTime, setDueTime] = useState('23:59')
  const [questionPdfUrl, setQuestionPdfUrl] = useState('')
  const [questions, setQuestions] = useState<string[]>([
    'Implement the core algorithm with proper modular abstraction and clean error handling.',
    'Include benchmark execution plots comparing runtime against theoretical Big-O complexity.',
  ])
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionCO, setNewQuestionCO] = useState('CO1')
  const [newQuestionBloom, setNewQuestionBloom] = useState<'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate'>('Apply')
  const [newQuestionPoints, setNewQuestionPoints] = useState(15)

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return
    setQuestions([...questions, newQuestionText.trim()])
    setNewQuestionText('')
  }

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast('Please provide an assignment title.', 'error')
      return
    }
    if (!subjectId) {
      toast('Please select an assigned subject.', 'error')
      return
    }

    const dueAt = new Date(`${dueDate}T${dueTime}:00`).toISOString()

    // Map questions to structured OBE questions
    const questionsOBE = questions.map((text, idx) => ({
      id: `qobe-${idx + 1}`,
      text,
      points: idx === 0 ? 15 : 10,
      course_outcome: (idx === 0 ? 'CO1' : 'CO2') as 'CO1' | 'CO2',
      blooms_level: (idx === 0 ? 'Apply' : 'Analyze') as 'Apply' | 'Analyze',
    }))

    createAssignment({
      subject_id: subjectId,
      title: title.trim(),
      description: description.trim() || null,
      questions: questions.length > 0 ? questions : undefined,
      questions_obe: questionsOBE,
      question_pdf_url: questionPdfUrl.trim() || null,
      kind,
      due_at: dueAt,
      urgency,
    })

    toast('New coursework created and published to enrolled students!', 'success')
    setTitle('')
    setDescription('')
    setQuestionPdfUrl('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-[#E2E6ED] bg-white p-6 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E2E6ED]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0]">
                    <UploadCloud size={16} />
                  </span>
                  <h3 className="text-lg font-bold text-[#1F1F1F]">Create & Assign Coursework</h3>
                </div>
                <p className="text-xs text-[#666666] mt-1">
                  Publish assignments, lab practicals, or examination briefs with questions to enrolled student decks.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 my-3 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#1F1F1F] mb-1 block">Assigned Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1F1F1F] mb-1 block">Coursework Category</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as AssignmentKind)}
                    className="h-10 w-full rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                  >
                    <option value="assignment">Assignment / Lab Project (50 Marks)</option>
                    <option value="exam">Mid-Term / End-Term Examination (100 Marks)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F1F1F] mb-1 block">Assignment Title</label>
                <Input
                  placeholder="e.g. Red-Black Trees & Dijkstra Shortest Path Lab"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F] text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1F1F1F] mb-1 block">Brief Summary / Instructions</label>
                <Textarea
                  placeholder="Instructions for students regarding execution benchmarks, file types, and evaluation rubrics..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-16 text-xs bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F]"
                />
              </div>

              {/* Due Date & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#1F1F1F] mb-1 flex items-center gap-1">
                    <Calendar size={12} className="text-[#2563EB]" /> Deadline Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1F1F1F] mb-1 flex items-center gap-1">
                    <Clock size={12} className="text-[#2563EB]" /> Due Time
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1F1F1F] mb-1 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-500" /> Urgency Level ({urgency}/5)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={urgency}
                    onChange={(e) => setUrgency(Number(e.target.value))}
                    className="w-full h-2 mt-3 cursor-pointer appearance-none bg-[#E2E6ED] rounded-lg accent-[#2563EB]"
                  />
                </div>
              </div>

              {/* Question PDF Rubric Attachment */}
              <div>
                <label className="text-xs font-semibold text-[#1F1F1F] mb-1 flex items-center gap-1">
                  <FileText size={12} className="text-[#2563EB]" /> Official Question Paper / Rubric PDF URL (Optional)
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://campusflow.edu/materials/cs301_lab_brief.pdf"
                    value={questionPdfUrl}
                    onChange={(e) => setQuestionPdfUrl(e.target.value)}
                    className="bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F] text-xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setQuestionPdfUrl('https://campusflow.edu/materials/cs301_advanced_lab_spec.pdf')}
                    className="px-2.5 py-1 text-xs rounded-xl bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0] hover:bg-[#cbe0fb] transition-all shrink-0 cursor-pointer font-semibold"
                  >
                    Sample PDF
                  </button>
                </div>
              </div>

              {/* Questions List Builder */}
              <div className="rounded-2xl border border-[#E2E6ED] bg-[#F5F6F8] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-1">
                    <FileText size={12} /> Specific Questions & Sub-Tasks ({questions.length})
                  </label>
                  <span className="text-[10px] text-[#666666] font-mono">Visible in student problem brief</span>
                </div>

                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-white border border-[#E2E6ED] text-xs text-[#1F1F1F]"
                    >
                      <span className="text-[#2563EB] font-bold shrink-0">Q{idx + 1}.</span>
                      <span className="flex-1 leading-relaxed">{q}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-[#666666] hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-1 border-t border-[#E2E6ED]">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add another question or evaluation criterion..."
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddQuestion()
                        }
                      }}
                      className="bg-white border-[#E2E6ED] text-[#1F1F1F] text-xs flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddQuestion}
                      className="text-xs shrink-0 bg-white border-[#E2E6ED] text-[#1F1F1F]"
                    >
                      <Plus size={12} className="mr-1" /> Add
                    </Button>
                  </div>

                  {/* OBE Taxonomy Tag Selectors */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#666666] bg-white p-2 rounded-xl border border-[#E2E6ED]">
                    <span className="font-semibold text-[#2563EB]">OBE Tags:</span>
                    <div className="flex items-center gap-1.5">
                      <span>Course Outcome:</span>
                      <select
                        value={newQuestionCO}
                        onChange={(e) => setNewQuestionCO(e.target.value)}
                        className="bg-[#F5F6F8] text-[#2563EB] font-mono text-[11px] rounded px-1.5 py-0.5 border border-[#E2E6ED]"
                      >
                        <option value="CO1">CO1 (Foundations)</option>
                        <option value="CO2">CO2 (Design & Modeling)</option>
                        <option value="CO3">CO3 (Analysis & Architecture)</option>
                        <option value="CO4">CO4 (Synthesis & Networks)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span>Bloom's Level:</span>
                      <select
                        value={newQuestionBloom}
                        onChange={(e) => setNewQuestionBloom(e.target.value as any)}
                        className="bg-[#F5F6F8] text-purple-700 font-medium text-[11px] rounded px-1.5 py-0.5 border border-[#E2E6ED]"
                      >
                        <option value="Remember">L1 - Remember</option>
                        <option value="Understand">L2 - Understand</option>
                        <option value="Apply">L3 - Apply</option>
                        <option value="Analyze">L4 - Analyze</option>
                        <option value="Evaluate">L5 - Evaluate</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span>Marks:</span>
                      <input
                        type="number"
                        min={5}
                        max={50}
                        value={newQuestionPoints}
                        onChange={(e) => setNewQuestionPoints(Number(e.target.value))}
                        className="w-14 bg-[#F5F6F8] text-emerald-700 font-mono text-[11px] rounded px-1.5 py-0.5 border border-[#E2E6ED] text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E6ED]">
                <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-[#666666]">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold shadow-md shadow-[#2563EB]/20">
                  Publish to Students
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
