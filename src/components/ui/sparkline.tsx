import { useId, useMemo } from 'react'
import { cn } from '../../lib/utils'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  gradientId?: string
  showDot?: boolean
  className?: string
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = '#f59e0b',
  gradientId,
  showDot = true,
  className,
}: SparklineProps) {
  const defaultId = useId()
  const gId = gradientId ?? `spark-${defaultId.replace(/:/g, '')}`

  const { path, areaPath, points } = useMemo(() => {
    if (data.length < 2) return { path: '', areaPath: '', points: [] }
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const padding = 2

    const pts = data.map((v, i) => ({
      x: padding + (i / (data.length - 1)) * (width - padding * 2),
      y: padding + (1 - (v - min) / range) * (height - padding * 2),
    }))

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    const area = `${line} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`

    return { path: line, areaPath: area, points: pts }
  }, [data, width, height])

  if (data.length < 2) return null

  const lastPoint = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
    >
      <defs>
        <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gId})`} />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && lastPoint && (
        <>
          <circle cx={lastPoint.x} cy={lastPoint.y} r={3} fill={color} />
          <circle cx={lastPoint.x} cy={lastPoint.y} r={5} fill={color} opacity={0.3}>
            <animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
        </>
      )}
    </svg>
  )
}
