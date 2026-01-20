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
    const { 
      type = 'task',
      skillName, 
      skillDescription, 
      selectedTools, 
      organizationName, 
      interestReason, 
      numberOfInterns,
      selectedSkills,
      projectIdea 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (type === 'project-idea') {
      console.log("Generating project idea for organization:", organizationName);
      
      systemPrompt = `You are an expert in work-based learning (WBL) program design and summer internship planning. Your role is to suggest creative, practical project ideas that organizations can assign to summer interns.

When suggesting project ideas, consider:
- The project should be achievable within a summer internship timeframe (8-12 weeks)
- It should provide meaningful learning opportunities for interns
- It should deliver real value to the organization
- It should align with the organization's goals for hosting interns
- Consider the skills the interns will be developing

Format your response as a clear, concise project description (3-4 sentences) that includes:
1. What the project is about
2. The expected deliverable or outcome
3. How it benefits both the intern and organization`;

      let organizationContext = '';
      if (organizationName) {
        organizationContext = `Organization: ${organizationName}`;
        if (interestReason) {
          organizationContext += `\nWhy they're hosting interns: ${interestReason}`;
        }
        if (numberOfInterns) {
          organizationContext += `\nNumber of interns: ${numberOfInterns}`;
        }
        if (selectedSkills && selectedSkills.length > 0) {
          organizationContext += `\nSkills being developed: ${selectedSkills.join(', ')}`;
        }
      }

      userPrompt = `Generate a practical summer internship project idea for the following organization:

${organizationContext}

Please suggest a specific, achievable project that would be valuable for both the interns and the organization. The project should help develop the listed skills while providing real business value.`;

    } else {
      console.log("Generating task suggestion for skill:", skillName, "at organization:", organizationName);

      systemPrompt = `You are an expert in work-based learning (WBL) program design. Your role is to suggest practical, real-world tasks and experiences that allow students to develop specific skills in a workplace setting.

When suggesting tasks, consider:
- The task should be hands-on and applicable to real workplace scenarios
- Include a clear deadline or timeframe
- Specify who should supervise or mentor the student
- The task should be measurable and have clear outcomes
- Consider the available tools the student will use
- Tailor the suggestion to the specific organization and their goals
- If a project idea is provided, align the task with that project

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
        if (projectIdea) {
          organizationContext += `\n- Project Focus: ${projectIdea}`;
        }
      }

      userPrompt = `Generate a practical work-based learning task for the following skill:

Skill: ${skillName}
${skillDescription ? `Description: ${skillDescription}` : ''}
${selectedTools && selectedTools.length > 0 ? `Available Tools: ${selectedTools.join(', ')}` : ''}${organizationContext}

Please provide a specific, actionable task suggestion that a student could perform at ${organizationName || 'this organization'} to develop this skill. Make sure the task is relevant to the organization's context and goals${projectIdea ? ', and aligns with their project focus' : ''}.`;
    }

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
    console.error("Error generating suggestion:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
