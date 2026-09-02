require('dotenv').config();
const crypto = require('crypto');

const BASE_URL = 'http://127.0.0.1:3000';
const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'dev_webhook_secret_key_2026';

function signPayload(payloadStr, secret = SECRET) {
  return crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
}

async function runTests() {
  console.log('🧪 RUNNING VERIFICATION TEST SUITE:\n');

  // Test 1: Bad Webhook Signature
  console.log('--- TEST 1: Bad Webhook Signature Rejection ---');
  const payload1 = JSON.stringify({
    event: 'payment.updated',
    event_id: `evt_test_${Date.now()}`,
    data: { id: 'pay_test_bad_sig', amount: 1000 }
  });

  try {
    const res = await fetch(`${BASE_URL}/webhooks/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': 'invalid_signature_hash_12345'
      },
      body: payload1
    });

    const status = res.status;
    const body = await res.json();
    console.log(`HTTP Status: ${status} (Expected: 401)`);
    console.log('Response Body:', body);
    console.log(`✓ Test 1 Result: ${status === 401 ? 'PASSED (Rejected bad signature)' : 'FAILED'}\n`);
  } catch (err) {
    console.error('Test 1 Error:', err.message);
  }

  // Test 2: Valid Signature & First Webhook Dispatch
  console.log('--- TEST 2: Valid HMAC Signature Processing ---');
  const testEventId = `evt_idemp_${Date.now()}_999`;
  const payload2 = JSON.stringify({
    event: 'recovery.confirmed',
    event_id: testEventId,
    provenance: 'Automated Verification Test',
    data: {
      id: 'pay_test_confirm_1',
      amount: 4999,
      simulation_note: 'Verified test confirmation'
    }
  });
  const validSig = signPayload(payload2);

  try {
    const res = await fetch(`${BASE_URL}/webhooks/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': validSig
      },
      body: payload2
    });

    const status = res.status;
    const body = await res.json();
    console.log(`HTTP Status: ${status} (Expected: 200)`);
    console.log('Response Body:', body);
    console.log(`✓ Test 2 Result: ${status === 200 && body.status === 'success' ? 'PASSED (Accepted valid signature)' : 'FAILED'}\n`);
  } catch (err) {
    console.error('Test 2 Error:', err.message);
  }

  // Test 3: Idempotency Replay Prevention
  console.log('--- TEST 3: Idempotency Duplicate Replay Prevention ---');
  try {
    const res = await fetch(`${BASE_URL}/webhooks/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': validSig
      },
      body: payload2 // exact same payload and event_id
    });

    const status = res.status;
    const body = await res.json();
    console.log(`HTTP Status: ${status} (Expected: 200 with status="ignored")`);
    console.log('Response Body:', body);
    console.log(`✓ Test 3 Result: ${status === 200 && body.status === 'ignored' ? 'PASSED (Replay correctly ignored)' : 'FAILED'}\n`);
  } catch (err) {
    console.error('Test 3 Error:', err.message);
  }

  // Test 4: Dynamic API Summary Verification
  console.log('--- TEST 4: Dynamic /api/summary Verification ---');
  try {
    const res = await fetch(`${BASE_URL}/api/summary`);
    const data = await res.json();
    console.log('Summary output:', data.summary);
    console.log(`Total At Risk: ₹${data.summary.total_at_risk?.toLocaleString('en-IN')}`);
    console.log(`Confirmed Recovered: ₹${data.summary.recovered?.toLocaleString('en-IN')} (${data.summary.recovery_rate}%)`);
    console.log(`Counts: Recovered=${data.summary.counts?.recovered}, Awaiting=${data.summary.counts?.awaiting}, Review=${data.summary.counts?.manual_review}`);
    console.log(`✓ Test 4 Result: ${data.summary.total_at_risk > 0 ? 'PASSED (Dynamic database metrics verified)' : 'FAILED'}\n`);
  } catch (err) {
    console.error('Test 4 Error:', err.message);
  }

  console.log('🏁 All Verification Tests Completed!');
}

runTests();
