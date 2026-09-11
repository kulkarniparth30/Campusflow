import type { BroadcastAnalysis, NoticeAudience, NoticeCategory } from '../../types'

/**
 * Smart Broadcast Synthesizer — Parses raw circular/notice text and extracts
 * structured data: dates, locations, action items, suggested category/audience.
 */

const DATE_PATTERNS = [
  /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/g,
  /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s*(\d{2,4})?\b/gi,
  /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi,
  /\b(tomorrow|today|next week|this friday|this monday)\b/gi,
]

const LOCATION_PATTERNS = [
  /\b(?:hall|room|lab|auditorium|block|wing|floor|building|campus|library|canteen|hostel)\s*[\w\d-]*\b/gi,
  /\b(?:venue|location|place)\s*[:–—]\s*(.+?)(?:\.|,|\n)/gi,
]

const ACTION_PATTERNS = [
  /\b(?:must|should|required to|expected to|are requested to|kindly|please|ensure|submit|report|carry|bring|attend|register)\b[^.;!?\n]{5,80}/gi,
]

const URGENCY_KEYWORDS = [
  'urgent', 'immediately', 'mandatory', 'compulsory', 'last date',
  'deadline', 'final warning', 'strict action', 'non-compliance', 'penalty',
]

const EXAM_KEYWORDS = [
  'exam', 'examination', 'test', 'quiz', 'mid-term', 'end-semester',
  'hall ticket', 'seating', 'marks', 'grade', 'result',
]

const EVENT_KEYWORDS = [
  'hackathon', 'workshop', 'seminar', 'webinar', 'fest', 'competition',
  'cultural', 'sports', 'ceremony', 'inauguration', 'valedictory', 'placement',
]

function extractPatterns(text: string, patterns: RegExp[]): string[] {
  const results = new Set<string>()
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match
    while ((match = regex.exec(text)) !== null) {
      results.add(match[0].trim())
    }
  }
  return [...results]
}

function detectCategory(text: string): NoticeCategory {
  const lower = text.toLowerCase()
  if (URGENCY_KEYWORDS.some((k) => lower.includes(k))) return 'urgent'
  if (EXAM_KEYWORDS.some((k) => lower.includes(k))) return 'exam'
  if (EVENT_KEYWORDS.some((k) => lower.includes(k))) return 'event'
  return 'academic'
}

function detectAudience(text: string): NoticeAudience {
  const audience: NoticeAudience = {}
  const lower = text.toLowerCase()

  // Department detection
  const depts: string[] = []
  if (/\b(computer science|cse|cs)\b/i.test(lower)) depts.push('Computer Science')
  if (/\b(electronics|ece|eee)\b/i.test(lower)) depts.push('Electronics')
  if (/\b(mechanical|mech)\b/i.test(lower)) depts.push('Mechanical')
  if (/\b(civil)\b/i.test(lower)) depts.push('Civil')
  if (/\ball\s+departments?\b/i.test(lower)) depts.push('All')
  if (depts.length) audience.departments = depts

  // Semester detection
  const semMatch = lower.match(/\b(?:semester|sem)\s*(\d+)\b/i)
  if (semMatch) audience.semesters = [parseInt(semMatch[1])]

  // Batch/year detection
  const batchMatch = lower.match(/\b(20\d{2})\s*(?:batch|admitted|intake)\b/i)
  if (batchMatch) audience.batches = [batchMatch[1]]

  return audience
}

export function analyzeBroadcast(rawText: string): BroadcastAnalysis {
  const dates = extractPatterns(rawText, DATE_PATTERNS)
  const locations = extractPatterns(rawText, LOCATION_PATTERNS)
  const actions = extractPatterns(rawText, ACTION_PATTERNS)
    .map((a) => a.replace(/^\b(must|should|kindly|please)\s+/i, '').trim())
    .filter((a) => a.length > 10)
    .slice(0, 5)

  const category = detectCategory(rawText)
  const audience = detectAudience(rawText)
  const isUrgent = category === 'urgent'

  // Generate summary (first sentence or first 200 chars)
  const firstSentence = rawText.split(/[.!?\n]/).find((s) => s.trim().length > 15) ?? ''
  const summary = firstSentence.trim().slice(0, 200)

  return {
    extracted_dates: dates.slice(0, 5),
    extracted_locations: locations.slice(0, 3),
    action_items: actions,
    suggested_category: category,
    suggested_audience: audience,
    is_urgent: isUrgent,
    summary,
  }
}
