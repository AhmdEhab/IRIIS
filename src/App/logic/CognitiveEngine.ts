/**
 * ╔════════════════════════════════════════════════════════════════════════╗
 * ║  DEPRECATED — REPLACED BY THE SPECIFICATION ENGINES                    ║
 * ╚════════════════════════════════════════════════════════════════════════╝
 *
 * This file previously generated sessions by looking up the child's DIAGNOSIS
 * in SYNDROME_RULES to pick a module order and a session length, and "adapted"
 * by changing animation intensity.
 *
 * It has been replaced by the deterministic, diagnosis-blind engines:
 *   src/iris/engines/assessment.js  — doc 11
 *   src/iris/engines/profile.js     — doc 12
 *   src/iris/engines/goals.js       — doc 13
 *   src/iris/engines/pathway.js     — doc 14  (R-PATH-001 … R-PATH-011)
 *   src/iris/engines/progress.js    — doc 16
 *   src/iris/journey.js             — the orchestrator
 *
 * Import from `src/iris/journey.js` instead. This shim exists only so that any
 * remaining legacy import resolves during the migration.
 */
import type { CurriculumItem } from '../data/MasterCurriculum';

export interface LearningSession {
  id: string;
  items: CurriculumItem[];
  targetDuration: number;
}

export interface PerformanceSnapshot {
  itemId: string;
  repeated: boolean;
  completed: boolean;
  timestamp: number;
}

/** @deprecated Use the engines in src/iris/. This throws rather than silently guessing. */
export class CognitiveEngine {
  static generateSession(): never {
    throw new Error(
      'CognitiveEngine.generateSession is removed. Use planGoals() + nextActivity() from src/iris/journey.js — the pathway is decided from measured performance, not from a diagnosis.'
    );
  }

  static evaluateAndAdapt(): never {
    throw new Error(
      'CognitiveEngine.evaluateAndAdapt is removed. Use decideNext() from src/iris/engines/pathway.js — it implements R-PATH-001…R-PATH-011 and records an auditable PathwayDecision.'
    );
  }
}
