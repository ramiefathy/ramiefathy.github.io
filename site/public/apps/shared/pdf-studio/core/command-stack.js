/**
 * Small command stack with undo/redo support.
 */
export class CommandStack {
  constructor(limit = 100) {
    this.limit = limit
    this.undoStack = []
    this.redoStack = []
  }

  canUndo() {
    return this.undoStack.length > 0
  }

  canRedo() {
    return this.redoStack.length > 0
  }

  clear() {
    this.undoStack = []
    this.redoStack = []
  }

  async execute(command) {
    if (!command || typeof command.do !== 'function' || typeof command.undo !== 'function') {
      throw new Error('Command must provide async do() and undo() functions.')
    }

    await command.do()
    this.undoStack.push(command)
    if (this.undoStack.length > this.limit) {
      this.undoStack.shift()
    }
    this.redoStack = []
  }

  async undo() {
    if (!this.canUndo()) return false
    const command = this.undoStack.pop()
    await command.undo()
    this.redoStack.push(command)
    return true
  }

  async redo() {
    if (!this.canRedo()) return false
    const command = this.redoStack.pop()
    await command.do()
    this.undoStack.push(command)
    return true
  }
}
