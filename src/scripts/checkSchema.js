require('dotenv').config();
const supabase = require('../services/supabaseClient.js');

async function checkSchema() {
  try {
    console.log('Checking database schema...\n');
    
    // Try to get one row to see what columns exist
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error.message);
    } else if (data && data.length > 0) {
      console.log('Columns in payments table:');
      console.log(Object.keys(data[0]));
      console.log('\nSample row:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('Table is empty. Checking table info via info schema...');
      
      // Try to get column information
      const { data: columns, error: colError } = await supabase
        .rpc('get_table_columns', { table_name: 'payments' })
        .catch(e => ({ data: null, error: e }));
      
      if (colError) {
        console.log('Could not query schema directly. Table might be empty.');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();
