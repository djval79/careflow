import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSyncEmployee() {
    console.log('🧪 Testing Sync Employee Function...\n');

    // Step 1: Verify tables exist
    console.log('1️⃣ Verifying database tables...');
    try {
        const { data: failedSyncs, error: failedSyncsError } = await supabase
            .from('failed_syncs')
            .select('*')
            .limit(1);

        if (failedSyncsError) {
            console.log('❌ failed_syncs table:', failedSyncsError.message);
        } else {
            console.log('✅ failed_syncs table exists');
        }

        const { data: roleMappings, error: roleMappingsError } = await supabase
            .from('role_mappings')
            .select('*')
            .limit(1);

        if (roleMappingsError) {
            console.log('❌ role_mappings table:', roleMappingsError.message);
        } else {
            console.log('✅ role_mappings table exists');
        }
    } catch (error) {
        console.log('❌ Error checking tables:', error.message);
    }

    // Step 2: Test sync_employee function with sample data
    console.log('\n2️⃣ Testing sync_employee function...');
    try {
        const testEmployee = {
            employee_id: 'TEST-001',
            first_name: 'Test',
            last_name: 'Employee',
            email: 'test.employee@ringsteadcare.com',
            role: 'carer',
            department: 'Care',
            phone: '+44 1234 567890',
            start_date: new Date().toISOString().split('T')[0]
        };

        const { data, error } = await supabase.functions.invoke('sync_employee', {
            body: testEmployee
        });

        if (error) {
            console.log('❌ Function invocation error:', error.message);
        } else {
            console.log('✅ Function invoked successfully');
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.log('❌ Error invoking function:', error.message);
    }

    // Step 3: Check if any failed syncs were recorded
    console.log('\n3️⃣ Checking failed syncs...');
    try {
        const { data: failedSyncs, error } = await supabase
            .from('failed_syncs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.log('❌ Error fetching failed syncs:', error.message);
        } else if (failedSyncs && failedSyncs.length > 0) {
            console.log(`📊 Found ${failedSyncs.length} failed sync(s):`);
            failedSyncs.forEach((sync, index) => {
                console.log(`\n   Sync #${index + 1}:`);
                console.log(`   - Employee ID: ${sync.employee_id}`);
                console.log(`   - Error: ${sync.error_message}`);
                console.log(`   - Retry Count: ${sync.retry_count}`);
                console.log(`   - Status: ${sync.status}`);
            });
        } else {
            console.log('✅ No failed syncs found');
        }
    } catch (error) {
        console.log('❌ Error checking failed syncs:', error.message);
    }

    // Step 4: Test retry-failed-syncs function
    console.log('\n4️⃣ Testing retry-failed-syncs function...');
    try {
        const { data, error } = await supabase.functions.invoke('retry-failed-syncs');

        if (error) {
            console.log('❌ Function invocation error:', error.message);
        } else {
            console.log('✅ Retry function invoked successfully');
            console.log('Response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.log('❌ Error invoking retry function:', error.message);
    }

    console.log('\n✨ Test completed!\n');
}

testSyncEmployee().catch(console.error);
