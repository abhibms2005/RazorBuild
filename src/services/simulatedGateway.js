/**
 * Simulated Gateway Service (Track 03 - AI Revenue Recovery)
 * 
 * Generates realistic outcome confirmation events for executed recovery actions.
 * Dispatches HMAC-SHA256 signed webhooks (recovery.confirmed or payment.failed)
 * through the REAL webhook verification, idempotency checking, and state machine paths.
 * 
 * PROVENANCE & TRANSPARENCY:
 * All events dispatched by this service are explicitly labeled as:
 * "Simulated Gateway Response" in the audit trail and UI disclosures.
 */

const crypto = require('crypto');

const CAUSE_SUCCESS_PROBABILITIES = {
  insufficient_funds: 0.60,      // Smart retry succeeds ~60% after balance cooldown
  bank_technical_error: 0.80,    // Transient gateway timeouts clear on retry ~80%
  authentication_failed: 0.70,   // Customer self-serve 3DS completion ~70%
  card_expired: 0.70,            // Customer updates card via payment link ~70%
  limit_exceeded: 0.40,          // Reset on next billing window ~40%
  card_blocked: 0.00,            // Never auto-succeeds without bank reissue
  risk_decline: 0.00,            // Never auto-succeeds without manual compliance clearance
  unknown_failure: 0.50          // AI-advised resolution ~50%
};

/**
 * Generate an HMAC-SHA256 signature for a webhook payload string
 * @param {string} rawBody - Stringified webhook JSON payload
 * @param {string} secret - Razorpay webhook secret
 * @returns {string} Hex HMAC signature
 */
function generateWebhookSignature(rawBody, secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dev_webhook_secret_key_2026') {
  return crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
}

/**
 * Check if the local HTTP webhook server is active (fast 300ms probe)
 */
async function isServerReachable(url) {
  try {
    const probeUrl = url.replace(/\/payment$/, '').replace(/\/webhooks$/, '') + '/health';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300);
    const res = await fetch(probeUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Simulate banking gateway responses for payments currently in pending_confirmation.
 * Emits HMAC-signed webhook events to confirm recovery or record retry failure.
 * 
 * @param {Array} pendingPayments - Array of payments with status 'pending_confirmation'
 * @param {Object} options
 * @param {string} [options.webhookUrl] - URL of webhook endpoint (defaults to http://127.0.0.1:PORT/webhooks/payment)
 * @param {Function} [options.directHandler] - Direct in-process webhook handler for CLI batch script
 * @returns {Promise<Object>} Confirmation simulation summary
 */
async function simulateGatewayConfirmations(pendingPayments = [], options = {}) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'dev_webhook_secret_key_2026';
  const port = process.env.PORT || 3000;
  const webhookUrl = options.webhookUrl || `http://127.0.0.1:${port}/webhooks/payment`;

  const results = {
    evaluated: pendingPayments.length,
    confirmed: 0,
    failed: 0,
    skipped: 0,
    eventsDispatched: []
  };

  if (pendingPayments.length === 0) {
    return results;
  }

  // Probe if HTTP server is active once
  const serverActive = await isServerReachable(webhookUrl);

  for (const payment of pendingPayments) {
    if (!payment || !payment.id || payment.status !== 'pending_confirmation') {
      results.skipped++;
      continue;
    }

    const cause = payment.diagnosis || 'unknown_failure';
    const baseProb = CAUSE_SUCCESS_PROBABILITIES[cause] !== undefined 
      ? CAUSE_SUCCESS_PROBABILITIES[cause] 
      : 0.50;

    // Use deterministic pseudorandom evaluation based on payment id hash to be reproducible
    const hash = crypto.createHash('md5').update(payment.id + '_gw_sim').digest('hex');
    const pseudoRand = (parseInt(hash.slice(0, 4), 16) % 100) / 100;
    const isSuccess = pseudoRand < baseProb;

    const eventType = isSuccess ? 'recovery.confirmed' : 'payment.failed';
    const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    const payload = {
      event: eventType,
      event_id: eventId,
      created_at: new Date().toISOString(),
      provenance: 'Simulated Gateway Response',
      data: {
        id: payment.id,
        subscription_id: payment.subscription_id,
        amount: payment.amount,
        customer_name: payment.customer_name,
        diagnosis: payment.diagnosis,
        recovery_action: payment.recovery_action,
        attempt_number: payment.attempt_number,
        gateway_reference: `gw_ref_${crypto.randomBytes(6).toString('hex')}`,
        settlement_timestamp: new Date().toISOString(),
        simulation_note: `Simulated Gateway Response: ${isSuccess ? 'Settlement confirmed' : 'Gateway debit failed'}`
      }
    };

    const rawBody = JSON.stringify(payload);
    const signature = generateWebhookSignature(rawBody, secret);

    let dispatchSuccess = false;

    if (serverActive) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Razorpay-Signature': signature
          },
          body: rawBody
        });

        if (response.ok) {
          dispatchSuccess = true;
        }
      } catch (httpErr) {
        // Fallback to direct handler
        if (options.directHandler) {
          await options.directHandler({ body: payload, headers: { 'x-razorpay-signature': signature }, rawBody });
          dispatchSuccess = true;
        }
      }
    } else if (options.directHandler) {
      // In-process dispatch during standalone CLI script execution
      await options.directHandler({ body: payload, headers: { 'x-razorpay-signature': signature }, rawBody });
      dispatchSuccess = true;
    }

    if (isSuccess) {
      results.confirmed++;
    } else {
      results.failed++;
    }

    results.eventsDispatched.push({
      payment_id: payment.id,
      event_id: eventId,
      event_type: eventType,
      success: isSuccess,
      dispatched_via_http: dispatchSuccess
    });
  }

  return results;
}

module.exports = {
  generateWebhookSignature,
  simulateGatewayConfirmations,
  CAUSE_SUCCESS_PROBABILITIES
};
