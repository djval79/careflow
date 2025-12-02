import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

export async function addToDeadLetterQueue(payload: any, errorMessage: string): Promise<void> {
    try {
        const { error } = await supabaseAdmin
            .from("failed_syncs")
            .insert({
                payload,
                error_message: errorMessage,
            });

        if (error) {
            console.error("Error adding to dead-letter queue:", error);
        }
    } catch (e) {
        console.error("Fatal error in dead-letter queue:", e);
    }
}
