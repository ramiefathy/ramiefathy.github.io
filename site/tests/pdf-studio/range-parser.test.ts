import { describe, expect, it } from 'vitest'

import {
  RangeParseError,
  parseRangeExpression,
  toZeroBasedPages
} from '../../public/apps/shared/pdf-studio/core/range-parser.js'

describe('parseRangeExpression', () => {
  it('parses mixed page and range tokens', () => {
    const result = parseRangeExpression('1-3, 7, 10-12', 20)
    expect(result.blocks).toEqual([
      { start: 1, end: 3 },
      { start: 7, end: 7 },
      { start: 10, end: 12 }
    ])
    expect(result.pages).toEqual([1, 2, 3, 7, 10, 11, 12])
  })

  it('deduplicates and sorts overlapping ranges', () => {
    const result = parseRangeExpression('5-7, 7-9, 5', 12)
    expect(result.pages).toEqual([5, 6, 7, 8, 9])
  })

  it('throws strict validation errors for invalid input', () => {
    expect(() => parseRangeExpression('0', 12)).toThrowError(RangeParseError)
    expect(() => parseRangeExpression('88', 57)).toThrow(/exceeds document length/)
    expect(() => parseRangeExpression('8-4', 12)).toThrow(/reversed/)
    expect(() => parseRangeExpression('abc', 12)).toThrow(/Invalid range token/)
  })

  it('maps one-indexed pages to zero-indexed pages', () => {
    expect(toZeroBasedPages([1, 3, 12])).toEqual([0, 2, 11])
  })
})
