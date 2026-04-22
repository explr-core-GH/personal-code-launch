// Stub for the EXPLR Poster Builder export pipeline.
// In production, set PDF_SERVICE_URL to a Puppeteer-backed renderer; this
// function fetches the poster project and forwards it for rendering.
// Until that's wired up we return a placeholder URL after a short delay so
// the client UI can be exercised end-to-end.

import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ExportBody {
  projectId: string;
  mode: "full" | "cut-paste";
  paperSize?: "letter" | "tabloid";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = (await req.json()) as Partial<ExportBody>;
    if (!body?.projectId || (body.mode !== "full" && body.mode !== "cut-paste")) {
      return json({ error: "Invalid request" }, 400);
    }
    if (body.mode === "cut-paste" && body.paperSize !== "letter" && body.paperSize !== "tabloid") {
      return json({ error: "Invalid paperSize" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: auth } },
    });

    const { data: project, error } = await supabase
      .from("poster_projects")
      .select("id, name, content")
      .eq("id", body.projectId)
      .single();

    if (error || !project) {
      return json({ error: "Project not found" }, 404);
    }

    const pdfServiceUrl = Deno.env.get("PDF_SERVICE_URL");
    if (pdfServiceUrl) {
      const upstream = await fetch(pdfServiceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: body.mode,
          paperSize: body.paperSize,
          project,
        }),
      });
      if (!upstream.ok) {
        const text = await upstream.text();
        return json({ error: `PDF service error: ${text}` }, 502);
      }
      const data = await upstream.json();
      return json(data);
    }

    // Stub: pretend to render.
    await new Promise((r) => setTimeout(r, 1500));
    const fakeUrl = `https://example.com/poster/${project.id}/${body.mode}${
      body.paperSize ? `-${body.paperSize}` : ""
    }.pdf`;
    return json({
      url: fakeUrl,
      stub: true,
      message:
        "PDF_SERVICE_URL is not configured. This is a placeholder URL — wire up the renderer to enable real exports.",
    });
  } catch (err) {
    console.error("render-poster error", err);
    return json({ error: (err as Error).message ?? "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
