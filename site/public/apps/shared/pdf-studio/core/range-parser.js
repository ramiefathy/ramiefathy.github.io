const RANGE_TOKEN_PATTERN = /^\s*(\d+)(?:\s*-\s*(\d+))?\s*$/

export class RangeParseError extends Error {
  constructor(message, token) {
    super(message)
    this.name = 'RangeParseError'
    this.token = token
  }
}

/**
 * Parse a user range string (1-indexed) into deterministic page selections.
 *
 * @param {string} expression
 * @param {number} totalPages
 * @returns {{ pages: number[], blocks: Array<{start: number, end: number}> }}
 */
export function parseRangeExpression(expression, totalPages) {
  if (!Number.isInteger(totalPages) || totalPages <= 0) {
    throw new RangeParseError('Document page count must be a positive integer.', '')
  }

  const raw = String(expression || '').trim()
  if (!raw) {
    throw new RangeParseError('Enter at least one page or range.', raw)
  }

  const tokens = raw.split(',').map((token) => token.trim()).filter(Boolean)
  if (!tokens.length) {
    throw new RangeParseError('Enter at least one page or range.', raw)
  }

  const blocks = []
  const uniquePages = new Set()

  for (const token of tokens) {
    const match = token.match(RANGE_TOKEN_PATTERN)
    if (!match) {
      throw new RangeParseError(`Invalid range token "${token}". Use formats like 3 or 2-5.`, token)
    }

    const start = Number.parseInt(match[1], 10)
    const end = match[2] ? Number.parseInt(match[2], 10) : start

    if (start < 1 || end < 1) {
      throw new RangeParseError(`Page ${Math.min(start, end)} is invalid. Pages start at 1.`, token)
    }
    if (start > totalPages || end > totalPages) {
      throw new RangeParseError(
        `Page ${Math.max(start, end)} exceeds document length (max ${totalPages}).`,
        token
      )
    }
    if (start > end) {
      throw new RangeParseError(`Range "${token}" is reversed. Use smaller-to-larger ordering.`, token)
    }

    blocks.push({ start, end })
    for (let page = start; page <= end; page += 1) {
      uniquePages.add(page)
    }
  }

  const pages = Array.from(uniquePages).sort((a, b) => a - b)
  return { pages, blocks }
}

/**
 * Convert 1-indexed pages to zero-indexed pages for pdf-lib copyPages.
 *
 * @param {number[]} pages
 * @returns {number[]}
 */
export function toZeroBasedPages(pages) {
  return pages.map((page) => page - 1)
}
