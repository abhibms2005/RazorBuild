const express = require('express');
const crypto = require('crypto');
const dataStore = require('../services/dataStore.js');

const router = express.Router();

/**
 * Helper to compute and verify HMAC-SHA256 signature
 */
function verifyHmacSignature(rawBody, signature, secret) {
  if (!signature || !secret) return false;
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch (err) {
    return false;
  }
}

/**
 * POST /webhooks/payment
 * Handle payment lifecycle and recovery confirmation webhook events.
 * 
 * Security Controls:
 * 1. HMAC-SHA256 signature verification via X-Razorpay-Signature
 * 2. Supabase-backed persistent idempotency checking (reject replay attacks)
 * 3. Atomic state machine confirmation (Stage 7 of recovery pipeline)
 */
router.post('/payment', async (req, res) => {
  try {
    const { event, event_id, data, provenance } = req.body || {};
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dev_webhook_secret_key_2026';
    const razorpaySignature = req.headers['x-razorpay-signature'];
    const rawBodyString = req.rawBody || JSON.stringify(req.body);

    if (!event || !data) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required event or data fields in webhook payload'
      });
    }

    // 1. Cryptographic HMAC Signature Verification
    // Require signature verification whenever secret is configured or header is provided
    if (!razorpaySignature || !verifyHmacSignature(rawBodyString, razorpaySignature, secret)) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or missing webhook HMAC signature (X-Razorpay-Signature)'
      });
    }

    // 2. Persistent Idempotency Check
    const uniqueEventId = event_id || (data.id ? `${event}_${data.id}_${data.attempt_number || 1}` : null);
    
    if (uniqueEventId) {
      const alreadyProcessed = await dataStore.isEventProcessed(uniqueEventId);
      if (alreadyProcessed) {
        return res.status(200).json({
          status: 'ignored',
          message: 'Duplicate event ID already processed (idempotency guard)',
          event_id: uniqueEventId
        });
      }

      // Record event ID to persistent store
      await dataStore.recordProcessedEvent(uniqueEventId, event);
    }

    // 3. Log Webhook Receipt in Audit Trail
    await dataStore.appendAudit({
      ts: new Date().toISOString(),
      payment_id: data.id || null,
      stage: 'confirm',
      action: `webhook_${event}`,
      explanation: `Verified webhook received [${event}]${provenance ? ' (' + provenance + ')' : ''}`,
      reason: 'webhook_dispatch_verified',
      amount: data.amount || null
    }).catch(err => console.error('Could not log webhook audit:', err.message));

    // 4. Handle Outcome Events (State Machine Stage 7)
    switch (event) {
      case 'recovery.confirmed':
      case 'payment.captured':
      case 'payment.authorized': {
        // Confirmation event -> transitions status to 'recovered'
        if (data.id) {
          const updated = await dataStore.confirmPaymentRecovery(data.id, {
            status: 'recovered',
            event,
            provenance: provenance || 'Webhook Gateway Confirmation',
            note: data.simulation_note || 'Payment recovery confirmed via verified webhook'
          });

          return res.json({
            status: 'success',
            message: 'Payment recovery confirmed and settled',
            payment: updated
          });
        }
        break;
      }

      case 'payment.failed':
      case 'recovery.failed': {
        // Retry failed event -> transitions status to 'partial' (manual review)
        if (data.id) {
          const updated = await dataStore.confirmPaymentRecovery(data.id, {
            status: 'partial',
            event,
            provenance: provenance || 'Webhook Gateway Rejection',
            note: data.simulation_note || 'Gateway retry unsuccessful; routed to ops'
          });

          return res.json({
            status: 'success',
            message: 'Payment retry failure recorded',
            payment: updated
          });
        }
        break;
      }

      case 'payment.updated': {
        if (data.id && data.amount !== undefined) {
          await dataStore.upsertPayment(data);
          return res.json({
            status: 'success',
            message: 'Payment record updated'
          });
        }
        break;
      }

      default:
        return res.status(400).json({
          status: 'error',
          message: `Unknown or unhandled event type: ${event}`
        });
    }

    res.json({
      status: 'success',
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process webhook event',
      error: error.message
    });
  }
});

module.exports = router;
