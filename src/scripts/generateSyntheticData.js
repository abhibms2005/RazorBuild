require('dotenv').config();
const supabase = require('../services/supabaseClient.js');

// Indian first and last names for synthetic generation
const FIRST_NAMES = [
  'Rahul', 'Aakash', 'Neha', 'Siddharth', 'Vikram', 'Deepa', 'Pooja', 'Anand',
  'Kavita', 'Tarun', 'Ananya', 'Rohan', 'Sneha', 'Aditya', 'Meera', 'Varun',
  'Priya', 'Karthik', 'Divya', 'Suresh', 'Ishaan', 'Tanvi', 'Arjun', 'Ritu',
  'Gaurav', 'Shweta', 'Nikhil', 'Sunita', 'Manish', 'Pallavi', 'Rajesh', 'Preeti'
];

const LAST_NAMES = [
  'Mehta', 'Sharma', 'Patel', 'Nair', 'Kumar', 'Gupta', 'Singhania', 'Das',
  'Rao', 'Verma', 'Iyer', 'Reddy', 'Chopra', 'Banerjee', 'Deshmukh', 'Mishra',
  'Bhatia', 'Joshi', 'Kapoor', 'Saxena', 'Mukherjee', 'Menon', 'Kulkarni', 'Pandey'
];

const STANDARD_FAILURE_SCENARIOS = [
  { code: 'BAD_REQUEST_INSUFFICIENT_FUNDS', reason: 'Card balance insufficient for recurring debit' },
  { code: 'INSUFFICIENT_FUNDS', reason: 'Cardholder account balance insufficient at settlement time' },
  { code: 'CARD_EXPIRED', reason: 'Card expiration date passed validity period' },
  { code: 'BAD_REQUEST_PAYMENT_CARD_EXPIRED', reason: 'Validity period expired on registered card' },
  { code: 'GATEWAY_ERROR', reason: 'Issuer bank timed out during authorization' },
  { code: 'NETWORK_TIMEOUT', reason: 'Acquirer switch timed out during 3DS transaction processing' },
  { code: 'AUTH_FAILED', reason: 'Customer failed 3D Secure / OTP step-up authentication' },
  { code: '3DS_FAILED', reason: 'Cardholder dropped authentication challenge' },
  { code: 'CARD_BLOCKED', reason: 'Card reported hotlisted or frozen by issuing bank' },
  { code: 'DO_NOT_HONOUR', reason: 'Transaction declined by card issuer risk policy' },
  { code: 'LIMIT_EXCEEDED', reason: 'Transaction amount exceeds cardholder daily velocity limit' }
];

// Ambiguous or unclassified failure scenarios specifically designed to exercise the AI Advisor (15-20% cohort)
const AMBIGUOUS_AI_SCENARIOS = [
  { code: 'GATEWAY_ANOMALY_902', reason: 'Acquirer switch returned unmapped telemetry packet' },
  { code: 'UNKNOWN_ISSUER_REJECTION', reason: 'Bank declined recurring mandate with generic error 99' },
  { code: 'PAYMENT_ROUTING_FAILED', reason: 'Inter-switch routing failure during high-concurrency window' },
  { code: 'ERR_UNMAPPED_RESPONSE', reason: 'Unclassified payment error code received from secondary aggregator' },
  { code: 'RISK_SCORE_EVALUATION', reason: 'Issuer adaptive scoring triggered non-deterministic fraud review' },
  { code: 'MANDATE_SYNC_DESYNC', reason: 'Recurring mandate token sequence discrepancy reported by bank' }
];

const PLAN_TIERS = [
  { plan: 'Starter Monthly', minAmount: 499, maxAmount: 1499 },
  { plan: 'Pro Monthly', minAmount: 2499, maxAmount: 4999 },
  { plan: 'Team Annual', minAmount: 8499, maxAmount: 18999 },
  { plan: 'Enterprise Annual', minAmount: 29999, maxAmount: 49999 }
];

/**
 * Generate synthetic payment records
 * @param {number} count - Total records to generate (default 100)
 * @returns {Array} Generated records
 */
function generatePayments(count = 100) {
  const now = Date.now();
  const payments = [];
  
  // Guarantee 15% - 20% ambiguous records to exercise AI Advisor
  const ambiguousCount = Math.max(3, Math.round(count * 0.18));
  const standardCount = count - ambiguousCount;

  let idCounter = 1;

  // 1. Generate standard rule-classifiable payments
  for (let i = 0; i < standardCount; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const tier = PLAN_TIERS[i % PLAN_TIERS.length];
    const scenario = STANDARD_FAILURE_SCENARIOS[i % STANDARD_FAILURE_SCENARIOS.length];
    const amount = Math.floor(Math.random() * (tier.maxAmount - tier.minAmount + 1)) + tier.minAmount;
    const attempt = (i % 5 === 0) ? 2 : (i % 11 === 0) ? 3 : 1;

    payments.push({
      id: `pay_${now}_${String(idCounter).padStart(3, '0')}`,
      subscription_id: `sub_${firstName.toLowerCase().slice(0, 3)}_${Math.floor(100 + Math.random() * 900)}`,
      customer_name: `${firstName} ${lastName}`,
      customer_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      customer_phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      amount,
      currency: 'INR',
      failure_code: scenario.code,
      failure_reason: scenario.reason,
      attempt_number: attempt,
      status: 'pending',
      diagnosis: null,
      diagnosis_confidence: null,
      recovery_action: null,
      created_at: new Date(now - (idCounter * 3600 * 1000 * 4)).toISOString()
    });

    idCounter++;
  }

  // 2. Generate ambiguous / unclassified payments specifically targeting AI Advisor
  for (let j = 0; j < ambiguousCount; j++) {
    const firstName = FIRST_NAMES[(j + 15) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(j + 7) % LAST_NAMES.length];
    const tier = PLAN_TIERS[j % PLAN_TIERS.length];
    const scenario = AMBIGUOUS_AI_SCENARIOS[j % AMBIGUOUS_AI_SCENARIOS.length];
    const amount = Math.floor(Math.random() * (tier.maxAmount - tier.minAmount + 1)) + tier.minAmount;
    const attempt = (j % 3 === 0) ? 2 : 1;

    payments.push({
      id: `pay_${now}_${String(idCounter).padStart(3, '0')}`,
      subscription_id: `sub_${firstName.toLowerCase().slice(0, 3)}_${Math.floor(100 + Math.random() * 900)}`,
      customer_name: `${firstName} ${lastName}`,
      customer_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      customer_phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      amount,
      currency: 'INR',
      failure_code: scenario.code,
      failure_reason: scenario.reason,
      attempt_number: attempt,
      status: 'pending',
      diagnosis: null,
      diagnosis_confidence: null,
      recovery_action: null,
      created_at: new Date(now - (idCounter * 3600 * 1000 * 4)).toISOString()
    });

    idCounter++;
  }

  // 3. Add the deliberate malformed record (missing amount field)
  // This is REQUIRED for error handling validation
  payments.push({
    id: `pay_${now}_malformed`,
    subscription_id: 'sub_malformed_999',
    customer_name: 'Malformed Payload Test',
    customer_email: 'malformed@example.com',
    customer_phone: '+919000000000',
    amount: null, // intentionally null
    currency: 'INR',
    failure_code: 'MALFORMED_EVENT',
    failure_reason: 'Webhook payload missing required amount field',
    attempt_number: 1,
    status: 'pending',
    diagnosis: null,
    diagnosis_confidence: null,
    recovery_action: null,
    created_at: new Date().toISOString()
  });

  return payments;
}

/**
 * Generate and seed synthetic payment data into Supabase
 */
async function generateSyntheticData() {
  try {
    // Parse count from command line args: node generateSyntheticData.js --count=100
    const countArg = process.argv.find(arg => arg.startsWith('--count='));
    const parsedCount = countArg ? parseInt(countArg.split('=')[1], 10) : parseInt(process.env.SEED_COUNT || '100', 10);
    const targetCount = !isNaN(parsedCount) && parsedCount > 0 ? parsedCount : 100;

    console.log(`🔄 Starting synthetic data generation (Target count: ${targetCount} records)...\n`);

    // Step 1: Clear existing tables
    console.log('📋 Clearing existing data...');
    
    // Delete recovery history
    const { error: deleteHistoryError } = await supabase
      .from('recovery_history')
      .delete()
      .neq('id', 0);
    
    if (deleteHistoryError && deleteHistoryError.code !== 'PGRST116') {
      console.warn(`Warning deleting recovery_history: ${deleteHistoryError.message}`);
    } else {
      console.log('  ✓ Cleared recovery_history');
    }

    // Delete audit logs
    const { error: deleteAuditError } = await supabase
      .from('audit_log')
      .delete()
      .neq('id', 0);
    
    if (deleteAuditError && deleteAuditError.code !== 'PGRST116') {
      console.warn(`Warning deleting audit_log: ${deleteAuditError.message}`);
    } else {
      console.log('  ✓ Cleared audit_log');
    }

    // Delete payments
    const { error: deletePaymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', 'placeholder_keep_none');
    
    if (deletePaymentsError && deletePaymentsError.code !== 'PGRST116') {
      console.warn(`Warning deleting payments: ${deletePaymentsError.message}`);
    } else {
      console.log('  ✓ Cleared payments\n');
    }

    // Step 2: Generate synthetic payment data
    console.log('🎲 Generating synthetic payment data with calibrated failure distribution...');
    const payments = generatePayments(targetCount);
    const ambiguousCount = payments.filter(p => 
      AMBIGUOUS_AI_SCENARIOS.some(s => s.code === p.failure_code)
    ).length;

    console.log(`  ✓ Generated ${payments.length} payment records`);
    console.log(`  ✓ AI Advisor target cohort: ${ambiguousCount} records (${Math.round((ambiguousCount / payments.length) * 100)}% unclassified / ambiguous)\n`);

    // Step 3: Insert payments into database in chunks to prevent packet overflow
    console.log('💾 Inserting payments into database...');
    const chunkSize = 50;
    let totalInserted = 0;

    for (let i = 0; i < payments.length; i += chunkSize) {
      const chunk = payments.slice(i, i + chunkSize);
      const { data: inserted, error: insertError } = await supabase
        .from('payments')
        .insert(chunk)
        .select();

      if (insertError) {
        throw new Error(`Failed to insert payments chunk (${i}-${i + chunkSize}): ${insertError.message}`);
      }
      totalInserted += inserted.length;
    }

    console.log(`  ✓ Successfully inserted ${totalInserted} payments into Supabase\n`);

    // Step 4: Log summary
    console.log('✅ Synthetic data generation complete!');
    console.log('📊 Cohort Distribution:');
    console.log(`   - Total payments: ${totalInserted}`);
    console.log(`   - Standard failure codes: ${totalInserted - ambiguousCount - 1}`);
    console.log(`   - AI Advisor test cohort: ${ambiguousCount}`);
    console.log(`   - Malformed error validation record: 1`);

    return payments;
  } catch (error) {
    console.error('❌ Error generating synthetic data:', error.message);
    process.exit(1);
  }
}

// Run script if executed directly
if (require.main === module) {
  generateSyntheticData();
}

module.exports = {
  generatePayments,
  generateSyntheticData
};
