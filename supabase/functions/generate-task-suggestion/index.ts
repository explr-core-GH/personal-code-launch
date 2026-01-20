import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { skillName, skillDescription, selectedTools, organizationName, interestReason, numberOfInterns } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating task suggestion for skill:", skillName, "at organization:", organizationName);

    const systemPrompt = `You are an expert in work-based learning (WBL) program design. Your role is to suggest practical, real-world tasks and experiences that allow students to develop specific skills in a workplace setting.

When suggesting tasks, consider:
- The task should be hands-on and applicable to real workplace scenarios
- Include a clear deadline or timeframe
- Specify who should supervise or mentor the student
- The task should be measurable and have clear outcomes
- Consider the available tools the student will use
- Tailor the suggestion to the specific organization and their goals

Format your response as a concise task description (2-3 sentences) that includes:
1. What the specific task or experience is
2. When it should occur or the deadline
3. Who will supervise or support the student`;

    let organizationContext = '';
    if (organizationName) {
      organizationContext = `\n\nOrganization Context:
- Organization Name: ${organizationName}`;
      if (interestReason) {
        organizationContext += `\n- Why they're hosting interns: ${interestReason}`;
      }
      if (numberOfInterns) {
        organizationContext += `\n- Number of interns: ${numberOfInterns}`;
      }
    }

    const userPrompt = `Generate a practical work-based learning task for the following skill:

Skill: ${skillName}
${skillDescription ? `Description: ${skillDescription}` : ''}
${selectedTools && selectedTools.length > 0 ? `Available Tools: ${selectedTools.join(', ')}` : ''}${organizationContext}

Please provide a specific, actionable task suggestion that a student could perform at ${organizationName || 'this organization'} to develop this skill. Make sure the task is relevant to the organization's context and goals.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content;

    console.log("Generated suggestion:", suggestion);

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating task suggestion:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
