import type { NoticeCategory } from '../types'

const RULES: { category: NoticeCategory; pattern: RegExp }[] = [
  { category: 'urgent', pattern: /\b(urgent|immediately|asap|mandatory|lost id|restricted|deadline today)\b/i },
  { category: 'exam', pattern: /\b(exam|mid[- ]?term|end[- ]?sem|seating|internals|viva|practical)\b/i },
  { category: 'event', pattern: /\b(event|fest|hackathon|workshop|seminar|club|orientation|office hours)\b/i },
  { category: 'academic', pattern: /\b(assignment|library|syllabus|lecture|lab|course|academic)\b/i },
]

export function tagNotice(title: string, body: string): NoticeCategory {
  const text = `${title} ${body}`
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return rule.category
  }
  return 'academic'
}
