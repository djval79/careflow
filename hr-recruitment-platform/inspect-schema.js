import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('🔍 Inspecting Table Schema...\n');

    // We can't query information_schema directly with supabase-js client usually,
    // but we can try to insert a dummy record and catch the error to see valid columns,
    // OR we can just try to select a single record and see the keys.

    const tables = ['workflow_stages', 'employees'];

    for (const table of tables) {
        console.log(`\n📋 Table: ${table}`);
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);

        if (error) {
            console.log(`❌ Error: ${error.message}`);
        } else if (data && data.length > 0) {
            console.log('✅ Found record. Keys:', Object.keys(data[0]).join(', '));
        } else {
            console.log('⚠️  Table is empty. Cannot infer schema from data.');
            // Try to insert an empty object to get a schema error? 
            // Or just try to select specific columns I suspect exist.
        }
    }
}

inspectSchema().catch(console.error);
