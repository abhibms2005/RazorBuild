/**
 * Recovery Engine - Deterministic Decision & Action Layer
 * Coordinates diagnosis, policy playbook mapping, and audit stream emission.
 */

const { diagnose, CAUSE_MAP } = require('./diagnosis.js');

const PLAYBOOK = {
  schedule_smart_retry: 'schedule_smart_retry',
  send_update_payment_link: 'send_update_payment_link',
  single_retry_then_escalate: 'single_retry_then_escalate',
  immediate_retry: 'immediate_retry',
  escalate_alternate_method: 'escalate_alternate_method',
  manual_review: 'manual_review'
};

const MAX_ATTEMPTS = 3;
const MIN_CONFIDENCE_TO_ACT = 0.80;

/**
 * Process a single payment record through detection, diagnosis, decision, and execution stages.
 * @param {Object} payment - Payment record to process
 * @param {Object} options - Execution context
 * @param {Function} options.appendAudit - Function to write to audit_log
 * @param {Array} [options.auditBuffer] - Optional array to accumulate audit entries for batch write
 * @returns {Promise<Object>} Processed payment record and execution decision
 */
async function processRecord(payment, { appendAudit = async () => {}, auditBuffer = null } = {}) {
  const ts = new Date().toISOString();

  const logAudit = async (entry) => {
    if (auditBuffer && Array.isArray(auditBuffer)) {
      auditBuffer.push(entry);
    } else {
      await appendAudit(entry).catch(err => console.error('Audit logging failed:', err.message));
    }
  };

  // Stage 1: Detect / Validate
  if (!payment || payment.amount === undefined || payment.amount === null) {
    await logAudit({
      ts,
      payment_id: payment ? payment.id : null,
      stage: 'detect',
      cause: 'malformed_data',
      confidence: 1.0,
      action: 'malformed_record_detected',
      explanation: 'Record rejected: missing required payment amount field',
      reason: 'validation_error',
      amount: null
    });

    return {
      success: false,
      malformed: true,
      payment,
      action: PLAYBOOK.manual_review
    };
  }

  // Skip already recovered payments
  if (payment.status === 'recovered') {
    return {
      success: true,
      recovered: true,
      payment,
      action: null
    };
  }

  // Stage 2: Diagnose
  const diagnosis = diagnose(payment);

  await logAudit({
    ts,
    payment_id: payment.id,
    stage: 'diagnose',
    cause: diagnosis.cause,
    confidence: diagnosis.confidence,
    action: 'diagnose_completed',
    explanation: diagnosis.explanation,
    reason: diagnosis.reason,
    amount: payment.amount
  });

  // Stage 3: Decide (Playbook Policy Mapping)
  let action = PLAYBOOK.manual_review;
  let status = 'pending';
  let explanation = '';
  const currentAttempts = Number(payment.attempt_number || 1);

  if (diagnosis.confidence < MIN_CONFIDENCE_TO_ACT) {
    // Low confidence safeguard -> escalate to human review
    action = PLAYBOOK.manual_review;
    status = 'partial';
    explanation = `Confidence (${diagnosis.confidence}) < ${MIN_CONFIDENCE_TO_ACT} threshold: routed to finance reviewer`;
  } else if (diagnosis.cause === 'insufficient_funds') {
    if (currentAttempts < MAX_ATTEMPTS) {
      action = PLAYBOOK.schedule_smart_retry;
      status = 'pending';
      const cooldownHours = currentAttempts === 1 ? 4 : 8;
      explanation = `Queued smart retry (${currentAttempts}/${MAX_ATTEMPTS}) with ${cooldownHours}h cooldown window`;
    } else {
      action = PLAYBOOK.send_update_payment_link;
      status = 'partial';
      explanation = `Max retries (${MAX_ATTEMPTS}) reached for insufficient funds; dispatched direct payment link`;
    }
  } else if (diagnosis.cause === 'bank_technical_error') {
    if (currentAttempts < MAX_ATTEMPTS) {
      action = currentAttempts === 1 ? PLAYBOOK.immediate_retry : PLAYBOOK.schedule_smart_retry;
      if (currentAttempts === 1) {
        status = 'recovered';
        explanation = `Transient gateway error cleared on immediate retry — ₹${payment.amount} settled`;
      } else {
        status = 'pending';
        explanation = `Transient error persisted; queued smart retry (${currentAttempts}/${MAX_ATTEMPTS})`;
      }
    } else {
      action = PLAYBOOK.manual_review;
      status = 'partial';
      explanation = `Bank gateway technical error persisted after ${MAX_ATTEMPTS} attempts; routed to ops`;
    }
  } else if (diagnosis.cause === 'card_expired' || diagnosis.cause === 'authentication_failed') {
    action = PLAYBOOK.send_update_payment_link;
    status = 'partial';
    explanation = `Dispatched localized payment link (SMS + email, 48h expiry) for ${diagnosis.cause.replace('_', ' ')}`;
  } else if (diagnosis.cause === 'card_blocked') {
    action = PLAYBOOK.escalate_alternate_method;
    status = 'partial';
    explanation = 'Card frozen/blocked by issuer; initiated automated alternate method request (UPI/NetBanking)';
  } else if (diagnosis.cause === 'risk_decline') {
    action = PLAYBOOK.manual_review;
    status = 'partial';
    explanation = 'Bank risk decline flag; halted automated retries and opened ops audit ticket';
  } else {
    action = PLAYBOOK.manual_review;
    status = 'partial';
    explanation = `Unclassified failure (${diagnosis.cause}); dispatched to manual review queue`;
  }

  // Audit decision
  await logAudit({
    ts,
    payment_id: payment.id,
    stage: 'decide',
    cause: diagnosis.cause,
    confidence: diagnosis.confidence,
    action,
    explanation,
    reason: diagnosis.reason,
    amount: payment.amount
  });

  // Stage 4: Execute & Update payment record
  payment.diagnosis = diagnosis.cause;
  payment.diagnosis_confidence = diagnosis.confidence;
  payment.recovery_action = action;
  payment.status = status;
  payment.attempt_number = currentAttempts + 1;
  payment.updated_at = new Date().toISOString();

  if (!payment.recovery_history || !Array.isArray(payment.recovery_history)) {
    payment.recovery_history = [];
  }

  payment.recovery_history.push({
    payment_id: payment.id,
    action,
    outcome: explanation,
    ts: new Date().toISOString()
  });

  // Audit execution
  await logAudit({
    ts: new Date().toISOString(),
    payment_id: payment.id,
    stage: 'execute',
    cause: diagnosis.cause,
    confidence: diagnosis.confidence,
    action,
    result: 'action_dispatched',
    explanation: `Successfully executed policy action: [${action}]`,
    reason: diagnosis.reason,
    amount: payment.amount
  });

  return {
    success: true,
    malformed: false,
    payment,
    action,
    diagnosis
  };
}

/**
 * Process a batch of payments and generate recovery actions
 * @param {Array} payments - Array of payment records
 * @param {Object} callbacks - Callback functions
 * @param {Function} [callbacks.appendAudit] - Function to append a single audit entry
 * @param {Function} [callbacks.appendAudits] - Function to batch append audit entries
 * @returns {Promise<Object>} Summary of batch processing results
 */
async function processBatch(payments, { appendAudit = async () => {}, appendAudits = null } = {}) {
  const summary = {
    total: payments.length,
    successful: 0,
    failed: 0,
    malformed: 0,
    recovered: 0,
    actions: {},
    errors: []
  };

  const auditBuffer = [];

  if (!payments || payments.length === 0) {
    const emptyLog = {
      ts: new Date().toISOString(),
      stage: 'execute',
      action: 'batch_process_completed',
      explanation: 'Batch process completed: 0 payments to evaluate',
      amount: 0
    };
    if (appendAudits) {
      await appendAudits([emptyLog]);
    } else {
      await appendAudit(emptyLog).catch(err => console.error('Audit logging failed:', err.message));
    }
    return summary;
  }

  for (const payment of payments) {
    try {
      const result = await processRecord(payment, {
        appendAudit,
        auditBuffer: appendAudits ? auditBuffer : null
      });

      if (result.malformed) {
        summary.malformed++;
      } else if (result.success) {
        summary.successful++;
        if (result.payment && result.payment.status === 'recovered') {
          summary.recovered++;
        }
        if (result.action) {
          summary.actions[result.action] = (summary.actions[result.action] || 0) + 1;
        }
      }
    } catch (error) {
      summary.failed++;
      summary.errors.push({
        paymentId: payment ? payment.id : null,
        error: error.message
      });

      const errLog = {
        ts: new Date().toISOString(),
        payment_id: payment ? payment.id : null,
        stage: 'execute',
        action: 'payment_processing_error',
        error: error.message,
        explanation: `Unhandled exception during processing: ${error.message}`
      };

      if (appendAudits) {
        auditBuffer.push(errLog);
      } else {
        await appendAudit(errLog).catch(err => console.error('Audit logging failed:', err.message));
      }
    }
  }

  // Final batch audit log
  const completionLog = {
    ts: new Date().toISOString(),
    stage: 'execute',
    action: 'batch_process_completed',
    explanation: `Batch run completed: ${summary.successful} processed, ${summary.malformed} malformed, ${summary.failed} errors`,
    amount: null
  };

  if (appendAudits) {
    auditBuffer.push(completionLog);
    await appendAudits(auditBuffer);
  } else {
    await appendAudit(completionLog).catch(err => console.error('Audit logging failed:', err.message));
  }

  return summary;
}

module.exports = {
  PLAYBOOK,
  MAX_ATTEMPTS,
  MIN_CONFIDENCE_TO_ACT,
  processRecord,
  processBatch
};
