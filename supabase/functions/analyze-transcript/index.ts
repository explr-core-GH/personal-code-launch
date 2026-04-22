// supabase/functions/analyze-transcript/index.ts
// Proxies transcript analysis requests to the Anthropic API.
// ANTHROPIC_API_KEY lives in Supabase secrets — never exposed to the client.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Always respond 200 so the Supabase SDK doesn't strip the error body.
function respond(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return respond({ error: "ANTHROPIC_API_KEY not configured on the server." });
    }

    const body = await req.json();

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const message =
        (data as any)?.error?.message ||
        (data as any)?.message ||
        `Anthropic API error (${upstream.status})`;
      return respond({ error: message, upstream_status: upstream.status, details: data });
    }

    return respond(data);
  } catch (err) {
    return respond({
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
});
