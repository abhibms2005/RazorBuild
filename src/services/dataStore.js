/**
 * DataStore Service - Supabase persistence layer for Payments, Audit Log, and Idempotency
 */

const supabase = require('./supabaseClient.js');

// In-memory fallback cache in case Supabase table is temporarily initializing
const inMemoryProcessedEvents = new Set();

/**
 * Load all payments with their recovery history
 * @returns {Promise<Array>} Array of payment records with nested recovery_history
 */
async function loadPayments() {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, recovery_history(*)');

    if (error) {
      throw new Error(`Failed to load payments: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Error loading payments:', err.message);
    throw err;
  }
}

/**
 * Upsert a single payment record and insert any new recovery history entries
 * @param {Object} record - Payment record with optional recovery_history array
 * @returns {Promise<Object>} Upserted payment record
 */
async function upsertPayment(record) {
  try {
    const { recovery_history, ...paymentData } = record;

    const { data: upsertedPayment, error: upsertError } = await supabase
      .from('payments')
      .upsert(paymentData, { onConflict: 'id' })
      .select()
      .single();

    if (upsertError) {
      throw new Error(`Failed to upsert payment: ${upsertError.message}`);
    }

    if (recovery_history && Array.isArray(recovery_history)) {
      const newEntries = recovery_history.filter(h => !h.id);
      if (newEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('recovery_history')
          .insert(
            newEntries.map(entry => ({
              payment_id: upsertedPayment.id,
              action: entry.action,
              outcome: entry.outcome || null,
              ts: entry.ts || new Date().toISOString()
            }))
          );

        if (insertError) {
          console.warn(`Warning inserting recovery history: ${insertError.message}`);
        }
      }
    }

    return upsertedPayment;
  } catch (err) {
    console.error('Error upserting payment:', err.message);
    throw err;
  }
}

/**
 * High-performance batch upsert for payments and recovery history
 * @param {Array} payments - Array of payment records with recovery_history
 * @returns {Promise<Array>} Array of upserted payment records
 */
async function upsertPayments(payments) {
  try {
    if (!payments || payments.length === 0) return [];

    const paymentRows = [];
    const newHistoryEntries = [];

    for (const payment of payments) {
      const { recovery_history, ...paymentData } = payment;
      paymentRows.push(paymentData);

      if (recovery_history && Array.isArray(recovery_history)) {
        const uncommitted = recovery_history.filter(h => !h.id);
        for (const h of uncommitted) {
          newHistoryEntries.push({
            payment_id: payment.id,
            action: h.action,
            outcome: h.outcome || null,
            ts: h.ts || new Date().toISOString()
          });
        }
      }
    }

    // 1. Batch upsert payment records
    const { data: upserted, error: upsertError } = await supabase
      .from('payments')
      .upsert(paymentRows, { onConflict: 'id' })
      .select();

    if (upsertError) {
      throw new Error(`Failed to batch upsert payments: ${upsertError.message}`);
    }

    // 2. Batch insert recovery history records
    if (newHistoryEntries.length > 0) {
      const { error: insertHistoryError } = await supabase
        .from('recovery_history')
        .insert(newHistoryEntries);

      if (insertHistoryError) {
        console.warn(`Warning batch inserting recovery history: ${insertHistoryError.message}`);
      }
    }

    return upserted || [];
  } catch (err) {
    console.error('Error in batch upsertPayments:', err.message);
    throw err;
  }
}

/**
 * Confirm outcome of a payment recovery attempt (Stage 7 of pipeline)
 * Transitions status to 'recovered' or 'partial' upon verified confirmation event.
 * 
 * @param {string} paymentId - Payment ID to confirm
 * @param {Object} confirmation - Confirmation metadata
 * @returns {Promise<Object>} Updated payment record
 */
async function confirmPaymentRecovery(paymentId, confirmation = {}) {
  try {
    const isSuccess = confirmation.status === 'recovered' || confirmation.event === 'recovery.confirmed';
    const newStatus = isSuccess ? 'recovered' : 'partial';
    const outcomeText = confirmation.note || (isSuccess ? 'Settlement confirmed via gateway webhook' : 'Payment retry failed at gateway');

    // Update payment record in database
    const { data: updated, error } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to confirm payment recovery: ${error.message}`);
    }

    const amount = updated ? updated.amount : (confirmation.data?.amount || 0);

    // Append to recovery_history
    try {
      await supabase.from('recovery_history').insert([
        {
          payment_id: paymentId,
          action: 'confirm',
          outcome: `${confirmation.provenance ? '[' + confirmation.provenance + '] ' : ''}${outcomeText}`,
          ts: new Date().toISOString()
        }
      ]);
    } catch (hErr) {
      console.warn('Warning inserting confirmation history:', hErr.message);
    }

    // Append to audit_log
    await appendAudit({
      ts: new Date().toISOString(),
      payment_id: paymentId,
      stage: 'confirm',
      action: isSuccess ? 'recovery_confirmed' : 'recovery_unsuccessful',
      explanation: `${confirmation.provenance ? '[' + confirmation.provenance + '] ' : ''}${outcomeText} — Amount: ₹${amount}`,
      reason: isSuccess ? 'settlement_verified' : 'gateway_rejection',
      amount: amount
    });

    return updated || { id: paymentId, status: newStatus, amount };
  } catch (err) {
    console.error(`Error confirming payment recovery for ${paymentId}:`, err.message);
    throw err;
  }
}

/**
 * Persistent Idempotency Store (Supabase-backed processed_events table)
 * Check if a webhook event ID has already been processed.
 * 
 * @param {string} eventId - Unique webhook event identifier
 * @returns {Promise<boolean>} True if duplicate, false if new
 */
async function isEventProcessed(eventId) {
  if (!eventId) return false;

  // Check in-memory fast cache first
  if (inMemoryProcessedEvents.has(eventId)) {
    return true;
  }

  try {
    const { data, error } = await supabase
      .from('processed_events')
      .select('event_id')
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      // If table doesn't exist yet, fallback gracefully to in-memory set
      return inMemoryProcessedEvents.has(eventId);
    }

    if (data) {
      inMemoryProcessedEvents.add(eventId);
      return true;
    }

    return false;
  } catch (err) {
    return inMemoryProcessedEvents.has(eventId);
  }
}

/**
 * Record a processed webhook event in the persistent Supabase store.
 * 
 * @param {string} eventId - Unique webhook event identifier
 * @param {string} eventType - Event type (e.g. recovery.confirmed)
 * @returns {Promise<void>}
 */
async function recordProcessedEvent(eventId, eventType = 'unknown') {
  if (!eventId) return;

  inMemoryProcessedEvents.add(eventId);

  try {
    const { error } = await supabase
      .from('processed_events')
      .insert([
        {
          event_id: eventId,
          event_type: eventType,
          processed_at: new Date().toISOString()
        }
      ]);

    if (error && error.code !== '23505') { // Ignore unique conflict error code
      // If table is missing, log warning
      console.warn('Note on processed_events table insert:', error.message);
    }
  } catch (err) {
    // Non-blocking fallback
  }
}

/**
 * Append a single entry to the audit log
 * @param {Object} entry - Audit log entry
 * @returns {Promise<Object>} Inserted audit log entry
 */
async function appendAudit(entry) {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .insert([entry])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to append audit log: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error('Error appending audit log:', err.message);
    throw err;
  }
}

/**
 * Append multiple entries to the audit log in a single batch insert
 * @param {Array} entries - Array of audit log entries
 * @returns {Promise<Array>} Inserted audit log entries
 */
async function appendAudits(entries) {
  try {
    if (!entries || entries.length === 0) return [];

    const { data, error } = await supabase
      .from('audit_log')
      .insert(entries)
      .select();

    if (error) {
      throw new Error(`Failed to batch insert audit log: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Error batch inserting audit log:', err.message);
    throw err;
  }
}

/**
 * Load all audit log entries ordered by timestamp (ascending)
 * @returns {Promise<Array>} Array of audit log entries
 */
async function loadAudit() {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('ts', { ascending: true });

    if (error) {
      throw new Error(`Failed to load audit log: ${error.message}`);
    }

    return data || [];
  } catch (err) {
    console.error('Error loading audit log:', err.message);
    throw err;
  }
}

/**
 * Clear all audit log entries (used before a fresh batch run)
 * @returns {Promise<Object>} Delete result
 */
async function resetAudit() {
  try {
    const { error } = await supabase
      .from('audit_log')
      .delete()
      .neq('id', 0);

    if (error) {
      throw new Error(`Failed to reset audit log: ${error.message}`);
    }

    console.log('Audit log cleared successfully');
  } catch (err) {
    console.error('Error resetting audit log:', err.message);
    throw err;
  }
}

module.exports = {
  loadPayments,
  upsertPayment,
  upsertPayments,
  confirmPaymentRecovery,
  isEventProcessed,
  recordProcessedEvent,
  appendAudit,
  appendAudits,
  loadAudit,
  resetAudit
};
