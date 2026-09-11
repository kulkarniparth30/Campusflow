import { Command } from 'cmdk'
import { Calendar, FileText, GraduationCap, Megaphone } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { AppView, Assignment, Notice, Subject } from '../../types'

export function CommandPalette({
  open,
  onOpenChange,
  assignments,
  notices,
  subjects,
  onNavigate,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  assignments: Assignment[]
  notices: Notice[]
  subjects: Subject[]
  onNavigate: (view: AppView) => void
}) {
  const [q, setQ] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[12vh] backdrop-blur-sm" onClick={() => onOpenChange(false)}>
      <Command
        className="glass w-[min(640px,92vw)] overflow-hidden rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          autoFocus
          value={q}
          onValueChange={setQ}
          placeholder="Jump to subjects, notices, exams..."
          className="h-12 w-full border-b border-white/10 bg-transparent px-4 text-sm outline-none"
        />
        <Command.List className="max-h-80 overflow-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-zinc-500">No matches.</Command.Empty>
          <Command.Group heading="Navigate" className="px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-500">
            <Item onSelect={() => { onNavigate('command'); onOpenChange(false) }} icon={<GraduationCap size={14} />}>
              Student Command Center
            </Item>
            <Item onSelect={() => { onNavigate('faculty'); onOpenChange(false) }} icon={<FileText size={14} />}>
              Faculty portal
            </Item>
            <Item onSelect={() => { onNavigate('corrections'); onOpenChange(false) }} icon={<FileText size={14} />}>
              Attendance corrections
            </Item>
          </Command.Group>
          <Command.Group heading="Subjects">
            {subjects.map((s) => (
              <Item key={s.id} onSelect={() => { onNavigate('command'); onOpenChange(false) }} icon={<GraduationCap size={14} />}>
                {s.code} — {s.name}
              </Item>
            ))}
          </Command.Group>
          <Command.Group heading="Timeline">
            {assignments.map((a) => (
              <Item key={a.id} onSelect={() => { onNavigate('command'); onOpenChange(false) }} icon={<Calendar size={14} />}>
                {a.title}
              </Item>
            ))}
          </Command.Group>
          <Command.Group heading="Notices">
            {notices.map((n) => (
              <Item key={n.id} onSelect={() => { onNavigate('admin'); onOpenChange(false) }} icon={<Megaphone size={14} />}>
                {n.title}
              </Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}

function Item({
  children,
  onSelect,
  icon,
}: {
  children: ReactNode
  onSelect: () => void
  icon: ReactNode
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-indigo-500/20"
    >
      <span className="text-indigo-300">{icon}</span>
      {children}
    </Command.Item>
  )
}
