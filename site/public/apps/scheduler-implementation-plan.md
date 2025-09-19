# Clinic Scheduler - Detailed Implementation Plan

## Overview
This document provides an extensive, detailed implementation plan for the first three major enhancements to the Clinic Scheduler application, with careful consideration for future extensibility.

## Architecture Foundation

### Technology Stack
```javascript
// Core Technologies
{
  frontend: {
    framework: "React 18 with TypeScript",
    stateManagement: "Zustand with Immer",
    styling: "Tailwind CSS + Radix UI",
    dataFetching: "TanStack Query",
    forms: "React Hook Form + Zod",
    routing: "React Router v6"
  },
  backend: {
    runtime: "Node.js 20+ with Express",
    database: "PostgreSQL with Prisma ORM",
    cache: "Redis",
    queue: "Bull MQ",
    websocket: "Socket.io"
  },
  ai: {
    primary: "Gemini 1.5 Pro API",
    fallback: "Claude API",
    embedding: "text-embedding-ada-002"
  },
  infrastructure: {
    hosting: "Vercel/Railway",
    database: "Supabase/Neon",
    storage: "S3/Cloudflare R2",
    cdn: "Cloudflare"
  }
}
```

### Database Schema Design
```sql
-- Core User Management
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'program_admin',
  'chief_resident',
  'scheduler',
  'attending_scheduler',
  'attending',
  'resident'
);

CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role user_role NOT NULL,
  profile JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Scheduling Entities
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  address JSONB,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(institution_id, code)
);

CREATE TABLE rotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  color VARCHAR(7),
  requirements JSONB DEFAULT '{}',
  is_clinical BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(institution_id, code)
);

CREATE TABLE attendings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  institution_id UUID REFERENCES institutions(id),
  name VARCHAR(255) NOT NULL,
  default_site_id UUID REFERENCES sites(id),
  capacity_am INTEGER DEFAULT 1,
  capacity_pm INTEGER DEFAULT 1,
  availability_pattern JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  institution_id UUID REFERENCES institutions(id),
  name VARCHAR(255) NOT NULL,
  pgy_level INTEGER NOT NULL,
  current_rotation_id UUID REFERENCES rotations(id),
  continuity_site_id UUID REFERENCES sites(id),
  continuity_day VARCHAR(10),
  continuity_time VARCHAR(2),
  preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scheduling Rules Engine
CREATE TABLE rule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  rule_definition JSONB NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scheduling_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id),
  template_id UUID REFERENCES rule_templates(id),
  name VARCHAR(255) NOT NULL,
  natural_language TEXT,
  structured_rule JSONB NOT NULL,
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  validated_at TIMESTAMP,
  validation_result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rule_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule1_id UUID REFERENCES scheduling_rules(id),
  rule2_id UUID REFERENCES scheduling_rules(id),
  conflict_type VARCHAR(100),
  description TEXT,
  resolution_strategy JSONB,
  resolved_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id)
);

-- Schedule Management
CREATE TABLE schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  locked BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE schedule_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_block_id UUID REFERENCES schedule_blocks(id),
  resident_id UUID REFERENCES residents(id),
  attending_id UUID REFERENCES attendings(id),
  site_id UUID REFERENCES sites(id),
  date DATE NOT NULL,
  time_slot VARCHAR(2) NOT NULL, -- 'AM' or 'PM'
  assignment_type VARCHAR(50), -- 'clinical', 'continuity', 'didactic', etc
  status VARCHAR(50) DEFAULT 'scheduled',
  auto_scheduled BOOLEAN DEFAULT false,
  locked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resident_id, date, time_slot)
);

CREATE INDEX idx_assignments_date ON schedule_assignments(date);
CREATE INDEX idx_assignments_resident ON schedule_assignments(resident_id);
CREATE INDEX idx_assignments_attending ON schedule_assignments(attending_id);

-- Protected Time Management
CREATE TABLE protected_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- 'didactic', 'conference', 'holiday', etc
  recurrence_rule JSONB, -- RRULE format
  day_of_week INTEGER,
  time_slot VARCHAR(2),
  start_date DATE,
  end_date DATE,
  applies_to JSONB, -- {pgy_levels: [], rotations: [], etc}
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit and History
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  institution_id UUID REFERENCES institutions(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE schedule_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES schedule_assignments(id),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Feature 1: AI-Powered Natural Language Rule Engine

### Detailed Implementation Plan

#### 1.1 Core Architecture

```typescript
// Rule Engine Core Types
interface SchedulingRule {
  id: string;
  institutionId: string;
  name: string;
  naturalLanguage: string;
  structuredRule: StructuredRule;
  priority: number;
  isActive: boolean;
  metadata: RuleMetadata;
}

interface StructuredRule {
  entities: RuleEntity[];
  conditions: RuleCondition[];
  constraints: RuleConstraint[];
  actions: RuleAction[];
  exceptions: RuleException[];
}

interface RuleEntity {
  type: 'resident' | 'attending' | 'site' | 'rotation';
  filter: EntityFilter;
  alias: string;
}

interface RuleCondition {
  type: 'temporal' | 'spatial' | 'workload' | 'educational';
  operator: 'equals' | 'greater' | 'less' | 'between' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR' | 'NOT';
}

interface RuleConstraint {
  type: 'hard' | 'soft';
  description: string;
  penalty: number; // For soft constraints
  evaluate: (context: ScheduleContext) => boolean;
}

interface RuleAction {
  type: 'assign' | 'block' | 'warn' | 'suggest';
  parameters: Record<string, any>;
}
```

#### 1.2 Natural Language Processing Pipeline

```typescript
// services/ai/RuleInterpreter.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

class RuleInterpreter {
  private gemini: GoogleGenerativeAI;
  private ruleParser: RuleParser;
  private validator: RuleValidator;

  async interpretRule(naturalLanguage: string, context: InstitutionContext): Promise<InterpretationResult> {
    // Step 1: Preprocess and enhance input
    const enhanced = await this.enhanceWithContext(naturalLanguage, context);

    // Step 2: Generate structured rule using Gemini
    const structuredRule = await this.generateStructuredRule(enhanced);

    // Step 3: Validate and check conflicts
    const validation = await this.validator.validate(structuredRule, context);

    // Step 4: Generate human-readable explanation
    const explanation = await this.generateExplanation(structuredRule);

    // Step 5: Suggest optimizations
    const optimizations = await this.suggestOptimizations(structuredRule, context);

    return {
      original: naturalLanguage,
      structured: structuredRule,
      validation,
      explanation,
      optimizations,
      confidence: this.calculateConfidence(structuredRule, validation)
    };
  }

  private async generateStructuredRule(input: string): Promise<StructuredRule> {
    const prompt = `
      Convert the following scheduling rule into a structured JSON format.

      Input Rule: "${input}"

      Context:
      - This is for a medical residency scheduling system
      - Consider attending capacity, resident rotations, and educational requirements
      - Identify entities (residents, attendings, sites, times)
      - Extract conditions (when the rule applies)
      - Define constraints (what must or must not happen)
      - Specify actions (what to do when rule is triggered)

      Return a JSON object with this structure:
      {
        "entities": [
          {
            "type": "resident|attending|site|rotation",
            "filter": {
              "field": "property_name",
              "operator": "equals|contains|greater|less",
              "value": "filter_value"
            },
            "alias": "reference_name"
          }
        ],
        "conditions": [
          {
            "type": "temporal|spatial|workload|educational",
            "description": "human readable condition",
            "operator": "equals|greater|less|between|in|not_in",
            "value": "condition_value",
            "logicalOperator": "AND|OR|NOT"
          }
        ],
        "constraints": [
          {
            "type": "hard|soft",
            "description": "what must/should (not) happen",
            "penalty": 1-10 (for soft constraints),
            "checkFunction": "name_of_validation_function"
          }
        ],
        "actions": [
          {
            "type": "assign|block|warn|suggest",
            "description": "what to do",
            "parameters": {}
          }
        ],
        "exceptions": [
          {
            "condition": "when this exception applies",
            "override": "what to do instead"
          }
        ]
      }

      Examples:
      Input: "PGY2 residents must have at least 2 dermatopathology sessions per month"
      Output: {
        "entities": [{"type": "resident", "filter": {"field": "pgy_level", "operator": "equals", "value": 2}, "alias": "pgy2_residents"}],
        "conditions": [{"type": "temporal", "description": "per calendar month", "operator": "equals", "value": "monthly"}],
        "constraints": [{"type": "hard", "description": "minimum 2 dermatopathology sessions", "checkFunction": "checkMinimumRotationSessions"}],
        "actions": [{"type": "warn", "description": "Alert if PGY2 has < 2 dermpath sessions"}]
      }
    `;

    const result = await this.gemini.generateContent(prompt);
    return JSON.parse(result.response.text());
  }

  private async enhanceWithContext(rule: string, context: InstitutionContext): string {
    // Add institutional context to improve interpretation
    const enhanced = `
      Institution: ${context.institutionName}
      Sites: ${context.sites.join(', ')}
      Rotations: ${context.rotations.join(', ')}
      Protected Times: ${context.protectedTimes.map(pt => `${pt.name} (${pt.day} ${pt.time})`).join(', ')}

      Rule: ${rule}
    `;
    return enhanced;
  }

  private async validateAgainstExisting(rule: StructuredRule, existingRules: SchedulingRule[]): Promise<ConflictAnalysis> {
    const conflicts: RuleConflict[] = [];

    for (const existing of existingRules) {
      // Check for direct conflicts
      const directConflict = this.checkDirectConflict(rule, existing.structuredRule);
      if (directConflict) {
        conflicts.push({
          type: 'direct',
          conflictingRule: existing,
          description: directConflict,
          severity: 'high'
        });
      }

      // Check for logical inconsistencies
      const logicalConflict = this.checkLogicalConflict(rule, existing.structuredRule);
      if (logicalConflict) {
        conflicts.push({
          type: 'logical',
          conflictingRule: existing,
          description: logicalConflict,
          severity: 'medium'
        });
      }

      // Check for resource conflicts
      const resourceConflict = this.checkResourceConflict(rule, existing.structuredRule);
      if (resourceConflict) {
        conflicts.push({
          type: 'resource',
          conflictingRule: existing,
          description: resourceConflict,
          severity: 'low'
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      resolutionStrategies: this.generateResolutionStrategies(conflicts)
    };
  }
}
```

#### 1.3 Rule Execution Engine

```typescript
// services/scheduling/RuleExecutionEngine.ts
class RuleExecutionEngine {
  private rules: Map<string, CompiledRule>;
  private cache: RuleCache;
  private logger: Logger;

  async executeRules(
    context: ScheduleContext,
    proposedAssignment: Assignment
  ): Promise<RuleExecutionResult> {
    // Get applicable rules sorted by priority
    const applicableRules = await this.getApplicableRules(context, proposedAssignment);

    const results: RuleCheckResult[] = [];
    const violations: RuleViolation[] = [];
    const warnings: RuleWarning[] = [];
    const suggestions: RuleSuggestion[] = [];

    for (const rule of applicableRules) {
      try {
        const result = await this.executeRule(rule, context, proposedAssignment);
        results.push(result);

        if (result.violated) {
          violations.push({
            rule: rule.id,
            severity: rule.constraint.type === 'hard' ? 'error' : 'warning',
            message: result.message,
            context: result.context
          });
        }

        if (result.warnings.length > 0) {
          warnings.push(...result.warnings);
        }

        if (result.suggestions.length > 0) {
          suggestions.push(...result.suggestions);
        }

        // Stop on hard constraint violation
        if (result.violated && rule.constraint.type === 'hard') {
          break;
        }
      } catch (error) {
        this.logger.error(`Error executing rule ${rule.id}:`, error);
        // Continue with other rules
      }
    }

    return {
      allowed: violations.filter(v => v.severity === 'error').length === 0,
      violations,
      warnings,
      suggestions,
      executionTime: Date.now() - context.startTime,
      rulesChecked: results.length
    };
  }

  private async compileRule(rule: SchedulingRule): Promise<CompiledRule> {
    // Generate optimized JavaScript function for rule evaluation
    const functionBody = this.generateRuleFunctionBody(rule.structuredRule);

    return {
      id: rule.id,
      priority: rule.priority,
      constraint: rule.structuredRule.constraints[0], // Primary constraint
      evaluate: new Function('context', 'assignment', functionBody) as RuleEvaluator,
      metadata: rule.metadata
    };
  }

  private generateRuleFunctionBody(rule: StructuredRule): string {
    // Generate optimized JavaScript code for rule evaluation
    let code = `
      // Entity extraction
      ${rule.entities.map(e => this.generateEntityExtractor(e)).join('\n')}

      // Condition checking
      const conditionsMet = ${this.generateConditionChecker(rule.conditions)};

      if (!conditionsMet) {
        return { applicable: false };
      }

      // Constraint validation
      ${rule.constraints.map(c => this.generateConstraintValidator(c)).join('\n')}

      // Action execution
      const actions = [];
      ${rule.actions.map(a => this.generateActionExecutor(a)).join('\n')}

      return {
        applicable: true,
        violated: constraintViolations.length > 0,
        violations: constraintViolations,
        actions: actions
      };
    `;

    return code;
  }
}
```

#### 1.4 Rule Templates Library

```typescript
// data/ruleTemplates.ts
const RULE_TEMPLATES = {
  continuity: {
    minSeparation: {
      name: "Minimum Continuity Separation",
      template: "Residents must have at least {days} days between continuity clinics",
      parameters: { days: { type: 'number', min: 1, max: 7, default: 2 } },
      category: "workload"
    },
    siteConsistency: {
      name: "Continuity Site Consistency",
      template: "Residents must have continuity clinic at the same site throughout the {period}",
      parameters: { period: { type: 'select', options: ['month', 'block', 'year'], default: 'block' } },
      category: "educational"
    }
  },
  workload: {
    maxConsecutive: {
      name: "Maximum Consecutive Clinics",
      template: "{level} residents cannot have more than {max} consecutive {timeframe} clinics",
      parameters: {
        level: { type: 'select', options: ['PGY2', 'PGY3', 'PGY4', 'All'], default: 'All' },
        max: { type: 'number', min: 1, max: 10, default: 3 },
        timeframe: { type: 'select', options: ['half-day', 'full-day'], default: 'half-day' }
      },
      category: "workload"
    },
    weeklyLimit: {
      name: "Weekly Clinic Limit",
      template: "{level} residents should not exceed {hours} clinical hours per week",
      parameters: {
        level: { type: 'select', options: ['PGY2', 'PGY3', 'PGY4', 'All'], default: 'All' },
        hours: { type: 'number', min: 20, max: 80, default: 40 }
      },
      category: "compliance"
    }
  },
  educational: {
    rotationMinimum: {
      name: "Rotation Minimum Requirements",
      template: "{level} residents must have at least {count} {rotation} sessions per {period}",
      parameters: {
        level: { type: 'select', options: ['PGY2', 'PGY3', 'PGY4', 'All'], default: 'PGY2' },
        count: { type: 'number', min: 1, max: 20, default: 2 },
        rotation: { type: 'select', options: ['dermatopathology', 'pediatrics', 'surgery'], default: 'dermatopathology' },
        period: { type: 'select', options: ['week', 'month', 'block'], default: 'month' }
      },
      category: "educational"
    },
    protectedTime: {
      name: "Protected Educational Time",
      template: "All {level} residents must be free for {event} on {day} {time}",
      parameters: {
        level: { type: 'select', options: ['PGY2', 'PGY3', 'PGY4', 'All'], default: 'All' },
        event: { type: 'text', default: 'didactics' },
        day: { type: 'select', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], default: 'Wednesday' },
        time: { type: 'select', options: ['AM', 'PM', 'All day'], default: 'AM' }
      },
      category: "educational"
    }
  }
};
```

#### 1.5 Frontend Components

```tsx
// components/rules/RuleBuilder.tsx
import React, { useState } from 'react';
import { useRuleInterpreter } from '@/hooks/useRuleInterpreter';

export const RuleBuilder: React.FC = () => {
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [interpretation, setInterpretation] = useState<InterpretationResult | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const { interpretRule, validateRule, saveRule } = useRuleInterpreter();

  const handleInterpret = async () => {
    setIsInterpreting(true);
    try {
      const result = await interpretRule(naturalLanguage);
      setInterpretation(result);
    } catch (error) {
      console.error('Failed to interpret rule:', error);
    } finally {
      setIsInterpreting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Natural Language Input */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Create Scheduling Rule</h3>

        <div className="space-y-4">
          {/* Template Selector */}
          <TemplateSelector
            onSelect={(template) => setNaturalLanguage(template)}
          />

          {/* Natural Language Editor */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Describe your rule in plain English
            </label>
            <textarea
              value={naturalLanguage}
              onChange={(e) => setNaturalLanguage(e.target.value)}
              className="w-full h-32 p-3 border rounded-lg"
              placeholder="e.g., PGY2 residents should not have more than 3 consecutive clinic days"
            />
          </div>

          <button
            onClick={handleInterpret}
            disabled={isInterpreting || !naturalLanguage}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {isInterpreting ? 'Interpreting...' : 'Interpret Rule'}
          </button>
        </div>
      </div>

      {/* Interpretation Results */}
      {interpretation && (
        <InterpretationDisplay
          interpretation={interpretation}
          onConfirm={async () => {
            await saveRule(interpretation.structured);
            // Reset or navigate
          }}
          onEdit={(edited) => setInterpretation(edited)}
        />
      )}
    </div>
  );
};

// components/rules/InterpretationDisplay.tsx
const InterpretationDisplay: React.FC<{
  interpretation: InterpretationResult;
  onConfirm: () => void;
  onEdit: (edited: InterpretationResult) => void;
}> = ({ interpretation, onConfirm, onEdit }) => {
  const [editMode, setEditMode] = useState(false);
  const [editedRule, setEditedRule] = useState(interpretation.structured);

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Confidence Score */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Rule Interpretation</h3>
        <ConfidenceIndicator score={interpretation.confidence} />
      </div>

      {/* Human-Readable Explanation */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">What this rule means:</h4>
        <p className="text-gray-700">{interpretation.explanation}</p>
      </div>

      {/* Structured Rule Display */}
      <div className="space-y-4">
        <RuleSection
          title="Applies To"
          items={editedRule.entities}
          editMode={editMode}
          onEdit={(entities) => setEditedRule({...editedRule, entities})}
        />

        <RuleSection
          title="Conditions"
          items={editedRule.conditions}
          editMode={editMode}
          onEdit={(conditions) => setEditedRule({...editedRule, conditions})}
        />

        <RuleSection
          title="Constraints"
          items={editedRule.constraints}
          editMode={editMode}
          onEdit={(constraints) => setEditedRule({...editedRule, constraints})}
        />
      </div>

      {/* Validation Results */}
      {interpretation.validation.hasConflicts && (
        <ConflictDisplay conflicts={interpretation.validation.conflicts} />
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => setEditMode(!editMode)}
          className="px-4 py-2 border rounded-lg"
        >
          {editMode ? 'Done Editing' : 'Edit Rule'}
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Save Rule
        </button>
      </div>
    </div>
  );
};
```

## Feature 2: Intelligent Auto-Scheduling Engine

### Detailed Implementation Plan

#### 2.1 Core Scheduling Algorithm

```typescript
// services/scheduling/AutoScheduler.ts
import { OptimizationEngine } from './OptimizationEngine';
import { ConstraintSolver } from './ConstraintSolver';

class AutoScheduler {
  private optimizer: OptimizationEngine;
  private solver: ConstraintSolver;
  private ruleEngine: RuleExecutionEngine;

  async generateSchedule(
    params: ScheduleGenerationParams
  ): Promise<ScheduleGenerationResult> {
    // Step 1: Initialize scheduling context
    const context = await this.initializeContext(params);

    // Step 2: Build constraint model
    const model = await this.buildConstraintModel(context);

    // Step 3: Run optimization
    const solutions = await this.findOptimalSolutions(model, params.optimizationGoals);

    // Step 4: Select best solution
    const bestSolution = await this.selectBestSolution(solutions, params.preferences);

    // Step 5: Generate assignments
    const assignments = await this.generateAssignments(bestSolution, context);

    // Step 6: Validate final schedule
    const validation = await this.validateSchedule(assignments, context);

    return {
      assignments,
      validation,
      metrics: this.calculateMetrics(assignments, context),
      alternatives: solutions.slice(0, 3)
    };
  }

  private async buildConstraintModel(context: ScheduleContext): Promise<ConstraintModel> {
    const model = new ConstraintModel();

    // Add decision variables
    for (const resident of context.residents) {
      for (const slot of context.timeSlots) {
        // Binary variable: resident r assigned to attending a in slot s
        model.addVariable({
          name: `assign_${resident.id}_${slot.id}`,
          type: 'binary',
          domain: context.attendings.map(a => a.id)
        });
      }
    }

    // Add hard constraints
    await this.addHardConstraints(model, context);

    // Add soft constraints with penalties
    await this.addSoftConstraints(model, context);

    // Add optimization objectives
    await this.addObjectives(model, context);

    return model;
  }

  private async addHardConstraints(model: ConstraintModel, context: ScheduleContext) {
    // 1. Capacity constraints
    model.addConstraint({
      name: 'attending_capacity',
      type: 'hard',
      evaluate: (assignment) => {
        for (const attending of context.attendings) {
          for (const slot of context.timeSlots) {
            const assigned = assignment.filter(
              a => a.attendingId === attending.id && a.slotId === slot.id
            ).length;
            if (assigned > attending.getCapacity(slot)) {
              return false;
            }
          }
        }
        return true;
      }
    });

    // 2. Resident availability (one place at a time)
    model.addConstraint({
      name: 'resident_uniqueness',
      type: 'hard',
      evaluate: (assignment) => {
        for (const resident of context.residents) {
          for (const slot of context.timeSlots) {
            const assigned = assignment.filter(
              a => a.residentId === resident.id && a.slotId === slot.id
            ).length;
            if (assigned > 1) {
              return false;
            }
          }
        }
        return true;
      }
    });

    // 3. Protected time constraints
    model.addConstraint({
      name: 'protected_time',
      type: 'hard',
      evaluate: (assignment) => {
        for (const protectedTime of context.protectedTimes) {
          const violations = assignment.filter(a => {
            const slot = context.timeSlots.find(s => s.id === a.slotId);
            return protectedTime.conflicts(slot) &&
                   protectedTime.appliesTo(a.residentId);
          });
          if (violations.length > 0) {
            return false;
          }
        }
        return true;
      }
    });

    // 4. Continuity clinic constraints
    model.addConstraint({
      name: 'continuity_clinics',
      type: 'hard',
      evaluate: (assignment) => {
        for (const resident of context.residents) {
          if (!resident.continuityClinic) continue;

          const continuitySlots = context.timeSlots.filter(slot =>
            slot.dayOfWeek === resident.continuityClinic.day &&
            slot.timeOfDay === resident.continuityClinic.time
          );

          for (const slot of continuitySlots) {
            const assigned = assignment.find(
              a => a.residentId === resident.id && a.slotId === slot.id
            );

            if (!assigned || assigned.siteId !== resident.continuityClinic.siteId) {
              return false;
            }
          }
        }
        return true;
      }
    });

    // 5. Rotation requirements
    for (const rule of context.institutionRules) {
      if (rule.constraint.type === 'hard') {
        model.addConstraint({
          name: `rule_${rule.id}`,
          type: 'hard',
          evaluate: (assignment) => {
            return this.evaluateRule(rule, assignment, context);
          }
        });
      }
    }
  }

  private async addSoftConstraints(model: ConstraintModel, context: ScheduleContext) {
    // 1. Minimize travel between sites
    model.addConstraint({
      name: 'minimize_travel',
      type: 'soft',
      penalty: 5,
      evaluate: (assignment) => {
        let travelPenalty = 0;
        for (const resident of context.residents) {
          const residentAssignments = assignment
            .filter(a => a.residentId === resident.id)
            .sort((a, b) => a.slotId.localeCompare(b.slotId));

          for (let i = 1; i < residentAssignments.length; i++) {
            if (residentAssignments[i].siteId !== residentAssignments[i-1].siteId) {
              const distance = this.getSiteDistance(
                residentAssignments[i].siteId,
                residentAssignments[i-1].siteId
              );
              travelPenalty += distance;
            }
          }
        }
        return -travelPenalty; // Negative for minimization
      }
    });

    // 2. Balance workload distribution
    model.addConstraint({
      name: 'balance_workload',
      type: 'soft',
      penalty: 3,
      evaluate: (assignment) => {
        const workloads = new Map<string, number>();

        for (const resident of context.residents) {
          const count = assignment.filter(a => a.residentId === resident.id).length;
          workloads.set(resident.id, count);
        }

        const values = Array.from(workloads.values());
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

        return -variance; // Lower variance is better
      }
    });

    // 3. Respect preferences
    model.addConstraint({
      name: 'preferences',
      type: 'soft',
      penalty: 2,
      evaluate: (assignment) => {
        let preferenceScore = 0;

        for (const a of assignment) {
          const resident = context.residents.find(r => r.id === a.residentId);
          const attending = context.attendings.find(at => at.id === a.attendingId);

          // Check resident preferences
          if (resident.preferences.preferredAttendings?.includes(a.attendingId)) {
            preferenceScore += 2;
          }
          if (resident.preferences.preferredSites?.includes(a.siteId)) {
            preferenceScore += 1;
          }

          // Check attending preferences
          if (attending.preferences.preferredResidents?.includes(a.residentId)) {
            preferenceScore += 1;
          }
        }

        return preferenceScore;
      }
    });

    // 4. Maximize attending utilization
    model.addConstraint({
      name: 'attending_utilization',
      type: 'soft',
      penalty: 1,
      evaluate: (assignment) => {
        let utilization = 0;

        for (const attending of context.attendings) {
          for (const slot of context.timeSlots) {
            const capacity = attending.getCapacity(slot);
            const assigned = assignment.filter(
              a => a.attendingId === attending.id && a.slotId === slot.id
            ).length;

            utilization += assigned / capacity;
          }
        }

        return utilization;
      }
    });
  }
}
```

#### 2.2 Constraint Satisfaction Solver

```typescript
// services/scheduling/ConstraintSolver.ts
class ConstraintSolver {
  private maxIterations: number = 10000;
  private timeLimit: number = 30000; // 30 seconds
  private tabuList: Set<string> = new Set();

  async solve(model: ConstraintModel): Promise<Solution[]> {
    const startTime = Date.now();
    const solutions: Solution[] = [];

    // Initialize with greedy solution
    let currentSolution = await this.generateGreedySolution(model);

    // Apply local search with tabu search
    let iteration = 0;
    let bestSolution = currentSolution;
    let bestScore = this.evaluateSolution(currentSolution, model);

    while (
      iteration < this.maxIterations &&
      Date.now() - startTime < this.timeLimit
    ) {
      // Generate neighborhood
      const neighbors = await this.generateNeighbors(currentSolution, model);

      // Select best non-tabu neighbor
      let bestNeighbor = null;
      let bestNeighborScore = -Infinity;

      for (const neighbor of neighbors) {
        const hash = this.hashSolution(neighbor);
        if (this.tabuList.has(hash)) continue;

        const score = this.evaluateSolution(neighbor, model);
        if (score > bestNeighborScore) {
          bestNeighbor = neighbor;
          bestNeighborScore = score;
        }
      }

      if (bestNeighbor) {
        currentSolution = bestNeighbor;
        this.tabuList.add(this.hashSolution(bestNeighbor));

        // Update tabu list size
        if (this.tabuList.size > 100) {
          const oldestEntries = Array.from(this.tabuList).slice(0, 20);
          oldestEntries.forEach(entry => this.tabuList.delete(entry));
        }

        if (bestNeighborScore > bestScore) {
          bestSolution = bestNeighbor;
          bestScore = bestNeighborScore;
          solutions.push(bestSolution);
        }
      }

      // Diversification
      if (iteration % 100 === 0) {
        currentSolution = await this.perturbSolution(currentSolution, model);
      }

      iteration++;
    }

    // Apply simulated annealing for refinement
    const refinedSolution = await this.simulatedAnnealing(bestSolution, model);
    solutions.push(refinedSolution);

    return this.rankSolutions(solutions, model);
  }

  private async generateGreedySolution(model: ConstraintModel): Promise<Solution> {
    const assignments: Assignment[] = [];
    const context = model.context;

    // Sort slots by importance (continuity first, then by day/time)
    const sortedSlots = [...context.timeSlots].sort((a, b) => {
      if (a.isContinuity !== b.isContinuity) {
        return a.isContinuity ? -1 : 1;
      }
      return a.compareTo(b);
    });

    // Sort residents by constraints (most constrained first)
    const sortedResidents = [...context.residents].sort((a, b) => {
      const aConstraints = this.countResidentConstraints(a, context);
      const bConstraints = this.countResidentConstraints(b, context);
      return bConstraints - aConstraints;
    });

    for (const slot of sortedSlots) {
      for (const resident of sortedResidents) {
        // Check if resident is already assigned for this slot
        if (assignments.some(a => a.residentId === resident.id && a.slotId === slot.id)) {
          continue;
        }

        // Find best attending for this resident/slot
        const attending = await this.findBestAttending(resident, slot, assignments, model);

        if (attending) {
          assignments.push({
            residentId: resident.id,
            attendingId: attending.id,
            siteId: attending.siteId,
            slotId: slot.id
          });
        }
      }
    }

    return { assignments, score: 0 };
  }

  private async simulatedAnnealing(
    initialSolution: Solution,
    model: ConstraintModel
  ): Promise<Solution> {
    let currentSolution = initialSolution;
    let bestSolution = initialSolution;
    let temperature = 100;
    const coolingRate = 0.95;
    const minTemperature = 0.01;

    while (temperature > minTemperature) {
      const neighbor = await this.generateRandomNeighbor(currentSolution, model);
      const currentScore = this.evaluateSolution(currentSolution, model);
      const neighborScore = this.evaluateSolution(neighbor, model);
      const delta = neighborScore - currentScore;

      if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
        currentSolution = neighbor;

        if (neighborScore > this.evaluateSolution(bestSolution, model)) {
          bestSolution = neighbor;
        }
      }

      temperature *= coolingRate;
    }

    return bestSolution;
  }
}
```

#### 2.3 Optimization Engine

```typescript
// services/scheduling/OptimizationEngine.ts
interface OptimizationGoal {
  name: string;
  weight: number;
  evaluate: (assignments: Assignment[], context: ScheduleContext) => number;
}

class OptimizationEngine {
  private goals: Map<string, OptimizationGoal> = new Map();

  constructor() {
    this.initializeStandardGoals();
  }

  private initializeStandardGoals() {
    // Minimize site transitions
    this.goals.set('minimizeSiteTransitions', {
      name: 'Minimize Site Transitions',
      weight: 1.0,
      evaluate: (assignments, context) => {
        let transitions = 0;
        const residentGroups = this.groupByResident(assignments);

        for (const [residentId, resAssignments] of residentGroups) {
          const sorted = resAssignments.sort((a, b) =>
            this.compareSlots(a.slotId, b.slotId, context)
          );

          for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].siteId !== sorted[i-1].siteId) {
              transitions++;
            }
          }
        }

        return -transitions; // Negative because we want to minimize
      }
    });

    // Maximize attending utilization
    this.goals.set('maximizeUtilization', {
      name: 'Maximize Attending Utilization',
      weight: 0.8,
      evaluate: (assignments, context) => {
        let totalUtilization = 0;
        let totalCapacity = 0;

        for (const attending of context.attendings) {
          for (const slot of context.timeSlots) {
            const capacity = attending.getCapacity(slot);
            const assigned = assignments.filter(
              a => a.attendingId === attending.id && a.slotId === slot.id
            ).length;

            totalCapacity += capacity;
            totalUtilization += Math.min(assigned, capacity);
          }
        }

        return totalCapacity > 0 ? totalUtilization / totalCapacity : 0;
      }
    });

    // Respect resident preferences
    this.goals.set('respectPreferences', {
      name: 'Respect Resident Preferences',
      weight: 0.6,
      evaluate: (assignments, context) => {
        let preferenceScore = 0;
        let maxPossibleScore = assignments.length * 3; // Max 3 points per assignment

        for (const assignment of assignments) {
          const resident = context.residents.find(r => r.id === assignment.residentId);
          if (!resident) continue;

          // Preferred attending: 2 points
          if (resident.preferences.preferredAttendings?.includes(assignment.attendingId)) {
            preferenceScore += 2;
          }

          // Preferred site: 1 point
          if (resident.preferences.preferredSites?.includes(assignment.siteId)) {
            preferenceScore += 1;
          }
        }

        return maxPossibleScore > 0 ? preferenceScore / maxPossibleScore : 0;
      }
    });

    // Balance workload
    this.goals.set('balanceWorkload', {
      name: 'Balance Resident Workload',
      weight: 0.7,
      evaluate: (assignments, context) => {
        const workloads = new Map<string, number>();

        for (const resident of context.residents) {
          const count = assignments.filter(a => a.residentId === resident.id).length;
          workloads.set(resident.id, count);
        }

        if (workloads.size === 0) return 0;

        const values = Array.from(workloads.values());
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // Return inverse of coefficient of variation (lower is better)
        return mean > 0 ? 1 - (stdDev / mean) : 0;
      }
    });
  }

  async optimizeSchedule(
    assignments: Assignment[],
    context: ScheduleContext,
    selectedGoals: string[]
  ): Promise<OptimizedSchedule> {
    const activeGoals = selectedGoals.map(name => this.goals.get(name)).filter(Boolean);

    // Calculate individual scores
    const scores = new Map<string, number>();
    for (const goal of activeGoals) {
      scores.set(goal.name, goal.evaluate(assignments, context));
    }

    // Calculate weighted total score
    let totalScore = 0;
    let totalWeight = 0;
    for (const goal of activeGoals) {
      const score = scores.get(goal.name) || 0;
      totalScore += score * goal.weight;
      totalWeight += goal.weight;
    }

    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      assignments,
      score: normalizedScore,
      scores: Object.fromEntries(scores),
      metrics: await this.calculateMetrics(assignments, context)
    };
  }

  private async calculateMetrics(
    assignments: Assignment[],
    context: ScheduleContext
  ): Promise<ScheduleMetrics> {
    return {
      totalAssignments: assignments.length,
      utilization: this.calculateUtilization(assignments, context),
      coverage: this.calculateCoverage(assignments, context),
      balance: this.calculateBalance(assignments, context),
      preferenceMatch: this.calculatePreferenceMatch(assignments, context),
      ruleCompliance: await this.calculateRuleCompliance(assignments, context)
    };
  }
}
```

#### 2.4 Frontend Schedule Generation Interface

```tsx
// components/scheduling/AutoScheduleWizard.tsx
import React, { useState } from 'react';
import { useAutoScheduler } from '@/hooks/useAutoScheduler';

export const AutoScheduleWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [params, setParams] = useState<ScheduleGenerationParams>({
    dateRange: { start: null, end: null },
    residents: [],
    sites: [],
    optimizationGoals: ['balanceWorkload', 'minimizeSiteTransitions'],
    constraints: [],
    preferences: {}
  });
  const { generateSchedule, isGenerating, progress } = useAutoScheduler();

  const steps = [
    { id: 1, name: 'Date Range', component: DateRangeSelector },
    { id: 2, name: 'Resources', component: ResourceSelector },
    { id: 3, name: 'Goals', component: GoalSelector },
    { id: 4, name: 'Constraints', component: ConstraintSelector },
    { id: 5, name: 'Review', component: ReviewStep }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <StepIndicator
          steps={steps}
          currentStep={step}
        />
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {step === 1 && (
          <DateRangeSelector
            value={params.dateRange}
            onChange={(dateRange) => setParams({...params, dateRange})}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <ResourceSelector
            residents={params.residents}
            sites={params.sites}
            onChange={(resources) => setParams({...params, ...resources})}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <GoalSelector
            selected={params.optimizationGoals}
            onChange={(goals) => setParams({...params, optimizationGoals: goals})}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <ConstraintSelector
            constraints={params.constraints}
            onChange={(constraints) => setParams({...params, constraints})}
            onNext={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}

        {step === 5 && (
          <ReviewStep
            params={params}
            onGenerate={async () => {
              const result = await generateSchedule(params);
              // Handle result
            }}
            onBack={() => setStep(4)}
            isGenerating={isGenerating}
            progress={progress}
          />
        )}
      </div>
    </div>
  );
};

// Component for selecting optimization goals
const GoalSelector: React.FC<{
  selected: string[];
  onChange: (goals: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ selected, onChange, onNext, onBack }) => {
  const availableGoals = [
    {
      id: 'balanceWorkload',
      name: 'Balance Workload',
      description: 'Distribute clinic assignments evenly among residents',
      icon: '⚖️'
    },
    {
      id: 'minimizeSiteTransitions',
      name: 'Minimize Travel',
      description: 'Reduce transitions between different clinic sites',
      icon: '🚗'
    },
    {
      id: 'maximizeUtilization',
      name: 'Maximize Utilization',
      description: 'Optimize attending capacity usage',
      icon: '📊'
    },
    {
      id: 'respectPreferences',
      name: 'Respect Preferences',
      description: 'Honor resident and attending preferences',
      icon: '⭐'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Optimization Goals</h3>
        <p className="text-gray-600">Choose what to prioritize when generating the schedule</p>
      </div>

      <div className="space-y-3">
        {availableGoals.map(goal => (
          <div
            key={goal.id}
            className={`
              border rounded-lg p-4 cursor-pointer transition
              ${selected.includes(goal.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            `}
            onClick={() => {
              if (selected.includes(goal.id)) {
                onChange(selected.filter(g => g !== goal.id));
              } else {
                onChange([...selected, goal.id]);
              }
            }}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{goal.icon}</span>
              <div className="flex-1">
                <h4 className="font-medium">{goal.name}</h4>
                <p className="text-sm text-gray-600">{goal.description}</p>
              </div>
              <input
                type="checkbox"
                checked={selected.includes(goal.id)}
                className="mt-1"
                readOnly
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="px-4 py-2 border rounded-lg">
          Back
        </button>
        <button
          onClick={onNext}
          disabled={selected.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Next
        </button>
      </div>
    </div>
  );
};
```

## Feature 3: Enhanced Personalization System

### Detailed Implementation Plan

#### 3.1 Institution Configuration Management

```typescript
// services/configuration/InstitutionConfigManager.ts
interface InstitutionConfig {
  id: string;
  name: string;
  code: string;
  settings: {
    general: GeneralSettings;
    sites: SiteConfig[];
    rotations: RotationConfig[];
    protectedTimes: ProtectedTimeConfig[];
    rules: RuleConfig[];
    display: DisplaySettings;
    notifications: NotificationSettings;
  };
  templates: ConfigTemplate[];
  createdAt: Date;
  updatedAt: Date;
}

class InstitutionConfigManager {
  private configs: Map<string, InstitutionConfig> = new Map();
  private templateLibrary: TemplateLibrary;

  async createInstitution(params: CreateInstitutionParams): Promise<InstitutionConfig> {
    // Generate unique institution code
    const code = this.generateInstitutionCode(params.name);

    // Load template if specified
    const template = params.templateId
      ? await this.templateLibrary.getTemplate(params.templateId)
      : null;

    const config: InstitutionConfig = {
      id: generateId(),
      name: params.name,
      code,
      settings: template ? this.applyTemplate(template) : this.getDefaultSettings(),
      templates: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    await this.saveConfig(config);

    // Initialize related services
    await this.initializeInstitutionServices(config);

    return config;
  }

  async updateSettings(
    institutionId: string,
    updates: Partial<InstitutionSettings>
  ): Promise<InstitutionConfig> {
    const config = await this.getConfig(institutionId);

    // Merge updates with existing settings
    config.settings = deepMerge(config.settings, updates);
    config.updatedAt = new Date();

    // Validate updated configuration
    const validation = await this.validateConfig(config);
    if (!validation.isValid) {
      throw new ValidationError('Invalid configuration', validation.errors);
    }

    // Apply migrations if needed
    await this.applyMigrations(config);

    // Save and propagate changes
    await this.saveConfig(config);
    await this.propagateConfigChanges(config);

    return config;
  }

  async importConfiguration(file: File): Promise<InstitutionConfig> {
    const content = await file.text();
    const imported = JSON.parse(content) as ExportedConfig;

    // Validate imported configuration
    const validation = await this.validateImportedConfig(imported);
    if (!validation.isValid) {
      throw new ValidationError('Invalid import', validation.errors);
    }

    // Transform to internal format
    const config = this.transformImportedConfig(imported);

    // Check for conflicts with existing configuration
    const conflicts = await this.checkConfigConflicts(config);
    if (conflicts.length > 0) {
      // Return conflicts for user resolution
      throw new ConflictError('Configuration conflicts detected', conflicts);
    }

    // Save and activate
    await this.saveConfig(config);
    return config;
  }

  async exportConfiguration(institutionId: string): Promise<Blob> {
    const config = await this.getConfig(institutionId);

    // Remove sensitive information
    const sanitized = this.sanitizeForExport(config);

    // Convert to export format
    const exported: ExportedConfig = {
      version: '2.0',
      type: 'institution_config',
      exported: new Date().toISOString(),
      config: sanitized
    };

    const json = JSON.stringify(exported, null, 2);
    return new Blob([json], { type: 'application/json' });
  }
}
```

#### 3.2 Template Library System

```typescript
// services/configuration/TemplateLibrary.ts
interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'community' | 'va' | 'custom';
  version: string;
  author: string;
  tags: string[];
  config: {
    sites: SiteTemplate[];
    rotations: RotationTemplate[];
    protectedTimes: ProtectedTimeTemplate[];
    rules: RuleTemplate[];
    defaults: DefaultSettings;
  };
  metadata: {
    programSize: 'small' | 'medium' | 'large';
    clinicsPerWeek: number;
    hasInpatient: boolean;
    hasResearch: boolean;
  };
}

class TemplateLibrary {
  private templates: Map<string, ConfigTemplate> = new Map();
  private communityTemplates: CommunityTemplateService;

  async loadBuiltInTemplates() {
    // Academic Medical Center Template
    this.templates.set('academic-large', {
      id: 'academic-large',
      name: 'Large Academic Medical Center',
      description: 'Template for large academic programs with multiple sites and subspecialties',
      category: 'academic',
      version: '1.0',
      author: 'System',
      tags: ['academic', 'multi-site', 'research', 'fellowship'],
      config: {
        sites: [
          { name: 'Main Hospital', code: 'MAIN', type: 'hospital' },
          { name: 'Outpatient Center', code: 'OPC', type: 'clinic' },
          { name: 'VA Medical Center', code: 'VAMC', type: 'va' },
          { name: 'Children\'s Hospital', code: 'PEDS', type: 'pediatric' }
        ],
        rotations: [
          { name: 'General Dermatology', code: 'GEN', minSessions: 4 },
          { name: 'Pediatric Dermatology', code: 'PEDS', minSessions: 2 },
          { name: 'Mohs Surgery', code: 'MOHS', minSessions: 2 },
          { name: 'Dermatopathology', code: 'PATH', minSessions: 2 },
          { name: 'Inpatient Consults', code: 'CONSULT', minSessions: 1 },
          { name: 'Research', code: 'RESEARCH', minSessions: 1 }
        ],
        protectedTimes: [
          {
            name: 'Grand Rounds',
            recurrence: 'WEEKLY',
            dayOfWeek: 3, // Wednesday
            timeSlot: 'AM',
            duration: 2,
            mandatory: true
          },
          {
            name: 'Didactics',
            recurrence: 'WEEKLY',
            dayOfWeek: 3, // Wednesday
            timeSlot: 'PM',
            duration: 3,
            mandatory: true
          },
          {
            name: 'Journal Club',
            recurrence: 'MONTHLY',
            dayOfWeek: 4, // Thursday
            weekOfMonth: 1,
            timeSlot: 'PM',
            duration: 1,
            mandatory: false
          }
        ],
        rules: [
          {
            name: 'Minimum continuity separation',
            natural: 'Residents must have at least 2 days between continuity clinics',
            priority: 10
          },
          {
            name: 'Post-call protection',
            natural: 'Residents on call cannot have clinic the following morning',
            priority: 10
          },
          {
            name: 'PGY2 supervision',
            natural: 'PGY2 residents must be scheduled with teaching attendings only',
            priority: 8
          }
        ],
        defaults: {
          continuityPercentage: 0.2,
          maxConsecutiveClinics: 3,
          minTimeBetweenClinics: 2,
          defaultCapacity: { am: 1, pm: 1 }
        }
      },
      metadata: {
        programSize: 'large',
        clinicsPerWeek: 20,
        hasInpatient: true,
        hasResearch: true
      }
    });

    // Community Program Template
    this.templates.set('community-medium', {
      id: 'community-medium',
      name: 'Community Hospital Program',
      description: 'Template for medium-sized community-based programs',
      category: 'community',
      version: '1.0',
      author: 'System',
      tags: ['community', 'single-site', 'clinical-focus'],
      config: {
        sites: [
          { name: 'Main Clinic', code: 'MAIN', type: 'clinic' },
          { name: 'Satellite Clinic', code: 'SAT', type: 'clinic' }
        ],
        rotations: [
          { name: 'General Dermatology', code: 'GEN', minSessions: 6 },
          { name: 'Procedures', code: 'PROC', minSessions: 2 },
          { name: 'Pediatrics', code: 'PEDS', minSessions: 1 },
          { name: 'Path Review', code: 'PATH', minSessions: 1 }
        ],
        protectedTimes: [
          {
            name: 'Didactics',
            recurrence: 'WEEKLY',
            dayOfWeek: 4, // Thursday
            timeSlot: 'AM',
            duration: 3,
            mandatory: true
          }
        ],
        rules: [
          {
            name: 'Continuity concentration',
            natural: 'Continuity clinics should be at the same site for each resident',
            priority: 7
          }
        ],
        defaults: {
          continuityPercentage: 0.25,
          maxConsecutiveClinics: 4,
          minTimeBetweenClinics: 1,
          defaultCapacity: { am: 2, pm: 2 }
        }
      },
      metadata: {
        programSize: 'medium',
        clinicsPerWeek: 12,
        hasInpatient: false,
        hasResearch: false
      }
    });
  }

  async createCustomTemplate(
    baseTemplateId: string,
    customizations: TemplateCustomizations
  ): Promise<ConfigTemplate> {
    const baseTemplate = await this.getTemplate(baseTemplateId);

    const customTemplate: ConfigTemplate = {
      ...baseTemplate,
      id: generateId(),
      name: customizations.name || `${baseTemplate.name} (Custom)`,
      category: 'custom',
      author: customizations.author,
      config: this.mergeTemplateConfig(baseTemplate.config, customizations.config)
    };

    // Validate custom template
    const validation = await this.validateTemplate(customTemplate);
    if (!validation.isValid) {
      throw new ValidationError('Invalid template configuration', validation.errors);
    }

    // Save to library
    this.templates.set(customTemplate.id, customTemplate);

    // Optionally share with community
    if (customizations.shareWithCommunity) {
      await this.communityTemplates.submitTemplate(customTemplate);
    }

    return customTemplate;
  }

  async searchCommunityTemplates(
    criteria: TemplateSearchCriteria
  ): Promise<ConfigTemplate[]> {
    const results = await this.communityTemplates.search(criteria);

    // Filter by relevance
    return results.filter(template => {
      if (criteria.programSize && template.metadata.programSize !== criteria.programSize) {
        return false;
      }
      if (criteria.hasInpatient !== undefined && template.metadata.hasInpatient !== criteria.hasInpatient) {
        return false;
      }
      if (criteria.tags && !criteria.tags.some(tag => template.tags.includes(tag))) {
        return false;
      }
      return true;
    });
  }
}
```

#### 3.3 Role-Based Access Control

```typescript
// services/auth/RoleManager.ts
interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inherits?: string[]; // Inherit permissions from other roles
}

class RoleManager {
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles() {
    // Super Admin
    this.roles.set('super_admin', {
      id: 'super_admin',
      name: 'Super Administrator',
      description: 'Full system access',
      permissions: [
        { resource: '*', action: '*' }
      ]
    });

    // Program Administrator
    this.roles.set('program_admin', {
      id: 'program_admin',
      name: 'Program Administrator',
      description: 'Manage all program settings and schedules',
      permissions: [
        { resource: 'institution', action: 'update' },
        { resource: 'users', action: '*' },
        { resource: 'schedules', action: '*' },
        { resource: 'rules', action: '*' },
        { resource: 'reports', action: '*' }
      ]
    });

    // Chief Resident / Scheduler
    this.roles.set('chief_resident', {
      id: 'chief_resident',
      name: 'Chief Resident',
      description: 'Create and manage schedules',
      permissions: [
        { resource: 'schedules', action: '*' },
        { resource: 'assignments', action: '*' },
        { resource: 'rules', action: 'read' },
        { resource: 'rules', action: 'create', conditions: { type: 'soft' } },
        { resource: 'reports', action: 'read' },
        { resource: 'requests', action: '*' }
      ]
    });

    // Attending Scheduler
    this.roles.set('attending_scheduler', {
      id: 'attending_scheduler',
      name: 'Attending Scheduler',
      description: 'Manage attending schedules only',
      permissions: [
        { resource: 'attendings', action: '*' },
        { resource: 'attending_availability', action: '*' },
        { resource: 'schedules', action: 'read' },
        { resource: 'reports', action: 'read', conditions: { type: 'attending' } }
      ]
    });

    // Attending
    this.roles.set('attending', {
      id: 'attending',
      name: 'Attending',
      description: 'View schedules and request changes',
      permissions: [
        { resource: 'schedules', action: 'read', conditions: { scope: 'own' } },
        { resource: 'availability', action: 'update', conditions: { scope: 'own' } },
        { resource: 'requests', action: 'create', conditions: { type: 'availability' } },
        { resource: 'preferences', action: '*', conditions: { scope: 'own' } }
      ]
    });

    // Resident
    this.roles.set('resident', {
      id: 'resident',
      name: 'Resident',
      description: 'View schedules and request swaps',
      permissions: [
        { resource: 'schedules', action: 'read', conditions: { scope: 'own' } },
        { resource: 'schedules', action: 'read', conditions: { scope: 'published' } },
        { resource: 'requests', action: 'create', conditions: { type: 'swap' } },
        { resource: 'requests', action: 'create', conditions: { type: 'absence' } },
        { resource: 'preferences', action: '*', conditions: { scope: 'own' } }
      ]
    });
  }

  async checkPermission(
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const userRoleIds = this.userRoles.get(userId) || new Set();

    for (const roleId of userRoleIds) {
      const role = this.roles.get(roleId);
      if (!role) continue;

      // Check direct permissions
      if (this.hasPermission(role, resource, action, context)) {
        return true;
      }

      // Check inherited permissions
      if (role.inherits) {
        for (const inheritedRoleId of role.inherits) {
          const inheritedRole = this.roles.get(inheritedRoleId);
          if (inheritedRole && this.hasPermission(inheritedRole, resource, action, context)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private hasPermission(
    role: Role,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): boolean {
    for (const permission of role.permissions) {
      // Check resource match (with wildcard support)
      if (permission.resource !== '*' && permission.resource !== resource) {
        continue;
      }

      // Check action match (with wildcard support)
      if (permission.action !== '*' && permission.action !== action) {
        continue;
      }

      // Check conditions
      if (permission.conditions) {
        if (!context || !this.evaluateConditions(permission.conditions, context)) {
          continue;
        }
      }

      return true;
    }

    return false;
  }

  private evaluateConditions(
    conditions: Record<string, any>,
    context: Record<string, any>
  ): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }
    return true;
  }
}
```

#### 3.4 User Interface Components

```tsx
// components/settings/InstitutionSettings.tsx
import React, { useState } from 'react';
import { useInstitutionConfig } from '@/hooks/useInstitutionConfig';

export const InstitutionSettings: React.FC = () => {
  const { config, updateConfig, isLoading } = useInstitutionConfig();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'sites', label: 'Sites & Locations', icon: '🏥' },
    { id: 'rotations', label: 'Rotations', icon: '🔄' },
    { id: 'protected', label: 'Protected Time', icon: '🛡️' },
    { id: 'rules', label: 'Scheduling Rules', icon: '📋' },
    { id: 'display', label: 'Display & Theme', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-gray-50 border-r">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Institution Settings</h2>
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg flex items-center space-x-3
                  ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'}
                `}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6">
        {activeTab === 'general' && (
          <GeneralSettings
            config={config?.settings.general}
            onChange={(general) => updateConfig({ general })}
          />
        )}

        {activeTab === 'sites' && (
          <SitesManager
            sites={config?.settings.sites || []}
            onChange={(sites) => updateConfig({ sites })}
          />
        )}

        {activeTab === 'rotations' && (
          <RotationsManager
            rotations={config?.settings.rotations || []}
            onChange={(rotations) => updateConfig({ rotations })}
          />
        )}

        {activeTab === 'protected' && (
          <ProtectedTimeManager
            protectedTimes={config?.settings.protectedTimes || []}
            onChange={(protectedTimes) => updateConfig({ protectedTimes })}
          />
        )}

        {activeTab === 'rules' && (
          <RulesManager
            rules={config?.settings.rules || []}
            onChange={(rules) => updateConfig({ rules })}
          />
        )}
      </div>
    </div>
  );
};

// Sub-component for managing sites
const SitesManager: React.FC<{
  sites: SiteConfig[];
  onChange: (sites: SiteConfig[]) => void;
}> = ({ sites, onChange }) => {
  const [editingSite, setEditingSite] = useState<SiteConfig | null>(null);

  const handleAddSite = () => {
    const newSite: SiteConfig = {
      id: generateId(),
      name: '',
      code: '',
      address: {},
      type: 'clinic',
      isActive: true
    };
    setEditingSite(newSite);
  };

  const handleSaveSite = (site: SiteConfig) => {
    if (sites.find(s => s.id === site.id)) {
      onChange(sites.map(s => s.id === site.id ? site : s));
    } else {
      onChange([...sites, site]);
    }
    setEditingSite(null);
  };

  const handleDeleteSite = (siteId: string) => {
    if (confirm('Are you sure you want to delete this site?')) {
      onChange(sites.filter(s => s.id !== siteId));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Sites & Locations</h3>
        <button
          onClick={handleAddSite}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Add Site
        </button>
      </div>

      {/* Sites List */}
      <div className="grid gap-4">
        {sites.map(site => (
          <div
            key={site.id}
            className="bg-white border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <h4 className="font-medium">{site.name}</h4>
              <p className="text-sm text-gray-600">
                Code: {site.code} | Type: {site.type}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingSite(site)}
                className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteSite(site.id)}
                className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingSite && (
        <SiteEditDialog
          site={editingSite}
          onSave={handleSaveSite}
          onCancel={() => setEditingSite(null)}
        />
      )}
    </div>
  );
};
```

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)
1. **Database Setup**
   - Implement PostgreSQL schema
   - Set up Prisma ORM
   - Create migration scripts
   - Seed initial data

2. **Authentication & Authorization**
   - Implement user authentication
   - Set up role-based access control
   - Create permission middleware
   - Build login/registration UI

3. **Base API Structure**
   - Set up Express server
   - Implement RESTful endpoints
   - Add validation middleware
   - Create error handling

### Phase 2: Rule Engine (Weeks 5-8)
1. **Natural Language Processing**
   - Integrate Gemini API
   - Build rule interpreter
   - Create validation logic
   - Implement conflict detection

2. **Rule Management UI**
   - Build rule builder interface
   - Create template selector
   - Implement rule testing
   - Add conflict resolution UI

3. **Rule Execution Engine**
   - Implement rule compiler
   - Build execution pipeline
   - Add caching layer
   - Create audit logging

### Phase 3: Auto-Scheduler (Weeks 9-12)
1. **Constraint Solver**
   - Implement CSP algorithm
   - Build optimization engine
   - Add heuristics
   - Create solution ranking

2. **Scheduling Interface**
   - Build wizard UI
   - Create progress indicators
   - Implement result visualization
   - Add manual adjustments

3. **Performance Optimization**
   - Implement parallel processing
   - Add result caching
   - Optimize database queries
   - Create background jobs

### Phase 4: Personalization (Weeks 13-16)
1. **Configuration Management**
   - Build settings UI
   - Implement template system
   - Create import/export
   - Add validation

2. **Template Library**
   - Create built-in templates
   - Build template editor
   - Implement sharing mechanism
   - Add search functionality

3. **Multi-tenancy Support**
   - Implement institution isolation
   - Add data partitioning
   - Create admin tools
   - Build onboarding flow

### Phase 5: Integration & Testing (Weeks 17-18)
1. **Integration Testing**
   - End-to-end testing
   - Performance testing
   - Security testing
   - User acceptance testing

2. **Documentation**
   - API documentation
   - User guides
   - Admin documentation
   - Developer documentation

### Phase 6: Deployment (Weeks 19-20)
1. **Production Setup**
   - Configure hosting
   - Set up monitoring
   - Implement backup strategy
   - Create deployment pipeline

2. **Launch Preparation**
   - Beta testing
   - Performance tuning
   - Security audit
   - Training materials

## Testing Strategy

### Unit Testing
```typescript
// Example test for Rule Interpreter
describe('RuleInterpreter', () => {
  let interpreter: RuleInterpreter;

  beforeEach(() => {
    interpreter = new RuleInterpreter();
  });

  test('should interpret continuity separation rule', async () => {
    const input = 'Residents must have at least 2 days between continuity clinics';
    const result = await interpreter.interpretRule(input);

    expect(result.structured.constraints[0]).toMatchObject({
      type: 'hard',
      description: expect.stringContaining('continuity')
    });
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  test('should detect rule conflicts', async () => {
    const rule1 = 'All residents must attend Wednesday morning didactics';
    const rule2 = 'PGY2 residents must have continuity clinic every Wednesday morning';

    const result1 = await interpreter.interpretRule(rule1);
    const result2 = await interpreter.interpretRule(rule2);

    const conflicts = await interpreter.checkConflicts(result1, result2);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('time_conflict');
  });
});
```

### Integration Testing
```typescript
// Example integration test for Auto-Scheduler
describe('AutoScheduler Integration', () => {
  test('should generate valid schedule respecting all constraints', async () => {
    const params = {
      dateRange: {
        start: new Date('2024-04-01'),
        end: new Date('2024-04-30')
      },
      residents: await getTestResidents(),
      attendings: await getTestAttendings(),
      rules: await getTestRules(),
      optimizationGoals: ['balanceWorkload', 'minimizeTravel']
    };

    const result = await autoScheduler.generateSchedule(params);

    expect(result.validation.isValid).toBe(true);
    expect(result.assignments).toHaveLength(expect.any(Number));
    expect(result.metrics.ruleCompliance).toBeGreaterThan(0.95);
  });
});
```

## Conclusion

This implementation plan provides a comprehensive, detailed roadmap for enhancing the Clinic Scheduler with:

1. **AI-Powered Natural Language Rule Engine**: Enabling intuitive rule creation and management
2. **Intelligent Auto-Scheduling Engine**: Automating schedule generation with optimization
3. **Enhanced Personalization System**: Supporting multiple institutions with customizable configurations

The architecture is designed to be:
- **Scalable**: Supporting multiple institutions and thousands of users
- **Extensible**: Easy to add new features like the planned enhancements
- **Maintainable**: Clear separation of concerns and modular design
- **User-friendly**: Intuitive interfaces for all user types

The implementation follows modern best practices and prepares the foundation for future enhancements including cloud sync, advanced visualizations, and communication features.