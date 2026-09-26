import { describe, expect, it } from 'vitest'

import { complexLibrary } from './complexLibrary'
import { templateToForm, validateComplexForm } from './complexForm'

describe('complex library', () => {
  it('has all 20 complexes, each with a unique name and at least one movement', () => {
    expect(complexLibrary).toHaveLength(20)
    expect(new Set(complexLibrary.map((c) => c.name)).size).toBe(20)
    for (const c of complexLibrary) expect(c.movements.length).toBeGreaterThan(0)
  })

  it('every template fills in a form that saves cleanly', () => {
    for (const template of complexLibrary) {
      const { errors, complex } = validateComplexForm(templateToForm(template), [])
      expect(errors).toEqual({})
      expect(complex?.movements).toEqual(template.movements)
      expect(complex?.durationMin).toBe(20)
    }
  })
})
