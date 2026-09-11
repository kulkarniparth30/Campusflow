import { useEffect, useState, useRef } from 'react'
import {
  QrCode,
  ShieldCheck,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  Camera,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useCampusStore } from '../../store/campus'

interface FlashRollModalProps {
  mode: 'faculty' | 'student'
  subjectId?: string
  onClose: () => void
}

export function FlashRollModal({ mode, subjectId, onClose }: FlashRollModalProps) {
  const {
    activeFlashRoll,
    startFlashRoll,
    refreshFlashRollToken,
    closeFlashRoll,
    verifyFlashRollScan,
    profile,
    batch,
    subjects,
  } = useCampusStore()

  const [timeLeft, setTimeLeft] = useState(5)
  const [manualToken, setManualToken] = useState('')
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [geofencePassed, setGeofencePassed] = useState<boolean | null>(null)
  const intervalRef = useRef<number | null>(null)

  const activeSubject = subjects.find((s) => s.id === (subjectId || activeFlashRoll?.subject_id))

  // Faculty mode: start session if not started and handle 5s countdown
  useEffect(() => {
    if (mode === 'faculty') {
      if (!activeFlashRoll && subjectId) {
        startFlashRoll(subjectId)
      }

      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            refreshFlashRollToken()
            return 5
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
  }, [mode, subjectId, activeFlashRoll, refreshFlashRollToken, startFlashRoll])

  // Student mode: simulate geofence verification
  useEffect(() => {
    if (mode === 'student') {
      const timer = setTimeout(() => {
        setGeofencePassed(true)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [mode])

  const handleStudentScan = (tokenToVerify?: string) => {
    if (!profile) return
    const code = tokenToVerify || manualToken
    if (!code) {
      setScanResult({ success: false, message: 'Please enter or scan the TOTP code.' })
      return
    }

    setIsScanning(true)
    setTimeout(() => {
      // Simulate classroom coordinates
      const res = verifyFlashRollScan(profile.id, code, 13.0827, 80.2707)
      setScanResult(res)
      setIsScanning(false)
    }, 600)
  }

  const attendees = batch.filter((s) => activeFlashRoll?.attendee_ids.includes(s.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/95 shadow-2xl shadow-cyan-950/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 px-6 py-4 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-blue-950/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
              <QrCode className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100">
                  {mode === 'faculty' ? 'Flash-Roll Dynamic TOTP QR Projector' : 'Flash-Roll Attendance Scanner'}
                </h3>
                <span className="flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                  <Sparkles className="h-2.5 w-2.5" /> 5s Anti-Proxy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {activeSubject ? `${activeSubject.code} — ${activeSubject.name}` : 'Rotating Classroom Check-in'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (mode === 'faculty' && activeFlashRoll) {
                closeFlashRoll()
              }
              onClose()
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {mode === 'faculty' ? (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Dynamic QR Display */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-6 text-center shadow-inner relative overflow-hidden">
                {/* Rotating Glowing Ring */}
                <div className="absolute inset-0 pointer-events-none bg-radial from-cyan-500/10 via-transparent to-transparent" />

                {/* Animated TOTP QR Representation */}
                <div className="relative mb-4 flex h-52 w-52 items-center justify-center rounded-xl border-2 border-dashed border-cyan-400/60 bg-white p-3 shadow-xl shadow-cyan-500/20">
                  {/* Generated QR pattern simulation with active TOTP code */}
                  <div className="flex flex-col items-center justify-center text-slate-950 w-full h-full bg-slate-50 rounded-lg p-2">
                    <div className="grid grid-cols-6 gap-1 w-full h-32 opacity-90">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-sm transition-all duration-300 ${
                            (i * 7 + (activeFlashRoll?.token.charCodeAt(i % 5) || 0)) % 2 === 0
                              ? 'bg-slate-900'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="mt-1 flex items-center justify-between w-full px-2 border-t border-slate-300 pt-1">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-slate-700">CAMPUSFLOW</span>
                      <span className="text-xs font-mono font-black text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">
                        {activeFlashRoll?.token || 'TOKEN'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5-second Countdown Indicator */}
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                  <span>
                    Regenerating in <strong className="font-mono text-cyan-300 text-sm">{timeLeft}s</strong>
                  </span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-1000 ease-linear"
                      style={{ width: `${(timeLeft / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-slate-400 max-w-xs">
                  Proxy-proof: Static photos & remote screenshots will expire within 5 seconds.
                </p>
              </div>

              {/* Right: Live Check-in Monitor */}
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs font-medium text-slate-200">Live Attendance Ticker</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                      {activeFlashRoll?.attendee_ids.length || 0} / {activeFlashRoll?.total_enrolled || 38} Verified
                    </span>
                  </div>

                  <div className="mt-3 max-h-48 overflow-y-auto space-y-2 pr-1">
                    {attendees.length > 0 ? (
                      attendees.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2 text-xs animate-in slide-in-from-right-3 duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-[10px] text-white">
                              {student.full_name[0]}
                            </div>
                            <div>
                              <p className="font-medium text-slate-200">{student.full_name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{student.roll_no || '23CS012'}</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Just now
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                        <RefreshCw className="h-5 w-5 animate-spin mb-1 text-cyan-500/50" />
                        <p className="text-xs">Awaiting student scans from auditorium projector...</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs text-cyan-300">
                  <MapPin className="h-4 w-4 shrink-0 text-cyan-400" />
                  <span>
                    <strong>Geofence Enforced:</strong> 150m radius restricted to Hall LH-204 coordinates (13.0827° N, 80.2707° E).
                  </span>
                </div>

                <button
                  onClick={() => {
                    closeFlashRoll()
                    onClose()
                  }}
                  className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-200 transition-colors"
                >
                  Finalize & Lock Session Attendance
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Student Scanner View */
          <div className="p-6 space-y-5">
            {scanResult ? (
              <div
                className={`rounded-xl border p-5 text-center space-y-3 ${
                  scanResult.success
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                    : 'border-rose-500/40 bg-rose-950/20 text-rose-200'
                }`}
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 shadow-lg">
                  {scanResult.success ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-rose-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-base">
                    {scanResult.success ? 'Attendance Verified & Logged' : 'Verification Failed'}
                  </h4>
                  <p className="mt-1 text-xs text-slate-300">{scanResult.message}</p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  {scanResult.success ? (
                    <button
                      onClick={onClose}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      Done & Return
                    </button>
                  ) : (
                    <button
                      onClick={() => setScanResult(null)}
                      className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Camera Viewfinder Mock */}
                <div className="relative flex h-52 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#B8CCF0] bg-[#F5F6F8] overflow-hidden text-center">
                  <div className="absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent shadow-md animate-pulse" />
                  <Camera className="h-8 w-8 text-[#2563EB] mb-2" />
                  <p className="text-xs font-medium text-[#1F1F1F]">Point Camera at Projector Screen</p>
                  <p className="text-[11px] text-[#666666]">Live cryptographic TOTP decoder active</p>

                  {/* Active session quick-fill demo button */}
                  {activeFlashRoll && (
                    <button
                      onClick={() => handleStudentScan(activeFlashRoll.token)}
                      disabled={isScanning}
                      className="mt-3 flex items-center gap-1.5 rounded-lg border border-[#B8CCF0] bg-[#DCE7F8] px-3 py-1.5 text-xs font-semibold text-[#2563EB] hover:bg-[#B8CCF0] transition-all shadow-sm"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-[#2563EB]" />
                      {isScanning ? 'Verifying...' : `1-Tap Auto-Scan Token (${activeFlashRoll.token})`}
                    </button>
                  )}
                </div>

                {/* Geofence verification status */}
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    <span className="text-slate-300">Classroom Geofence (LH-204)</span>
                  </div>
                  {geofencePassed ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Within 18m Range
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-400">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Verifying GPS...
                    </span>
                  )}
                </div>

                {/* Or enter TOTP code manually */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Or Enter Current 6-Digit Projector TOTP Code:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value.toUpperCase())}
                      placeholder={activeFlashRoll?.token || 'e.g. 7KF92M'}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-center font-mono text-sm uppercase tracking-widest text-cyan-300 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      onClick={() => handleStudentScan()}
                      disabled={isScanning}
                      className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-slate-950 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
                    >
                      {isScanning ? 'Checking...' : 'Verify'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
