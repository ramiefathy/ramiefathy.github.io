/**
 * Canonical intent definitions for the scheduling chatbot.
 * Each intent describes the structured payload we expect back from Gemini.
 * These definitions are used both for prompt construction and runtime validation
 * before the orchestration layer mutates any Firestore data.
 */

const ACTIONS = {
  ADD_ASSIGNMENT: 'add_assignment',
  MOVE_ASSIGNMENT: 'move_assignment',
  DELETE_ASSIGNMENT: 'delete_assignment',
  ADD_ATTENDING_OVERRIDE: 'add_attending_override',
  REMOVE_ATTENDING_OVERRIDE: 'remove_attending_override',
  CREATE_ATTENDING: 'create_attending',
  UPDATE_ATTENDING: 'update_attending',
  CREATE_RESIDENT: 'create_resident',
  UPDATE_RESIDENT: 'update_resident',
  CREATE_CLINIC: 'create_clinic',
  UPDATE_CLINIC: 'update_clinic',
  UNDO: 'undo_action',
  INFO_ONLY: 'informational', // Used when Gemini should reply without mutations
  SUMMARIZE_COVERAGE: 'summarize_coverage',
  BULK_CREATE_RESIDENTS: 'bulk_create_residents',
  BULK_CREATE_ATTENDINGS: 'bulk_create_attendings'
};

const INTENT_SCHEMAS = {
  [ACTIONS.ADD_ASSIGNMENT]: {
    description: 'Create a new single or recurring assignment for a resident/attending',
    required: ['date', 'timeSlot'],
    properties: {
      date: { type: 'string', format: 'date' },
      timeSlot: { type: 'string', enum: ['AM', 'PM'] },
      residentId: { type: 'string' },
      attendingId: { type: 'string' },
      clinicId: { type: ['string', 'null'] },
      siteId: { type: ['string', 'null'] },
      recurrence: {
        type: ['object', 'null'],
        properties: {
          frequency: { type: 'string', enum: ['weekly'] },
          occurrences: { type: 'integer', minimum: 1, maximum: 12 }
        }
      },
      notes: { type: ['string', 'null'] }
    }
  },
  [ACTIONS.MOVE_ASSIGNMENT]: {
    description: 'Move an existing assignment to a new date or time slot',
    required: ['assignmentId', 'date', 'timeSlot'],
    properties: {
      assignmentId: { type: 'string' },
      date: { type: 'string', format: 'date' },
      timeSlot: { type: 'string', enum: ['AM', 'PM'] }
    }
  },
  [ACTIONS.DELETE_ASSIGNMENT]: {
    description: 'Delete an existing assignment',
    required: ['assignmentId'],
    properties: {
      assignmentId: { type: 'string' }
    }
  },
  [ACTIONS.ADD_ATTENDING_OVERRIDE]: {
    description: 'Add a one-off attending clinic override (extra session)',
    required: ['attendingId', 'date', 'timeSlot', 'clinicId', 'capacity'],
    properties: {
      attendingId: { type: 'string' },
      date: { type: 'string', format: 'date' },
      timeSlot: { type: 'string', enum: ['AM', 'PM'] },
      clinicId: { type: 'string' },
      siteId: { type: ['string', 'null'] },
      capacity: { type: 'integer', minimum: 0, maximum: 6 }
    }
  },
  [ACTIONS.REMOVE_ATTENDING_OVERRIDE]: {
    description: 'Cancel a one-off attending override on a given slot',
    required: ['attendingId', 'date', 'timeSlot', 'clinicId'],
    properties: {
      attendingId: { type: 'string' },
      date: { type: 'string', format: 'date' },
      timeSlot: { type: 'string', enum: ['AM', 'PM'] },
      clinicId: { type: 'string' }
    }
  },
  [ACTIONS.CREATE_ATTENDING]: {
    description: 'Create a new attending profile',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      email: { type: ['string', 'null'] },
      phone: { type: ['string', 'null'] },
      rotationIds: { type: ['array', 'null'], items: { type: 'string' } }
    }
  },
  [ACTIONS.UPDATE_ATTENDING]: {
    description: 'Update attributes of an existing attending',
    required: ['attendingId'],
    properties: {
      attendingId: { type: 'string' },
      name: { type: ['string', 'null'] },
      email: { type: ['string', 'null'] },
      phone: { type: ['string', 'null'] },
      rotationIds: { type: ['array', 'null'], items: { type: 'string' } }
    }
  },
  [ACTIONS.CREATE_RESIDENT]: {
    description: 'Create a new resident profile',
    required: ['name', 'pgyStatus'],
    properties: {
      name: { type: 'string' },
      pgyStatus: { type: 'string' },
      email: { type: ['string', 'null'] }
    }
  },
  [ACTIONS.UPDATE_RESIDENT]: {
    description: 'Update an existing resident',
    required: ['residentId'],
    properties: {
      residentId: { type: 'string' },
      name: { type: ['string', 'null'] },
      pgyStatus: { type: ['string', 'null'] },
      email: { type: ['string', 'null'] }
    }
  },
  [ACTIONS.CREATE_CLINIC]: {
    description: 'Create a new clinic template for an attending',
    required: ['attendingId', 'name', 'siteId', 'residentCapacity'],
    properties: {
      attendingId: { type: 'string' },
      name: { type: 'string' },
      siteId: { type: 'string' },
      residentCapacity: { type: 'integer', minimum: 0, maximum: 6 },
      defaultSessions: {
        type: ['array', 'null'],
        items: {
          type: 'object',
          properties: {
            dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
            timeSlot: { type: 'string', enum: ['AM', 'PM'] }
          }
        }
      }
    }
  },
  [ACTIONS.UPDATE_CLINIC]: {
    description: 'Update metadata for an existing clinic template',
    required: ['attendingId', 'clinicId'],
    properties: {
      attendingId: { type: 'string' },
      clinicId: { type: 'string' },
      name: { type: ['string', 'null'] },
      residentCapacity: { type: ['integer', 'null'], minimum: 0, maximum: 6 }
    }
  },
  [ACTIONS.UNDO]: {
    description: 'Undo one or more of the most recent chatbot actions for the user',
    required: [],
    properties: {
      steps: { type: ['integer', 'null'], minimum: 1, maximum: 25, description: 'Number of actions to undo, defaults to 1.' }
    }
  },
  [ACTIONS.INFO_ONLY]: {
    description: 'Respond to the user without mutating data (FAQs, clarifications)',
    required: [],
    properties: {
      message: { type: ['string', 'null'] }
    }
  },
  [ACTIONS.SUMMARIZE_COVERAGE]: {
    description: 'Summarize clinic coverage across assignments for a specific day or range',
    required: [],
    properties: {
      date: { type: ['string', 'null'], format: 'date', description: 'Single date to summarize (defaults to today).' },
      startDate: { type: ['string', 'null'], format: 'date', description: 'Inclusive range start when summarizing multiple days.' },
      endDate: { type: ['string', 'null'], format: 'date', description: 'Inclusive range end when summarizing multiple days.' }
    }
  },
  [ACTIONS.BULK_CREATE_RESIDENTS]: {
    description: 'Create multiple resident profiles from structured roster data',
    required: ['entries'],
    properties: {
      entries: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'pgyStatus'],
          properties: {
            name: { type: 'string' },
            pgyStatus: { type: 'string' },
            email: { type: ['string', 'null'] }
          }
        }
      }
    }
  },
  [ACTIONS.BULK_CREATE_ATTENDINGS]: {
    description: 'Create multiple attending profiles from structured roster data',
    required: ['entries'],
    properties: {
      entries: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            email: { type: ['string', 'null'] },
            phone: { type: ['string', 'null'] },
            rotationIds: { type: ['array', 'null'], items: { type: 'string' } }
          }
        }
      }
    }
  }
};

module.exports = {
  ACTIONS,
  INTENT_SCHEMAS
};
