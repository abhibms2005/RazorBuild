/**
 * Recovery Engine - Deterministic Decision & Action Layer (Track 03 - AI Revenue Recovery)
 * 
 * 7-Stage Pipeline Architecture:
 * 1. Detect & Validate
 * 2. Deterministic Rule Diagnosis (CAUSE_MAP fast-path)
 * 3. AI Advisor Consultation (for low-confidence / unclassified cases)
 * 4. Recovery Strategy Recommendation (Proposes, never decides)
 * 5. Deterministic Policy Engine Check (Hard constraints & stopping rules)
 * 6. Execution (Real Ethereal email send / Gateway queue)
 * 7. Confirmation (Delegated strictly to verified webhook events)
 */

const { diagnoseAsync, CAUSE_MAP } = require('./diagnosis.js');
const { evaluatePolicy, PLAYBOOK, MAX_ATTEMPTS, MIN_CONFIDENCE_TO_ACT } = require('./policyEngine.js');
const { sendPaymentUpdateLink } = require('./notificationService.js');

/**
 * Process a single payment record through the governed 7-stage recovery pipeline.
 * 
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

  // -------------------------------------------------------------
  // Stage 1: Detect & Validate
  // -------------------------------------------------------------
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

  // If already verified recovered, keep durable state
  if (payment.status === 'recovered') {
    return {
      success: true,
      recovered: true,
      payment,
      action: null
    };
  }

  await logAudit({
    ts,
    payment_id: payment.id,
    stage: 'detect',
    cause: payment.failure_code || 'payment_failed',
    confidence: 1.0,
    action: 'event_detected',
    explanation: `Ingested payment failure event for ${payment.customer_name || 'customer'} (₹${payment.amount})`,
    reason: payment.failure_reason || 'failure_event',
    amount: payment.amount
  });

  // -------------------------------------------------------------
  // Stage 2 & 3: Diagnose & AI Advisor Consult
  // -------------------------------------------------------------
  const diagnosis = await diagnoseAsync(payment);

  await logAudit({
    ts,
    payment_id: payment.id,
    stage: 'diagnose',
    cause: diagnosis.cause,
    confidence: diagnosis.confidence,
    action: 'rule_diagnosis_completed',
    explanation: diagnosis.explanation,
    reason: diagnosis.reason,
    amount: payment.amount
  });

  // If AI Advisor was consulted (low confidence < 0.80 or unknown failure), log Stage 3
  if (diagnosis.isAiDiagnosed && diagnosis.aiRecommendation) {
    await logAudit({
      ts,
      payment_id: payment.id,
      stage: 'ai_consult',
      cause: diagnosis.cause,
      confidence: diagnosis.aiRecommendation.confidence || diagnosis.confidence,
      action: 'ai_advisor_consulted',
      explanation: `[AI Advisor (${diagnosis.aiRecommendation.model_used})]: ${diagnosis.aiRecommendation.business_explanation}`,
      reason: diagnosis.aiRecommendation.technical_rationale || 'low_rule_confidence',
      amount: payment.amount
    });
  }

  // -------------------------------------------------------------
  // Stage 4: Strategy Recommendation (AI / Rule proposes, never decides)
  // -------------------------------------------------------------
  const currentAttempts = Number(payment.attempt_number || 1);
  let proposedAction = PLAYBOOK.manual_review;
  let proposedExplanation = '';

  if (diagnosis.isAiDiagnosed && diagnosis.aiRecommendation?.recommended_action) {
    // Propose AI-suggested playbook action
    proposedAction = diagnosis.aiRecommendation.recommended_action;
    proposedExplanation = `AI proposed [${proposedAction}] based on failure context`;
  } else if (diagnosis.cause === 'insufficient_funds') {
    if (currentAttempts < MAX_ATTEMPTS) {
      proposedAction = PLAYBOOK.schedule_smart_retry;
      const cooldownHours = currentAttempts === 1 ? 4 : 8;
      proposedExplanation = `Queued smart retry (${currentAttempts}/${MAX_ATTEMPTS}) with ${cooldownHours}h cooldown window`;
    } else {
      proposedAction = PLAYBOOK.send_update_payment_link;
      proposedExplanation = `Max retries (${MAX_ATTEMPTS}) reached for insufficient funds; proposed direct payment link`;
    }
  } else if (diagnosis.cause === 'bank_technical_error') {
    if (currentAttempts < MAX_ATTEMPTS) {
      proposedAction = currentAttempts === 1 ? PLAYBOOK.immediate_retry : PLAYBOOK.schedule_smart_retry;
      proposedExplanation = `Transient gateway error; proposed ${proposedAction === PLAYBOOK.immediate_retry ? 'immediate secondary rail retry' : 'smart retry'}`;
    } else {
      proposedAction = PLAYBOOK.manual_review;
      proposedExplanation = `Bank gateway error persisted after ${MAX_ATTEMPTS} attempts; proposed ops review`;
    }
  } else if (diagnosis.cause === 'card_expired' || diagnosis.cause === 'authentication_failed') {
    proposedAction = PLAYBOOK.send_update_payment_link;
    proposedExplanation = `Dispatched payment link for ${diagnosis.cause.replace(/_/g, ' ')}`;
  } else if (diagnosis.cause === 'card_blocked') {
    proposedAction = PLAYBOOK.escalate_alternate_method;
    proposedExplanation = 'Card blocked by issuer; proposed alternate payment method request (UPI/NetBanking)';
  } else if (diagnosis.cause === 'risk_decline') {
    proposedAction = PLAYBOOK.manual_review;
    proposedExplanation = 'Bank risk decline flag; proposed human ops review';
  } else {
    proposedAction = PLAYBOOK.manual_review;
    proposedExplanation = `Unclassified failure (${diagnosis.cause}); proposed manual review`;
  }

  await logAudit({
    ts,
    payment_id: payment.id,
    stage: 'recommend',
    cause: diagnosis.cause,
    confidence: diagnosis.confidence,
    action: proposedAction,
    explanation: proposedExplanation,
    reason: diagnosis.reason,
    amount: payment.amount
  });

  // -------------------------------------------------------------
  // Stage 5: Policy Engine Check (Deterministic safety rails)
  // -------------------------------------------------------------
  const activeConfidence = diagnosis.isAiDiagnosed && diagnosis.aiRecommendation?.confidence
    ? diagnosis.aiRecommendation.confidence
    : diagnosis.confidence;

  const policyResult = evaluatePolicy(payment, proposedAction, activeConfidence, diagnosis.cause);

  await logAudit({
    ts,
    payment_id: payment.id,
    stage: 'policy_check',
    cause: diagnosis.cause,
    confidence: activeConfidence,
    action: policyResult.action,
    result: policyResult.decision,
    explanation: `[Policy ${policyResult.decision}]: ${policyResult.reason}`,
    reason: policyResult.policy_flags.join(', '),
    amount: payment.amount
  });

  const finalAction = policyResult.action;

  // -------------------------------------------------------------
  // Stage 6: Execute & State Machine Transition
  // -------------------------------------------------------------
  // INVARIANT: recoveryEngine NEVER jumps straight to 'recovered'!
  // State transitions:
  // - Automated actions (retries, payment links) -> 'pending_confirmation'
  // - Manual review / blocked policies -> 'partial'
  let executionStatus = 'pending_confirmation';
  let executionDetails = '';
  let notificationResult = null;

  if (finalAction === PLAYBOOK.manual_review || finalAction === PLAYBOOK.escalate_alternate_method) {
    executionStatus = 'partial';
    executionDetails = `Escalated to human ops ticket #REV-${payment.id.slice(-4).toUpperCase()}`;
  } else if (finalAction === PLAYBOOK.send_update_payment_link) {
    // Real email dispatch via Ethereal SMTP / Resend
    notificationResult = await sendPaymentUpdateLink({
      to: payment.customer_email,
      customerName: payment.customer_name,
      amount: payment.amount,
      paymentId: payment.id,
      subscriptionId: payment.subscription_id,
      cause: diagnosis.cause
    });

    executionStatus = 'pending_confirmation';
    executionDetails = notificationResult.success
      ? `Real email dispatched via Ethereal SMTP [Preview: ${notificationResult.previewUrl}]`
      : `Email dispatch queued (retry window active)`;
  } else if (finalAction === PLAYBOOK.immediate_retry || finalAction === PLAYBOOK.schedule_smart_retry) {
    executionStatus = 'pending_confirmation';
    executionDetails = `Dispatched gateway retry directive (attempt ${currentAttempts + 1}/${MAX_ATTEMPTS}); awaiting confirmation event`;
  }

  // Update payment record attributes
  payment.diagnosis = diagnosis.cause;
  payment.diagnosis_confidence = activeConfidence;
  payment.recovery_action = finalAction;
  payment.status = executionStatus;
  payment.attempt_number = currentAttempts + 1;
  payment.updated_at = new Date().toISOString();

  if (!payment.recovery_history || !Array.isArray(payment.recovery_history)) {
    payment.recovery_history = [];
  }

  const historyOutcome = notificationResult?.previewUrl
    ? `${executionDetails} (Preview: ${notificationResult.previewUrl})`
    : executionDetails;

  payment.recovery_history.push({
    payment_id: payment.id,
    action: finalAction,
    outcome: historyOutcome,
    ts: new Date().toISOString()
  });

  await logAudit({
    ts: new Date().toISOString(),
    payment_id: payment.id,
    stage: 'execute',
    cause: diagnosis.cause,
    confidence: activeConfidence,
    action: finalAction,
    result: 'dispatched',
    explanation: executionDetails,
    reason: diagnosis.reason,
    amount: payment.amount
  });

  return {
    success: true,
    malformed: false,
    payment,
    action: finalAction,
    policyDecision: policyResult.decision,
    isAiDiagnosed: diagnosis.isAiDiagnosed || false,
    diagnosis
  };
}

/**
 * Process a batch of payments through the governed recovery pipeline.
 * 
 * @param {Array} payments - Array of payment records
 * @param {Object} callbacks - Callbacks
 * @param {Function} [callbacks.appendAudit] - Function to append single audit
 * @param {Function} [callbacks.appendAudits] - Function to append batch audits
 * @returns {Promise<Object>} Batch execution summary
 */
async function processBatch(payments, { appendAudit = async () => {}, appendAudits = null } = {}) {
  const summary = {
    total: payments.length,
    successful: 0,
    failed: 0,
    malformed: 0,
    pending_confirmation: 0,
    manual_review: 0,
    ai_consult_invoked: 0,
    policy_blocked: 0,
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

        if (result.isAiDiagnosed) {
          summary.ai_consult_invoked++;
        }

        if (result.policyDecision === 'BLOCKED') {
          summary.policy_blocked++;
        }

        if (result.payment) {
          if (result.payment.status === 'pending_confirmation') {
            summary.pending_confirmation++;
          } else if (result.payment.status === 'partial') {
            summary.manual_review++;
          }
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
    explanation: `Batch run completed: ${summary.successful} processed (${summary.ai_consult_invoked} AI-assisted, ${summary.pending_confirmation} awaiting gateway confirmation, ${summary.manual_review} routed to review, ${summary.policy_blocked} policy-blocked)`,
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
