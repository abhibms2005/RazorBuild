require('dotenv').config();
const dataStore = require('../services/dataStore.js');
const { processBatch } = require('../services/recoveryEngine.js');
const { simulateGatewayConfirmations } = require('../services/simulatedGateway.js');

/**
 * Run the full 7-stage recovery batch process
 * 
 * Flow:
 * 1. Load payment cohort from Supabase
 * 2. Reset audit log for clean trace
 * 3. Execute recovery pipeline (Stages 1-6: detect -> diagnose -> ai_consult -> recommend -> policy_check -> execute)
 * 4. Upsert pending/partial payments
 * 5. Trigger Simulated Gateway Confirmation (Stage 7: HMAC-signed webhooks)
 * 6. Display verified results & audit trail
 */
async function runRecoveryBatch() {
  try {
    console.log('🚀 Starting governed 7-stage recovery batch process...\n');

    // Step 1: Load all payments from database
    console.log('📥 Loading payments from database...');
    const payments = await dataStore.loadPayments();
    console.log(`  ✓ Loaded ${payments.length} payments\n`);

    if (payments.length === 0) {
      console.log('⚠️  No payments found. Run "npm run seed" to generate test data.\n');
      return;
    }

    // Step 2: Reset audit log for fresh batch run
    console.log('🗑️  Clearing audit log for fresh batch run...');
    await dataStore.resetAudit();
    console.log('  ✓ Audit log cleared\n');

    // Step 3: Process batch through recovery engine (Stages 1-6)
    console.log('⚙️  Processing batch through recovery engine (governed policy rails & AI advisor)...');
    const batchSummary = await processBatch(payments, {
      appendAudit: dataStore.appendAudit,
      appendAudits: dataStore.appendAudits
    });
    console.log('  ✓ Stages 1–6 execution complete\n');

    // Step 4: Write intermediate results back to database
    console.log('💾 Writing executed recovery directives to database...');
    try {
      await dataStore.upsertPayments(payments);
      console.log(`  ✓ Successfully updated payment records in Supabase\n`);
    } catch (upsertErr) {
      console.error('  ❌ Failed to batch upsert payments:', upsertErr.message);
    }

    // Step 5: Trigger Stage 7 Simulated Gateway Confirmations via HMAC Webhooks
    console.log('📡 Triggering Simulated Gateway confirmation loop (Stage 7 HMAC Webhooks)...');
    const pendingPayments = payments.filter(p => p.status === 'pending_confirmation');
    
    // Use direct confirmation fallback in case HTTP server is not currently listening
    const gatewayResults = await simulateGatewayConfirmations(pendingPayments, {
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

    console.log(`  ✓ Evaluated ${gatewayResults.evaluated} gateway responses: ${gatewayResults.confirmed} confirmed recovered, ${gatewayResults.failed} retry failures\n`);

    // Step 6: Reload updated payments from database to display final metrics
    const finalPayments = await dataStore.loadPayments();
    const recoveredCount = finalPayments.filter(p => p.status === 'recovered').length;
    const awaitingCount = finalPayments.filter(p => p.status === 'pending' || p.status === 'pending_confirmation').length;
    const reviewCount = finalPayments.filter(p => p.status === 'partial').length;
    const totalAmount = finalPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const recoveredAmount = finalPayments.filter(p => p.status === 'recovered').reduce((acc, p) => acc + (p.amount || 0), 0);
    const recoveryRate = totalAmount > 0 ? ((recoveredAmount / totalAmount) * 100).toFixed(1) : '0.0';

    console.log('====================================================');
    console.log('📊 GOVERNED RECOVERY BATCH RESULTS:');
    console.log('====================================================');
    console.log(`   Total Payments Processed:   ${batchSummary.total}`);
    console.log(`   AI Advisor Consultations:   ${batchSummary.ai_consult_invoked} (Ambiguous/Low-Confidence)`);
    console.log(`   Policy Blocked / Escalated: ${batchSummary.policy_blocked}`);
    console.log(`   Confirmed Recovered:        ${recoveredCount} (₹${recoveredAmount.toLocaleString('en-IN')})`);
    console.log(`   Awaiting Link / Retry:      ${awaitingCount}`);
    console.log(`   Manual Review Queue:        ${reviewCount}`);
    console.log(`   Malformed Skipped:          ${batchSummary.malformed}`);
    console.log(`   Overall Recovery Rate:      ${recoveryRate}%`);
    console.log('====================================================\n');

    // Step 7: Load and display recent audit log entries
    console.log('📋 Recent Audit Log Entries (Last 7 Lifecycle Events):');
    const auditLog = await dataStore.loadAudit();
    auditLog.slice(-7).forEach(entry => {
      console.log(
        `   [${entry.ts.slice(11, 19)}] [${entry.stage || 'info'}] ${entry.action}: ${entry.explanation || '—'}`
      );
    });

    console.log(`\n📝 Total Immutable Audit Log Entries: ${auditLog.length}\n`);

  } catch (error) {
    console.error('❌ Error during batch processing:', error.message);
    process.exit(1);
  }
}

// Run script if executed directly
if (require.main === module) {
  runRecoveryBatch();
}

module.exports = {
  runRecoveryBatch
};
