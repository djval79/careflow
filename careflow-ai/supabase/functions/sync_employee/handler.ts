import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PayloadSchema } from "./schemas.ts";

const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

let roleMappingsCache: Record<string, string> | null = null;
let cacheExpiry: number | null = null;

async function getRoleMappings(): Promise<Record<string, string>> {
    if (roleMappingsCache && cacheExpiry && Date.now() < cacheExpiry) {
        return roleMappingsCache;
    }

    const { data, error } = await supabaseAdmin
        .from("role_mappings")
        .select("novumflow_role, careflow_role");

    if (error) {
        console.error("Error fetching role mappings:", error);
        // Return a default map in case of error
        return {
            'Recruiter': 'Manager',
            'HR Manager': 'Manager',
            'Care Worker': 'Carer',
            'Senior Care Worker': 'Senior Carer',
            'Nurse': 'Nurse',
            'Admin': 'Manager'
        };
    }

    const mappings: Record<string, string> = {};
    for (const row of data) {
        mappings[row.novumflow_role] = row.careflow_role;
    }

    roleMappingsCache = mappings;
    cacheExpiry = Date.now() + 5 * 60 * 1000; // Cache for 5 minutes

    return mappings;
}


// Helper to map NovumFlow roles to CareFlow roles
async function mapRole(novumRole: string): Promise<string> {
    const roleMap = await getRoleMappings();
    return roleMap[novumRole] || 'Carer'; // Default to Carer
}

export async function handleSync(payload: any): Promise<any> {
    const validation = PayloadSchema.safeParse(payload);
    if (!validation.success) {
        throw new Error(`Invalid payload: ${validation.error.message}`);
    }

    const { action, employee, tenant_id } = validation.data;

    console.log(`Received sync request: ${action} for employee ${employee.id} in tenant ${tenant_id}`);

    if (action === "employee.created" || action === "employee.updated") {
        const nameParts = employee.full_name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        const careFlowEmployee = {
            tenant_id: tenant_id,
            novumflow_employee_id: employee.id,
            first_name: firstName,
            last_name: lastName,
            email: employee.email,
            phone: employee.phone,
            role: await mapRole(employee.role),
            status: employee.status === 'Active' ? 'active' : 'inactive',
            right_to_work_status: employee.compliance?.right_to_work_status || 'Pending',
            right_to_work_expiry: employee.compliance?.right_to_work_expiry,
            dbs_status: employee.compliance?.dbs_status || 'Pending',
            dbs_expiry: employee.compliance?.dbs_expiry,
            dbs_number: employee.compliance?.dbs_number,
            compliance_data: employee.compliance || {},
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabaseAdmin
            .from("employees")
            .upsert(careFlowEmployee, { onConflict: "novumflow_employee_id" })
            .select()
            .single();

        if (error) throw error;

        // Onboarding/Update Logic
        if (action === "employee.created") {
            console.log(`Onboarding: New employee ${employee.id} (${careFlowEmployee.role}) added to CareFlow. Assign to default team/schedule.`);
            // TODO: Add logic to assign to default team or schedule based on role
        } else if (action === "employee.updated") {
            console.log(`Employee Update: Employee ${employee.id} (${careFlowEmployee.role}) updated in CareFlow.`);
            // TODO: Add logic to adjust schedules/permissions based on updated role/status
        }

        return { success: true, message: "Employee synced", data };
    } else if (action === "employee.deleted") {
        const { error } = await supabaseAdmin
            .from("employees")
            .update({ status: 'Inactive' })
            .eq("novumflow_employee_id", employee.id);

        if (error) throw error;

        // Offboarding Logic
        console.log(`Offboarding: Employee ${employee.id} deactivated in CareFlow. Remove from all schedules/teams.`);
        // TODO: Add logic to remove from schedules, revoke access, etc.

        return { success: true, message: "Employee deactivated" };
    }

    throw new Error("Unknown action");
}
