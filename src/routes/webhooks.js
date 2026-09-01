const express = require('express');
const dataStore = require('../services/dataStore.js');

const router = express.Router();

/**
 * POST /webhooks/payment
 * Handle payment-related webhook events
 * 
 * IMPORTANT: In Netlify Functions, the raw body is available at event.body
 * For HMAC signature verification (e.g., Razorpay webhooks), we need:
 * 1. The raw body string (before parsing as JSON)
 * 2. The X-Razorpay-Signature header
 * 
 * Express's req.rawBody is populated by serverless-http automatically.
 * You can access it via req.rawBody or the raw body is available in req.body._raw
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

    // For Razorpay webhooks specifically, verify signature if header is present
    const razorpaySignature = req.headers['x-razorpay-signature'];
    if (razorpaySignature) {
      // TODO: Implement Razorpay HMAC verification
      // const crypto = require('crypto');
      // const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      // const expectedSignature = crypto
      //   .createHmac('sha256', secret)
      //   .update(req.rawBody || JSON.stringify(req.body))
      //   .digest('hex');
      // if (expectedSignature !== razorpaySignature) {
      //   return res.status(401).json({
      //     status: 'error',
      //     message: 'Invalid webhook signature'
      //   });
      // }
      console.log('ℹ️ Razorpay signature verification: implement HMAC check with secret key');
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

module.exports = router;
