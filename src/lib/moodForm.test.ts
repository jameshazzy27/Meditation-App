import { describe, expect, it } from 'vitest'

import { STARTER_TAGS, suggestedTags, toggleTag, validateMoodForm } from './moodForm'

describe('mood form', () => {
  it('suggests your tags first, then unused starter tags, then new selections', () => {
    const tags = suggestedTags(['work', 'coffee'], ['brand new'])
    expect(tags.slice(0, 2)).toEqual(['work', 'coffee'])
    expect(tags.filter((t) => t === 'work')).toHaveLength(1)
    expect(tags).toContain('sleep')
    expect(tags.at(-1)).toBe('brand new')
    expect(suggestedTags([], [])).toEqual(STARTER_TAGS)
  })

  it('toggles tags, tidying what you type', () => {
    expect(toggleTag([], '  Long  Walk ')).toEqual(['long walk'])
    expect(toggleTag(['sleep'], 'Sleep')).toEqual([])
    expect(toggleTag(['sleep'], '   ')).toEqual(['sleep'])
  })

  it('needs a rating', () => {
    expect(validateMoodForm({ date: '2026-09-26', tags: [], notes: '' }).errors.rating).toBeDefined()
    expect(validateMoodForm({ date: '2026-09-26', rating: 4, tags: ['sleep', 'Sleep'], notes: ' ok ' }).mood).toEqual({
      date: '2026-09-26',
      rating: 4,
      tags: ['sleep'],
      notes: 'ok',
    })
  })
})
