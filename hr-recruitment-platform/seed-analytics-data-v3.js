import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niikshfoecitimepiifo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5paWtzaGZvZWNpdGltZXBpaWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNTIyMTUsImV4cCI6MjA3ODYyODIxNX0.4KzLoUez4xQ1_h-vpx1dOa1PrzvAbi65UC4Mf7JQAfc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAnalyticsData() {
    console.log('🌱 Seeding Sample Data for Analytics...\n');

    // 1. Seed Workflow (Parent)
    console.log('1️⃣ Seeding Recruitment Workflow...');

    // Check if exists
    let { data: workflow } = await supabase
        .from('recruitment_workflows')
        .select('*')
        .eq('name', 'Standard Hiring Pipeline')
        .single();

    if (!workflow) {
        const { data: newWorkflow, error: wfError } = await supabase
            .from('recruitment_workflows')
            .insert({
                name: 'Standard Hiring Pipeline',
                description: 'Default pipeline for general hiring',
                is_active: true,
                is_default: true
            })
            .select()
            .single();

        if (wfError) {
            console.error('❌ Error seeding workflow:', wfError.message);
            return;
        }
        workflow = newWorkflow;
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

    // Check each employee before inserting
    let createdEmployees = [];
    for (const emp of employees) {
        const { data: existingEmp } = await supabase
            .from('employees')
            .select('*')
            .eq('email', emp.email)
            .single();

        if (existingEmp) {
            createdEmployees.push(existingEmp);
        } else {
            const { data: newEmp, error } = await supabase
                .from('employees')
                .insert(emp)
                .select()
                .single();

            if (error) console.error(`❌ Error creating employee ${emp.email}:`, error.message);
            else createdEmployees.push(newEmp);
        }
    }
    console.log(`✅ Processed ${createdEmployees.length} employees`);

    // 4. Seed Applications
    if (finalStages.length > 0) {
        console.log('\n4️⃣ Seeding Applications...');

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

        const validApps = applications.filter(a => a.stage_id);

        for (const app of validApps) {
            const { data: existingApp } = await supabase
                .from('applications')
                .select('*')
                .eq('email', app.email)
                .single();

            if (!existingApp) {
                const { error } = await supabase.from('applications').insert(app);
                if (error) console.error(`❌ Error creating application ${app.email}:`, error.message);
            }
        }
        console.log(`✅ Processed applications`);
    }

    // 5. Seed Leave Requests
    if (createdEmployees.length > 0) {
        console.log('\n5️⃣ Seeding Leave Requests...');
        // Only insert if table is empty to avoid duplicates for now
        const { count } = await supabase.from('leave_requests').select('*', { count: 'exact', head: true });

        if (count === 0) {
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
        } else {
            console.log('ℹ️ Leave requests already exist');
        }
    }

    console.log('\n✨ Database seeding complete!');
}

seedAnalyticsData().catch(console.error);
