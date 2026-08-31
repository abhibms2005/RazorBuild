import express from 'express';
import * as dataStore from '../services/dataStore.js';

const router = express.Router();

/**
 * POST /webhooks/payment
 * Handle payment-related webhook events
 */
router.post('/payment', async (req, res) => {
  try {
    const { event, data } = req.body;

    if (!event || !data) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing event or data in webhook payload'
      });
    }

    // Log webhook receipt
    await dataStore.appendAudit({
      ts: new Date().toISOString(),
      action: 'webhook_received'
    }).catch(err => console.error('Could not log webhook:', err.message));

    // Handle specific events
    switch (event) {
      case 'payment.updated':
        // Update payment record if provided
        if (data.id && data.amount !== undefined) {
          await dataStore.upsertPayment(data);
          return res.json({
            status: 'success',
            message: 'Payment record updated'
          });
        }
        break;

      case 'recovery.completed':
        // Mark payment as recovered
        if (data.id) {
          await dataStore.upsertPayment({
            ...data,
            status: 'recovered'
          });
          return res.json({
            status: 'success',
            message: 'Payment marked as recovered'
          });
        }
        break;

      default:
        return res.status(400).json({
          status: 'error',
          message: `Unknown event type: ${event}`
        });
    }

    res.json({
      status: 'success',
      message: 'Webhook processed'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to process webhook',
      error: error.message
    });
  }
});

export default router;
