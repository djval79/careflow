import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const NOVUMFLOW_WEBHOOK_SECRET = Deno.env.get("NOVUMFLOW_WEBHOOK_SECRET");

export async function verifySignature(req: Request): Promise<boolean> {
    if (!NOVUMFLOW_WEBHOOK_SECRET) {
        console.error("NOVUMFLOW_WEBHOOK_SECRET is not set. Skipping signature verification.");
        // In a real production environment, you might want to throw an error here.
        return true;
    }

    const signature = req.headers.get("X-NovumFlow-Signature");
    if (!signature) {
        throw new Error("Missing X-NovumFlow-Signature header");
    }

    const body = await req.clone().text();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(NOVUMFLOW_WEBHOOK_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const signedHex = Array.from(new Uint8Array(signed))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    return signedHex === signature;
}
