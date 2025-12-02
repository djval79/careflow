import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function configureLeaveRules() {
    console.log('⚙️ Configuring Leave Approval Rules...\n');

    // Step 1: Check existing rules
    console.log('1️⃣ Checking for existing rules...');
    const { data: existingRules, error: checkError } = await supabase
        .from('leave_approval_rules')
        .select('*');

    if (checkError) {
        console.error('❌ Error checking rules:', checkError.message);
        return;
    }

    if (existingRules && existingRules.length > 0) {
        console.log(`✅ Found ${existingRules.length} existing rules.`);
        existingRules.forEach(rule => {
            console.log(`   - ${rule.name} (${rule.leave_type}): ${rule.action}`);
        });
        return;
    }

    console.log('ℹ️ No rules found. Inserting default rules...');

    // Step 2: Insert default rules
    const defaultRules = [
        {
            name: 'Auto-approve Short Sick Leave',
            description: 'Automatically approve sick leave requests of less than 3 days',
            leave_type: 'sick',
            min_duration_days: 0,
            max_duration_days: 2,
            requires_manager_approval: false,
            auto_approve: true,
            is_active: true,
            priority: 10
        },
        {
            name: 'Manager Review for Long Sick Leave',
            description: 'Require manager approval for sick leave of 3 days or more',
            leave_type: 'sick',
            min_duration_days: 3,
            max_duration_days: 365,
            requires_manager_approval: true,
            auto_approve: false,
            is_active: true,
            priority: 20
        },
        {
            name: 'Auto-approve Annual Leave (Advance Notice)',
            description: 'Automatically approve annual leave if requested 14 days in advance',
            leave_type: 'annual',
            min_days_notice: 14,
            max_duration_days: 10,
            requires_manager_approval: false,
            auto_approve: true,
            is_active: true,
            priority: 10
        },
        {
            name: 'Standard Annual Leave Review',
            description: 'Standard review for annual leave',
            leave_type: 'annual',
            min_duration_days: 0,
            max_duration_days: 30,
            requires_manager_approval: true,
            auto_approve: false,
            is_active: true,
            priority: 50
        }
    ];

    const { data: insertedRules, error: insertError } = await supabase
        .from('leave_approval_rules')
        .insert(defaultRules)
        .select();

    if (insertError) {
        console.error('❌ Error inserting default rules:', insertError.message);
    } else {
        console.log(`✅ Successfully inserted ${insertedRules.length} default rules!`);
        insertedRules.forEach(rule => {
            console.log(`   - [NEW] ${rule.name}`);
        });
    }
}

configureLeaveRules().catch(console.error);
