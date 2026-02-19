import { describe, expect, it } from 'vitest'

import { CommandStack } from '../../public/apps/shared/pdf-studio/core/command-stack.js'

describe('CommandStack', () => {
  it('executes, undoes, and redoes commands', async () => {
    const stack = new CommandStack(10)
    let value = 0

    await stack.execute({
      do: async () => {
        value += 2
      },
      undo: async () => {
        value -= 2
      }
    })

    expect(value).toBe(2)
    expect(stack.canUndo()).toBe(true)
    expect(stack.canRedo()).toBe(false)

    await stack.undo()
    expect(value).toBe(0)
    expect(stack.canRedo()).toBe(true)

    await stack.redo()
    expect(value).toBe(2)
  })

  it('clears redo stack after a new execute', async () => {
    const stack = new CommandStack()
    const values: string[] = []

    await stack.execute({ do: async () => values.push('a'), undo: async () => { values.pop() } })
    await stack.execute({ do: async () => values.push('b'), undo: async () => { values.pop() } })
    await stack.undo()
    expect(values).toEqual(['a'])

    await stack.execute({ do: async () => values.push('c'), undo: async () => { values.pop() } })
    expect(stack.canRedo()).toBe(false)
    expect(values).toEqual(['a', 'c'])
  })
})
