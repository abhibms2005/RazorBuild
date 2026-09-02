/**
 * Deterministic Policy Engine (Track 03 - AI Revenue Recovery)
 * 
 * Safety rails and stopping rules that govern all recovery decisions.
 * Hardcoded constraints that CANNOT be overridden by the LLM or external inputs.
 * 
 * Core Invariants:
 * - MAX_ATTEMPTS = 3
 * - MIN_CONFIDENCE_TO_ACT = 0.80
 * - Strict halt on fraudulent or blocked card retries
 * - Every decision evaluates to ALLOWED or BLOCKED with auditable reason
 */

const MAX_ATTEMPTS = 3;
const MIN_CONFIDENCE_TO_ACT = 0.80;

const PLAYBOOK = {
  schedule_smart_retry: 'schedule_smart_retry',
  send_update_payment_link: 'send_update_payment_link',
  single_retry_then_escalate: 'single_retry_then_escalate',
  immediate_retry: 'immediate_retry',
  escalate_alternate_method: 'escalate_alternate_method',
  manual_review: 'manual_review'
};

/**
 * Evaluate proposed recovery action against deterministic safety rules.
 * 
 * @param {Object} payment - Payment record
 * @param {string} proposedAction - Action proposed by rule engine or AI advisor
 * @param {number} confidence - Confidence score associated with diagnosis/recommendation
 * @param {string} cause - Diagnostic cause
 * @returns {Object} Policy evaluation outcome
 */
function evaluatePolicy(payment, proposedAction, confidence, cause) {
  const currentAttempts = Number(payment?.attempt_number || 1);
  const flags = [];

  // Policy Rule 1: Confidence Threshold Stopping Rule
  if (confidence < MIN_CONFIDENCE_TO_ACT) {
    flags.push(`LOW_CONFIDENCE_${confidence.toFixed(2)}`);
    return {
      allowed: false,
      decision: 'BLOCKED',
      action: PLAYBOOK.manual_review,
      reason: `Confidence (${confidence.toFixed(2)}) below minimum safety threshold (${MIN_CONFIDENCE_TO_ACT}). Automated execution halted; routed to manual review queue.`,
      policy_flags: flags
    };
  }

  // Policy Rule 2: Max Attempts Exhaustion Rule
  if (currentAttempts >= MAX_ATTEMPTS && (proposedAction === PLAYBOOK.immediate_retry || proposedAction === PLAYBOOK.schedule_smart_retry)) {
    flags.push(`MAX_ATTEMPTS_REACHED_${currentAttempts}/${MAX_ATTEMPTS}`);
    
    // For insufficient funds after 3 attempts, fallback to customer payment link rather than endless retries
    if (cause === 'insufficient_funds') {
      return {
        allowed: false,
        decision: 'BLOCKED',
        action: PLAYBOOK.send_update_payment_link,
        reason: `Maximum retry attempts (${MAX_ATTEMPTS}) reached for insufficient funds. Blocked further retries; transitioning to self-serve payment link.`,
        policy_flags: flags
      };
    }

    return {
      allowed: false,
      decision: 'BLOCKED',
      action: PLAYBOOK.manual_review,
      reason: `Maximum retry attempts (${MAX_ATTEMPTS}) reached. Blocked automated retries to prevent issuer fatigue; escalated to ops review.`,
      policy_flags: flags
    };
  }

  // Policy Rule 3: Card Blocked / Stolen Hard Halt Rule
  if (cause === 'card_blocked' && (proposedAction === PLAYBOOK.immediate_retry || proposedAction === PLAYBOOK.schedule_smart_retry)) {
    flags.push('BLOCKED_INSTRUMENT_HALT');
    return {
      allowed: false,
      decision: 'BLOCKED',
      action: PLAYBOOK.escalate_alternate_method,
      reason: 'Card reported frozen or blocked by issuing bank. Blocked all gateway retries; requesting alternate payment method.',
      policy_flags: flags
    };
  }

  // Policy Rule 4: Risk / Fraud Decline Hard Halt Rule
  if (cause === 'risk_decline' && proposedAction !== PLAYBOOK.manual_review) {
    flags.push('RISK_DECLINE_HALT');
    return {
      allowed: false,
      decision: 'BLOCKED',
      action: PLAYBOOK.manual_review,
      reason: 'Issuer risk scoring flagged transaction. Automated retry strictly prohibited; routed to fraud & risk review.',
      policy_flags: flags
    };
  }

  // Action is permitted by policy rails
  flags.push('POLICY_COMPLIANT');
  return {
    allowed: true,
    decision: 'ALLOWED',
    action: proposedAction,
    reason: `Proposed action [${proposedAction}] validated against all safety constraints (attempts: ${currentAttempts}/${MAX_ATTEMPTS}, confidence: ${confidence.toFixed(2)}).`,
    policy_flags: flags
  };
}

module.exports = {
  MAX_ATTEMPTS,
  MIN_CONFIDENCE_TO_ACT,
  PLAYBOOK,
  evaluatePolicy
};
