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
 * Upsert a payment record and insert any new recovery history entries
 * @param {Object} record - Payment record with optional recovery_history array
 * @returns {Promise<Object>} Upserted payment record
 */
async function upsertPayment(record) {
  try {
    const { recovery_history, ...paymentData } = record;

    // Upsert the payment record (ensure id is included)
    const { data: upsertedPayment, error: upsertError } = await supabase
      .from('payments')
      .upsert(paymentData, { onConflict: 'id' })
      .select()
      .single();

    if (upsertError) {
      throw new Error(`Failed to upsert payment: ${upsertError.message}`);
    }

    // Handle recovery history: only insert new entries that don't already exist
    if (recovery_history && Array.isArray(recovery_history)) {
      // Load existing recovery history for this payment
      const { data: existingHistory, error: loadError } = await supabase
        .from('recovery_history')
        .select('*')
        .eq('payment_id', upsertedPayment.id);

      if (loadError) {
        throw new Error(`Failed to load recovery history: ${loadError.message}`);
      }

      // Since we don't have stable ids for recovery history entries,
      // we'll insert all new entries (those without a database id)
      const newEntries = recovery_history.filter(
        h => !h.id // Only insert entries that don't have a database-generated id yet
      );

      // Insert new recovery history entries
      if (newEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('recovery_history')
          .insert(
            newEntries.map(entry => ({
              payment_id: upsertedPayment.id,
              action: entry.action,
              ts: entry.ts
            }))
          );

        if (insertError) {
          throw new Error(`Failed to insert recovery history: ${insertError.message}`);
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
 * Append an entry to the audit log
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
      .neq('id', 0); // Clears all rows (no row has id !== 0 that we want to keep)

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
  appendAudit,
  loadAudit,
  resetAudit
};
