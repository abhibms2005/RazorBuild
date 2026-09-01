/**
 * Recovery Engine - Core business logic for processing payments and attempting recovery
 * This module analyzes payment records and determines recovery actions
 */

/**
 * Process a batch of payments and generate recovery actions
 * @param {Array} payments - Array of payment records
 * @param {Object} callbacks - Callback functions for external operations
 * @param {Function} callbacks.appendAudit - Function to append audit log entries
 * @returns {Promise<Object>} Summary of batch processing results
 */
async function processBatch(payments, { appendAudit }) {
  const summary = {
    total: payments.length,
    successful: 0,
    failed: 0,
    malformed: 0,
    recovered: 0,
    errors: []
  };

  if (!payments || payments.length === 0) {
    await appendAudit({
      ts: new Date().toISOString(),
      action: 'batch_process'
    }).catch(err => console.error('Could not log to audit:', err.message));
    return summary;
  }

  for (const payment of payments) {
    try {
      // Check for malformed records (e.g., missing amount)
      if (payment.amount === undefined || payment.amount === null) {
        summary.malformed++;
        await appendAudit({
          ts: new Date().toISOString(),
          action: 'malformed_record_detected'
        }).catch(err => console.error('Could not log to audit:', err.message));
        continue;
      }

      // Analyze payment for recovery opportunities
      const recoveryAction = analyzePayment(payment);

      if (recoveryAction) {
        summary.recovered++;
        // Add recovery action to payment's recovery_history
        if (!payment.recovery_history) {
          payment.recovery_history = [];
        }
        payment.recovery_history.push({
          payment_id: payment.id,
          action: recoveryAction.action,
          ts: new Date().toISOString()
        });
      }

      summary.successful++;

      // Log audit entry for this payment
      await appendAudit({
        ts: new Date().toISOString(),
        action: 'payment_processed'
      }).catch(err => console.error('Could not log to audit:', err.message));
    } catch (error) {
      summary.failed++;
      summary.errors.push({
        paymentId: payment.id,
        error: error.message
      });

      await appendAudit({
        ts: new Date().toISOString(),
        action: 'payment_processing_error'
      }).catch(err => console.error('Could not log to audit:', err.message));
    }
  }

  // Log batch completion
  await appendAudit({
    ts: new Date().toISOString(),
    action: 'batch_process_completed'
  }).catch(err => console.error('Could not log to audit:', err.message));

  return summary;
}

/**
 * Analyze a single payment and determine if recovery action is needed
 * @param {Object} payment - Payment record to analyze
 * @returns {Object|null} Recovery action object or null if no action needed
 */
function analyzePayment(payment) {
  // Check if payment is already fully recovered
  if (payment.status === 'recovered') {
    return null;
  }

  // If amount is missing, skip (malformed record)
  if (payment.amount === undefined || payment.amount === null) {
    return null;
  }

  // If amount is very small, might not be worth pursuing
  if (payment.amount < 1) {
    return null;
  }

  // Determine recovery action based on payment status and history
  const recoveryHistory = payment.recovery_history || [];
  const attemptCount = recoveryHistory.length;

  // Escalation logic
  if (attemptCount === 0) {
    return {
      action: 'initial_recovery_attempt',
      status: 'initiated',
      amount: payment.amount
    };
  } else if (attemptCount === 1) {
    return {
      action: 'second_recovery_attempt',
      status: 'initiated',
      amount: payment.amount
    };
  } else if (attemptCount >= 2) {
    return {
      action: 'escalated_recovery',
      status: 'escalated',
      amount: payment.amount
    };
  }

  return null;
}

module.exports = {
  processBatch
};
