const express = require('express');
const dataStore = require('../services/dataStore.js');
const { processBatch } = require('../services/recoveryEngine.js');
const { simulateGatewayConfirmations } = require('../services/simulatedGateway.js');
const supabase = require('../services/supabaseClient.js');

const router = express.Router();

/**
 * GET /api/health-db
 * Verify database connection by running a query
 */
router.get('/health-db', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return res.status(503).json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message
      });
    }

    res.json({
      status: 'ok',
      message: 'Database connection successful',
      paymentCount: count
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * GET /api/records
 * Retrieve all payments with their recovery history
 */
router.get('/records', async (req, res) => {
  try {
    const payments = await dataStore.loadPayments();

    res.json({
      status: 'success',
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to load records',
      error: error.message
    });
  }
});

/**
 * GET /api/summary
 * Retrieve aggregated payment statistics computed from real database records
 */
router.get('/summary', async (req, res) => {
  try {
    const payments = await dataStore.loadPayments();

    const summary = {
      total: payments.length,
      total_at_risk: 0,
      recovered: 0,
      awaiting: 0,
      manual_review: 0,
      errors: 0,
      recovery_rate: 0,
      byStatus: {
        pending: 0,
        pending_confirmation: 0,
        partial: 0,
        recovered: 0
      },
      counts: {
        recovered: 0,
        awaiting: 0,
        manual_review: 0,
        errors: 0
      }
    };

    payments.forEach(payment => {
      const amt = Number(payment.amount) || 0;
      summary.total_at_risk += amt;
      summary.byStatus[payment.status] = (summary.byStatus[payment.status] || 0) + 1;

      if (payment.status === 'recovered') {
        summary.recovered += amt;
        summary.counts.recovered++;
      } else if (payment.status === 'pending' || payment.status === 'pending_confirmation') {
        summary.awaiting += amt;
        summary.counts.awaiting++;
      } else if (payment.status === 'partial') {
        summary.manual_review += amt;
        summary.counts.manual_review++;
      } else {
        summary.errors += amt;
        summary.counts.errors++;
      }
    });

    if (summary.total_at_risk > 0) {
      summary.recovery_rate = Math.round(((summary.recovered / summary.total_at_risk) * 100) * 10) / 10;
    }

    res.json({
      status: 'success',
      summary
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate summary',
      error: error.message
    });
  }
});

/**
 * GET /api/audit
 * Retrieve immutable audit log entries
 */
router.get('/audit', async (req, res) => {
  try {
    const auditLog = await dataStore.loadAudit();

    res.json({
      status: 'success',
      count: auditLog.length,
      data: auditLog
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to load audit log',
      error: error.message
    });
  }
});

/**
 * POST /api/run-batch
 * Trigger a governed recovery batch run with simulated gateway confirmations
 */
router.post('/run-batch', async (req, res) => {
  try {
    // 1. Load all payments from database
    const payments = await dataStore.loadPayments();

    if (payments.length === 0) {
      return res.json({
        status: 'success',
        message: 'No payments to process',
        summary: {
          total: 0,
          successful: 0,
          failed: 0,
          malformed: 0,
          recovered: 0
        }
      });
    }

    // 2. Reset audit log for fresh batch run
    await dataStore.resetAudit();

    // 3. Process batch through 7-stage recovery engine
    const batchSummary = await processBatch(payments, {
      appendAudit: dataStore.appendAudit,
      appendAudits: dataStore.appendAudits
    });

    // 4. Batch upsert payment states
    await dataStore.upsertPayments(payments);

    // 5. Trigger Simulated Gateway Confirmations (Stage 7)
    const pendingPayments = payments.filter(p => p.status === 'pending_confirmation');
    const port = process.env.PORT || 3000;

    await simulateGatewayConfirmations(pendingPayments, {
      webhookUrl: `http://127.0.0.1:${port}/webhooks/payment`,
      directHandler: async ({ body }) => {
        if (body.event === 'recovery.confirmed') {
          await dataStore.confirmPaymentRecovery(body.data.id, {
            status: 'recovered',
            event: body.event,
            provenance: body.provenance,
            note: body.data.simulation_note
          });
        } else {
          await dataStore.confirmPaymentRecovery(body.data.id, {
            status: 'partial',
            event: body.event,
            provenance: body.provenance,
            note: body.data.simulation_note
          });
        }
      }
    });

    // 6. Return response with final updated state
    const updatedPayments = await dataStore.loadPayments();

    res.json({
      status: 'success',
      message: 'Governed batch run completed successfully',
      summary: batchSummary,
      updatedState: updatedPayments
    });
  } catch (error) {
    console.error('Batch run failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Batch run failed',
      error: error.message
    });
  }
});

module.exports = router;
