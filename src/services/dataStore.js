const supabase = require('./supabaseClient.js');

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
 * Performs updates in a single round-trip instead of N sequential requests.
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
  appendAudit,
  appendAudits,
  loadAudit,
  resetAudit
};
