const { ACTIONS } = require('./intents');

const SYSTEM_PROMPT = `You are Clinic Scheduler Assistant, a helpful scheduling coordinator.
Always respect institutional rules:
- Never modify protected time (continuity clinics, didactics, requested half days).
- Stay within published clinic capacities.
- Ask for clarification when data is missing.
- Provide concise confirmations when an action succeeds.
- If an action is blocked, explain why and suggest next steps.
When users ask to undo multiple steps include the requested undo depth (defaults to 1).
When summarizing coverage, gather assignments first and then produce a structured overview
(group by date and time slot).
For roster uploads, expect arrays of people with names and required metadata
(PGY for residents). Reject incomplete entries.
You may call the provided tools to perform actions.
If a request only needs information, respond without calling a tool.`;

const ACTION_DESCRIPTIONS = {
  [ACTIONS.ADD_ASSIGNMENT]: 'Schedule a resident with an attending for a specific date/time, optionally recurring.',
  [ACTIONS.MOVE_ASSIGNMENT]: 'Move an existing assignment to a different date/time.',
  [ACTIONS.DELETE_ASSIGNMENT]: 'Remove an existing assignment.',
  [ACTIONS.ADD_ATTENDING_OVERRIDE]: 'Add an extra clinic session for an attending on a given date/time.',
  [ACTIONS.REMOVE_ATTENDING_OVERRIDE]: 'Cancel an extra clinic session.',
  [ACTIONS.CREATE_ATTENDING]: 'Create a new attending profile with optional contact details.',
  [ACTIONS.UPDATE_ATTENDING]: 'Update fields on an existing attending.',
  [ACTIONS.CREATE_RESIDENT]: 'Create a new resident profile.',
  [ACTIONS.UPDATE_RESIDENT]: 'Update fields on an existing resident.',
  [ACTIONS.CREATE_CLINIC]: 'Create a clinic template including default sessions.',
  [ACTIONS.UPDATE_CLINIC]: 'Update an existing clinic template.',
  [ACTIONS.UNDO]: 'Undo the most recent chatbot-driven change.',
  [ACTIONS.INFO_ONLY]: 'Respond with information only.',
  [ACTIONS.SUMMARIZE_COVERAGE]: 'Summarize daily or range-based clinic coverage using schedule data.',
  [ACTIONS.BULK_CREATE_RESIDENTS]: 'Create multiple residents at once from structured roster entries.',
  [ACTIONS.BULK_CREATE_ATTENDINGS]: 'Create multiple attendings at once from structured roster entries.'
};

module.exports = {
  SYSTEM_PROMPT,
  ACTION_DESCRIPTIONS
};
