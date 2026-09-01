const express = require('express');
const dataStore = require('../services/dataStore.js');
const { processBatch } = require('../services/recoveryEngine.js');
const supabase = require('../services/supabaseClient.js');

const router = express.Router();

/**
 * GET /api/health-db
 * Verify database connection by running a trivial Supabase query
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
 * Retrieve aggregated payment statistics
 */
router.get('/summary', async (req, res) => {
  try {
    const payments = await dataStore.loadPayments();

    const summary = {
      total: payments.length,
      byStatus: {
        pending: 0,
        partial: 0,
        recovered: 0
      },
      totalAmount: 0,
      averageRecoveryRate: 0
    };

    payments.forEach(payment => {
      summary.byStatus[payment.status] = (summary.byStatus[payment.status] || 0) + 1;
      if (payment.amount) {
        summary.totalAmount += payment.amount;
      }
    });

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
 * Retrieve audit log entries
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
 * Trigger a recovery batch run against the database
 */
router.post('/run-batch', async (req, res) => {
  try {
    // Load all payments from database
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

    // Reset audit log for fresh batch run
    await dataStore.resetAudit();

    // Process batch through recovery engine
    const batchSummary = await processBatch(payments, {
      appendAudit: dataStore.appendAudit
    });

    // Write results back to database
    let successfulWrites = 0;
    let failedWrites = 0;

    for (const payment of payments) {
      try {
        await dataStore.upsertPayment(payment);
        successfulWrites++;
      } catch (error) {
        failedWrites++;
      }
    }

    // Return response with updated state
    const updatedPayments = await dataStore.loadPayments();

    res.json({
      status: 'success',
      message: 'Batch run completed',
      summary: batchSummary,
      writeResults: {
        successful: successfulWrites,
        failed: failedWrites
      },
      updatedState: updatedPayments
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Batch run failed',
      error: error.message
    });
  }
});

module.exports = router;
