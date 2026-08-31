import 'dotenv/config';
import supabase from '../services/supabaseClient.js';

/**
 * Generate and seed synthetic payment data into Supabase
 * Clears existing tables and inserts fresh test data
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
      throw new Error(`Failed to delete recovery_history: ${deleteHistoryError.message}`);
    }
    console.log('  ✓ Cleared recovery_history');

    // Delete audit logs
    const { error: deleteAuditError } = await supabase
      .from('audit_log')
      .delete()
      .neq('id', 0);
    
    if (deleteAuditError && deleteAuditError.code !== 'PGRST116') {
      throw new Error(`Failed to delete audit_log: ${deleteAuditError.message}`);
    }
    console.log('  ✓ Cleared audit_log');

    // Delete payments
    const { error: deletePaymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', 0);
    
    if (deletePaymentsError && deletePaymentsError.code !== 'PGRST116') {
      throw new Error(`Failed to delete payments: ${deletePaymentsError.message}`);
    }
    console.log('  ✓ Cleared payments\n');

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
    console.log(`   - Pending payments: ${insertedPayments.filter(p => p.status === 'pending').length}`);
    console.log(`   - Partially recovered: ${insertedPayments.filter(p => p.status === 'partial').length}`);
    console.log(`   - Fully recovered: ${insertedPayments.filter(p => p.status === 'recovered').length}`);
    console.log(`   - Malformed records: ${insertedPayments.filter(p => p.amount === undefined || p.amount === null).length}`);

    return insertedPayments;
  } catch (error) {
    console.error('❌ Error generating synthetic data:', error.message);
    process.exit(1);
  }
}

/**
 * Generate synthetic payment records
 * Includes the deliberate malformed record (missing amount field)
 * @returns {Array} Array of payment objects
 */
function generatePayments() {
  const statuses = ['pending', 'partial', 'recovered'];
  const payments = [];

  // Generate 10 well-formed payment records
  for (let i = 1; i <= 10; i++) {
    const amount = Math.floor(Math.random() * 50000) + 1000; // 1000 to 51000
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    payments.push({
      id: `pay_${Date.now()}_${i}`,
      amount,
      status,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  // Add the deliberate malformed record (missing amount field)
  // This is REQUIRED and should NOT be removed during migration
  payments.push({
    id: `pay_${Date.now()}_malformed`,
    // amount is intentionally missing
    status: 'pending',
    created_at: new Date().toISOString()
  });

  return payments;
}

// Run the script
generateSyntheticData();
