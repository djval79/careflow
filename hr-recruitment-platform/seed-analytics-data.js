import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAnalyticsData() {
    console.log('🌱 Seeding Sample Data for Analytics...\n');

    // 1. Seed Workflow Stages
    console.log('1️⃣ Seeding Workflow Stages...');
    const stages = [
        { stage_name: 'Applied', stage_order: 1, is_active: true },
        { stage_name: 'Screening', stage_order: 2, is_active: true },
        { stage_name: 'Interview', stage_order: 3, is_active: true },
        { stage_name: 'Offer', stage_order: 4, is_active: true },
        { stage_name: 'Hired', stage_order: 5, is_active: true },
        { stage_name: 'Rejected', stage_order: 6, is_active: true }
    ];

    const { data: createdStages, error: stageError } = await supabase
        .from('workflow_stages')
        .upsert(stages, { onConflict: 'stage_name' })
        .select();

    if (stageError) console.error('❌ Error seeding stages:', stageError.message);
    else console.log(`✅ Seeded ${createdStages.length} stages`);

    // 2. Seed Employees
    console.log('\n2️⃣ Seeding Employees...');
    const employees = [
        {
            first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com',
            role: 'hr_manager', department: 'HR', status: 'active',
            start_date: '2023-01-15'
        },
        {
            first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com',
            role: 'carer', department: 'Care', status: 'active',
            start_date: '2023-03-10'
        },
        {
            first_name: 'Mike', last_name: 'Johnson', email: 'mike.j@example.com',
            role: 'staff', department: 'Operations', status: 'active',
            start_date: '2023-06-01'
        }
    ];

    const { data: createdEmployees, error: empError } = await supabase
        .from('employees')
        .upsert(employees, { onConflict: 'email' })
        .select();

    if (empError) console.error('❌ Error seeding employees:', empError.message);
    else console.log(`✅ Seeded ${createdEmployees.length} employees`);

    // 3. Seed Applications (if stages exist)
    if (createdStages && createdStages.length > 0) {
        console.log('\n3️⃣ Seeding Applications...');
        const applications = [
            {
                first_name: 'Alice', last_name: 'Brown', email: 'alice@test.com',
                stage_id: createdStages.find(s => s.stage_name === 'Applied').id,
                status: 'pending'
            },
            {
                first_name: 'Bob', last_name: 'Wilson', email: 'bob@test.com',
                stage_id: createdStages.find(s => s.stage_name === 'Interview').id,
                status: 'in_progress'
            },
            {
                first_name: 'Charlie', last_name: 'Davis', email: 'charlie@test.com',
                stage_id: createdStages.find(s => s.stage_name === 'Hired').id,
                status: 'hired'
            }
        ];

        const { error: appError } = await supabase
            .from('applications')
            .upsert(applications, { onConflict: 'email' });

        if (appError) console.error('❌ Error seeding applications:', appError.message);
        else console.log(`✅ Seeded ${applications.length} applications`);
    }

    // 4. Seed Leave Requests (if employees exist)
    if (createdEmployees && createdEmployees.length > 0) {
        console.log('\n4️⃣ Seeding Leave Requests...');
        const leaveRequests = [
            {
                employee_id: createdEmployees[0].id,
                leave_type: 'annual',
                start_date: '2024-01-10',
                end_date: '2024-01-15',
                status: 'approved'
            },
            {
                employee_id: createdEmployees[1].id,
                leave_type: 'sick',
                start_date: '2024-02-01',
                end_date: '2024-02-02',
                status: 'approved'
            },
            {
                employee_id: createdEmployees[1].id,
                leave_type: 'annual',
                start_date: '2024-03-20',
                end_date: '2024-03-25',
                status: 'pending'
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
