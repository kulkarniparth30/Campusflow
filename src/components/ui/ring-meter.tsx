export function RingMeter({
  value,
  label,
  sub,
  risk,
}: {
  value: number
  label: string
  sub: string
  risk: boolean
}) {
  const r = 28
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const dash = (clamped / 100) * c
  const color = risk ? '#EF4444' : clamped >= 85 ? '#10B981' : '#F59E0B'

  return (
    <div className="flex items-center gap-3">
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} stroke="#E2E6ED" strokeWidth="7" fill="none" />
        <circle
          cx="38"
          cy="38"
          r={r}
          stroke={color}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform="rotate(-90 38 38)"
        />
        <text x="38" y="42" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1F1F1F">
          {clamped.toFixed(0)}%
        </text>
      </svg>
      <div>
        <p className="text-sm font-semibold text-[#1F1F1F]">{label}</p>
        <p className="text-xs text-[#666666]">{sub}</p>
      </div>
    </div>
  )
}
