import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAnalyticsData() {
    console.log('🌱 Seeding Sample Data for Analytics...\n');

    // 1. Seed Workflow (Parent)
    console.log('1️⃣ Seeding Recruitment Workflow...');
    const { data: workflow, error: wfError } = await supabase
        .from('recruitment_workflows')
        .upsert({
            name: 'Standard Hiring Pipeline',
            description: 'Default pipeline for general hiring',
            is_active: true,
            is_default: true
        }, { onConflict: 'name' })
        .select()
        .single();

    if (wfError) {
        console.error('❌ Error seeding workflow:', wfError.message);
        return;
    }
    console.log(`✅ Workflow ID: ${workflow.id}`);

    // 2. Seed Workflow Stages
    console.log('\n2️⃣ Seeding Workflow Stages...');
    const stages = [
        { name: 'Applied', stage_type: 'applied', stage_order: 1, is_system_stage: true, workflow_id: workflow.id },
        { name: 'Screening', stage_type: 'screening', stage_order: 2, is_system_stage: false, workflow_id: workflow.id },
        { name: 'Interview', stage_type: 'interview', stage_order: 3, is_system_stage: false, workflow_id: workflow.id },
        { name: 'Offer', stage_type: 'offer', stage_order: 4, is_system_stage: false, workflow_id: workflow.id },
        { name: 'Hired', stage_type: 'hired', stage_order: 5, is_system_stage: true, workflow_id: workflow.id },
        { name: 'Rejected', stage_type: 'rejected', stage_order: 6, is_system_stage: true, workflow_id: workflow.id }
    ];

    // We need to upsert stages carefully. Since we don't have a unique constraint on name alone (it's per workflow),
    // we might just insert if they don't exist, or delete and recreate for this seed script.
    // For simplicity, let's try to select existing ones first.

    const { data: existingStages } = await supabase
        .from('workflow_stages')
        .select('*')
        .eq('workflow_id', workflow.id);

    let finalStages = existingStages || [];

    if (finalStages.length === 0) {
        const { data: createdStages, error: stageError } = await supabase
            .from('workflow_stages')
            .insert(stages)
            .select();

        if (stageError) console.error('❌ Error seeding stages:', stageError.message);
        else {
            console.log(`✅ Seeded ${createdStages.length} stages`);
            finalStages = createdStages;
        }
    } else {
        console.log(`ℹ️ Found ${finalStages.length} existing stages`);
    }

    // 3. Seed Employees
    console.log('\n3️⃣ Seeding Employees...');
    const employees = [
        {
            first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com',
            role: 'hr_manager', department: 'HR', status: 'active',
            date_hired: '2023-01-15', employee_number: 'EMP001', position: 'HR Manager'
        },
        {
            first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com',
            role: 'carer', department: 'Care', status: 'active',
            date_hired: '2023-03-10', employee_number: 'EMP002', position: 'Senior Carer'
        },
        {
            first_name: 'Mike', last_name: 'Johnson', email: 'mike.j@example.com',
            role: 'staff', department: 'Operations', status: 'active',
            date_hired: '2023-06-01', employee_number: 'EMP003', position: 'Ops Staff'
        }
    ];

    const { data: createdEmployees, error: empError } = await supabase
        .from('employees')
        .upsert(employees, { onConflict: 'email' })
        .select();

    if (empError) console.error('❌ Error seeding employees:', empError.message);
    else console.log(`✅ Seeded ${createdEmployees.length} employees`);

    // 4. Seed Applications (if stages exist)
    if (finalStages.length > 0) {
        console.log('\n4️⃣ Seeding Applications...');

        // Helper to get stage ID by name
        const getStageId = (name) => finalStages.find(s => s.name === name)?.id;

        const applications = [
            {
                first_name: 'Alice', last_name: 'Brown', email: 'alice@test.com',
                stage_id: getStageId('Applied'),
                status: 'pending'
            },
            {
                first_name: 'Bob', last_name: 'Wilson', email: 'bob@test.com',
                stage_id: getStageId('Interview'),
                status: 'in_progress'
            },
            {
                first_name: 'Charlie', last_name: 'Davis', email: 'charlie@test.com',
                stage_id: getStageId('Hired'),
                status: 'hired'
            }
        ];

        // Filter out any where stage_id is missing (in case stage wasn't found)
        const validApps = applications.filter(a => a.stage_id);

        const { error: appError } = await supabase
            .from('applications')
            .upsert(validApps, { onConflict: 'email' });

        if (appError) console.error('❌ Error seeding applications:', appError.message);
        else console.log(`✅ Seeded ${validApps.length} applications`);
    }

    // 5. Seed Leave Requests (if employees exist)
    if (createdEmployees && createdEmployees.length > 0) {
        console.log('\n5️⃣ Seeding Leave Requests...');
        const leaveRequests = [
            {
                employee_id: createdEmployees[0].id,
                leave_type: 'annual',
                start_date: '2024-01-10',
                end_date: '2024-01-15',
                status: 'approved',
                total_days: 5
            },
            {
                employee_id: createdEmployees[1].id,
                leave_type: 'sick',
                start_date: '2024-02-01',
                end_date: '2024-02-02',
                status: 'approved',
                total_days: 2
            },
            {
                employee_id: createdEmployees[1].id,
                leave_type: 'annual',
                start_date: '2024-03-20',
                end_date: '2024-03-25',
                status: 'pending',
                total_days: 5
            }
        ];

        const { error: leaveError } = await supabase
            .from('leave_requests')
            .insert(leaveRequests);

        if (leaveError) console.error('❌ Error seeding leave requests:', leaveError.message);
        else console.log(`✅ Seeded ${leaveRequests.length} leave requests`);
    }

    console.log('\n✨ Database seeding complete!');
}

seedAnalyticsData().catch(console.error);
