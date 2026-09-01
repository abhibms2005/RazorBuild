require('dotenv').config();
const dataStore = require('../services/dataStore.js');
const { processBatch } = require('../services/recoveryEngine.js');

/**
 * Run the recovery batch process
 * Loads records, processes them through the recovery engine, and writes results back
 */
async function runRecoveryBatch() {
  try {
    console.log('🚀 Starting recovery batch process...\n');

    // Step 1: Load all payments from database
    console.log('📥 Loading payments from database...');
    const payments = await dataStore.loadPayments();
    console.log(`  ✓ Loaded ${payments.length} payments\n`);

    if (payments.length === 0) {
      console.log('⚠️  No payments found. Run "npm run seed" to generate test data.\n');
      return;
    }

    // Step 2: Reset audit log for fresh batch run
    console.log('🗑️  Clearing audit log for fresh batch...');
    await dataStore.resetAudit();
    console.log('  ✓ Audit log cleared\n');

    // Step 3: Process batch through recovery engine
    console.log('⚙️  Processing batch through recovery engine...');
    const batchSummary = await processBatch(payments, {
      appendAudit: dataStore.appendAudit
    });
    console.log('  ✓ Batch processing complete\n');

    // Step 4: Write results back to database
    console.log('💾 Writing results back to database...');
    let successfulWrites = 0;
    let failedWrites = 0;

    for (const payment of payments) {
      try {
        await dataStore.upsertPayment(payment);
        successfulWrites++;
      } catch (error) {
        failedWrites++;
        console.error(`  ❌ Failed to upsert payment ${payment.id}:`, error.message);
      }
    }

    console.log(`  ✓ Wrote ${successfulWrites} payment updates to database`);
    if (failedWrites > 0) {
      console.log(`  ⚠️  ${failedWrites} payment updates failed`);
    }
    console.log();

    // Step 5: Print summary metrics
    console.log('📊 Batch Processing Summary:');
    console.log(`   Total payments processed: ${batchSummary.total}`);
    console.log(`   Successful: ${batchSummary.successful}`);
    console.log(`   Failed: ${batchSummary.failed}`);
    console.log(`   Malformed records skipped: ${batchSummary.malformed}`);
    console.log(`   Recovery actions initiated: ${batchSummary.recovered}`);

    if (batchSummary.errors.length > 0) {
      console.log('\n   Errors encountered:');
      batchSummary.errors.forEach(err => {
        console.log(`   - Payment ${err.paymentId}: ${err.error}`);
      });
    }

    console.log('\n✅ Recovery batch process completed!');

    // Step 6: Load and display audit log
    console.log('\n📋 Recent audit log entries (last 5):');
    const auditLog = await dataStore.loadAudit();
    auditLog.slice(-5).forEach(entry => {
      console.log(
        `   [${entry.ts}] [${entry.stage || 'info'}] ${entry.action}: ${entry.explanation || '—'}`
      );
    });

    console.log(`\n📝 Total audit log entries: ${auditLog.length}\n`);

  } catch (error) {
    console.error('❌ Error during batch processing:', error.message);
    process.exit(1);
  }
}

// Run the script
runRecoveryBatch();
