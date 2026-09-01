require('dotenv').config();
const supabase = require('../services/supabaseClient.js');

/**
 * Generate and seed synthetic payment data into Supabase
 * Clears existing tables and inserts fresh test data with complete failure codes & context.
 */
async function generateSyntheticData() {
  try {
    console.log('🔄 Starting synthetic data generation...\n');

    // Step 1: Clear existing tables (fresh slate per seed run)
    console.log('📋 Clearing existing data...');
    
    // Delete recovery history first (foreign key dependency)
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
    console.log('🎲 Generating synthetic payment data...');
    const payments = generatePayments();
    console.log(`  ✓ Generated ${payments.length} payment records\n`);

    // Step 3: Insert payments into database
    console.log('💾 Inserting payments into database...');
    const { data: insertedPayments, error: insertError } = await supabase
      .from('payments')
      .insert(payments)
      .select();

    if (insertError) {
      throw new Error(`Failed to insert payments: ${insertError.message}`);
    }

    console.log(`  ✓ Successfully inserted ${insertedPayments.length} payments\n`);

    // Step 4: Log summary
    console.log('✅ Synthetic data generation complete!');
    console.log('📊 Summary:');
    console.log(`   - Total payments: ${insertedPayments.length}`);
    console.log(`   - Recovered: ${insertedPayments.filter(p => p.status === 'recovered').length}`);
    console.log(`   - Pending: ${insertedPayments.filter(p => p.status === 'pending').length}`);
    console.log(`   - Partial: ${insertedPayments.filter(p => p.status === 'partial').length}`);

    return insertedPayments;
  } catch (error) {
    console.error('❌ Error generating synthetic data:', error.message);
    process.exit(1);
  }
}

/**
 * Generate synthetic payment records with rich failure codes, reasons, and realistic lifecycle states
 * @returns {Array} Array of payment objects
 */
function generatePayments() {
  const seedScenarios = [
    {
      customer_name: "Rahul Mehta",
      customer_email: "rahul.mehta@example.com",
      customer_phone: "+919876543210",
      subscription_id: "sub_rah_118",
      amount: 14999,
      failure_code: "BAD_REQUEST_INSUFFICIENT_FUNDS",
      failure_reason: "Card balance insufficient for recurring debit",
      attempt_number: 1,
      status: "pending",
      diagnosis: null,
      diagnosis_confidence: null,
      recovery_action: null
    },
    {
      customer_name: "Aakash Sharma",
      customer_email: "aakash.sharma@example.com",
      customer_phone: "+919876543211",
      subscription_id: "sub_avi_224",
      amount: 3249,
      failure_code: "CARD_EXPIRED",
      failure_reason: "Card validity expired on 08/26",
      attempt_number: 1,
      status: "pending",
      diagnosis: null,
      diagnosis_confidence: null,
      recovery_action: null
    },
    {
      customer_name: "Neha Patel",
      customer_email: "neha.patel@example.com",
      customer_phone: "+919876543212",
      subscription_id: "sub_npr_087",
      amount: 49999,
      failure_code: "DO_NOT_HONOUR",
      failure_reason: "Transaction declined by card issuer risk policy",
      attempt_number: 1,
      status: "pending",
      diagnosis: null,
      diagnosis_confidence: null,
      recovery_action: null
    },
    {
      customer_name: "Siddharth Nair",
      customer_email: "siddharth.nair@example.com",
      customer_phone: "+919876543213",
      subscription_id: "sub_san_331",
      amount: 2499,
      failure_code: "GATEWAY_ERROR",
      failure_reason: "Issuer bank timed out during authorization",
      attempt_number: 2,
      status: "recovered",
      diagnosis: "bank_technical_error",
      diagnosis_confidence: 0.90,
      recovery_action: "immediate_retry"
    },
    {
      customer_name: "Vikram Kumar",
      customer_email: "vikram.kumar@example.com",
      customer_phone: "+919876543214",
      subscription_id: "sub_vkr_195",
      amount: 1174,
      failure_code: "CARD_BLOCKED",
      failure_reason: "Card reported hotlisted or blocked by issuer",
      attempt_number: 1,
      status: "pending",
      diagnosis: null,
      diagnosis_confidence: null,
      recovery_action: null
    },
    {
      customer_name: "Deepa Gupta",
      customer_email: "deepa.gupta@example.com",
      customer_phone: "+919876543215",
      subscription_id: "sub_dgr_412",
      amount: 14999,
      failure_code: "INSUFFICIENT_FUNDS",
      failure_reason: "Account balance insufficient",
      attempt_number: 2,
      status: "recovered",
      diagnosis: "insufficient_funds",
      diagnosis_confidence: 0.95,
      recovery_action: "schedule_smart_retry"
    },
    {
      customer_name: "Pooja Singhania",
      customer_email: "pooja.s@example.com",
      customer_phone: "+919876543216",
      subscription_id: "sub_psin_503",
      amount: 8749,
      failure_code: "AUTH_FAILED",
      failure_reason: "3D Secure OTP verification timeout",
      attempt_number: 1,
      status: "pending",
      diagnosis: null,
      diagnosis_confidence: null,
      recovery_action: null
    },
    {
      customer_name: "Anand Das",
      customer_email: "anand.das@example.com",
      customer_phone: "+919876543217",
      subscription_id: "sub_akd_617",
      amount: 2499,
      failure_code: "NETWORK_TIMEOUT",
      failure_reason: "Network gateway connection timeout during processing",
      attempt_number: 2,
      status: "recovered",
      diagnosis: "bank_technical_error",
      diagnosis_confidence: 0.90,
      recovery_action: "immediate_retry"
    },
    {
      customer_name: "Kavita Rao",
      customer_email: "kavita.rao@example.com",
      customer_phone: "+919876543218",
      subscription_id: "sub_kav_709",
      amount: 6500,
      failure_code: "BAD_REQUEST_PAYMENT_CARD_EXPIRED",
      failure_reason: "Card expiration date passed",
      attempt_number: 1,
      status: "pending",
      diagnosis: null,
      diagnosis_confidence: null,
      recovery_action: null
    },
    {
      customer_name: "Tarun Verma",
      customer_email: "tarun.verma@example.com",
      customer_phone: "+919876543219",
      subscription_id: "sub_tar_882",
      amount: 18999,
      failure_code: "RISK_DECLINE",
      failure_reason: "High risk score flagged by merchant safety checks",
      attempt_number: 1,
      status: "pending",
      diagnosis: null,
      diagnosis_confidence: null,
      recovery_action: null
    }
  ];

  const now = Date.now();
  const payments = seedScenarios.map((scenario, index) => ({
    id: `pay_${now}_${index + 1}`,
    subscription_id: scenario.subscription_id,
    customer_name: scenario.customer_name,
    customer_email: scenario.customer_email,
    customer_phone: scenario.customer_phone,
    amount: scenario.amount,
    currency: "INR",
    failure_code: scenario.failure_code,
    failure_reason: scenario.failure_reason,
    attempt_number: scenario.attempt_number,
    status: scenario.status,
    diagnosis: scenario.diagnosis,
    diagnosis_confidence: scenario.diagnosis_confidence,
    recovery_action: scenario.recovery_action,
    created_at: new Date(now - (index + 1) * 3600 * 1000 * 24).toISOString()
  }));

  // Add the deliberate malformed record (missing amount field)
  // This is REQUIRED and should NOT be removed during migration
  payments.push({
    id: `pay_${now}_malformed`,
    subscription_id: "sub_malformed_999",
    customer_name: "Malformed Payload Test",
    customer_email: "malformed@example.com",
    customer_phone: "+919000000000",
    amount: null, // intentionally null
    currency: "INR",
    failure_code: "MALFORMED_EVENT",
    failure_reason: "Webhook payload missing required amount field",
    attempt_number: 1,
    status: "pending",
    diagnosis: null,
    diagnosis_confidence: null,
    recovery_action: null,
    created_at: new Date().toISOString()
  });

  return payments;
}

// Run the script
generateSyntheticData();
