import { z } from "https://deno.land/x/zod/mod.ts";

export const EmployeeSchema = z.object({
    id: z.number(),
    full_name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    role: z.string(),
    status: z.string(),
    compliance: z.object({
        right_to_work_status: z.string().optional(),
        right_to_work_expiry: z.string().optional(),
        dbs_status: z.string().optional(),
        dbs_expiry: z.string().optional(),
        dbs_number: z.string().optional(),
    }).optional(),
});

export const PayloadSchema = z.object({
    action: z.string(),
    employee: EmployeeSchema,
    tenant_id: z.number(),
});
