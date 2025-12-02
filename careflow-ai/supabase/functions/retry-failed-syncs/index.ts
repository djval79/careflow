import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleSync } from "../sync_employee/handler.ts";

const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (_req) => {
    try {
        const { data: failedSyncs, error } = await supabaseAdmin
            .from("failed_syncs")
            .select("*")
            .eq("status", "pending_retry")
            .lt("retries", 3);

        if (error) {
            throw error;
        }

        for (const sync of failedSyncs) {
            try {
                await handleSync(sync.payload);

                await supabaseAdmin
                    .from("failed_syncs")
                    .update({ status: "resolved" })
                    .eq("id", sync.id);

            } catch (e) {
                await supabaseAdmin
                    .from("failed_syncs")
                    .update({ retries: sync.retries + 1 })
                    .eq("id", sync.id);
                
                if (sync.retries + 1 >= 3) {
                    await supabaseAdmin
                        .from("failed_syncs")
                        .update({ status: "manual_review_required" })
                        .eq("id", sync.id);
                }
            }
        }

        return new Response(JSON.stringify({ success: true, message: "Retried failed syncs." }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error retrying failed syncs:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});
