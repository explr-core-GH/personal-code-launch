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
      
      systemPrompt = `You are an expert in work-based learning (WBL) program design and summer internship planning for K-12 students. Your role is to suggest creative, practical project ideas that organizations can assign to student interns.

CONTENT SAFETY REQUIREMENTS (MANDATORY):
- All content MUST be appropriate for K-12 students (ages 5-18)
- Avoid any references to violence, weapons, drugs, alcohol, gambling, or adult themes
- Focus on educational, constructive, and age-appropriate workplace experiences
- Ensure all suggested activities comply with youth labor laws and safety standards

FORMATTING REQUIREMENTS:
- Keep language simple, clear, and easy to read
- Use short sentences and avoid jargon
- Be concise - aim for 3-4 sentences maximum
- Make suggestions actionable and specific

When suggesting project ideas, consider:
- The project should be achievable within a summer internship timeframe (8-12 weeks)
- It should provide meaningful learning opportunities for students
- It should deliver real value to the organization
- Activities must be safe and supervised for young learners

Format your response as:
1. A clear project title or theme
2. What the student will create or accomplish
3. How it benefits both the student and organization`;

      let organizationContext = '';
      if (organizationName) {
        organizationContext = `Organization: ${organizationName}`;
        if (interestReason) {
          organizationContext += `\nWhy they're hosting interns: ${interestReason}`;
        }
        if (numberOfInterns) {
          organizationContext += `\nNumber of student interns: ${numberOfInterns}`;
        }
        if (selectedSkills && selectedSkills.length > 0) {
          organizationContext += `\nSkills being developed: ${selectedSkills.join(', ')}`;
        }
      }

      userPrompt = `Generate a practical summer internship project idea for K-12 students at this organization:

${organizationContext}

Suggest a specific, achievable project that is safe and appropriate for student learners while providing real value to both parties.`;

    } else {
      console.log("Generating task suggestion for skill:", skillName, "at organization:", organizationName);

      systemPrompt = `You are an expert in work-based learning (WBL) program design for K-12 students. Your role is to suggest practical, real-world tasks that help students develop specific skills in safe workplace settings.

CONTENT SAFETY REQUIREMENTS (MANDATORY):
- All content MUST be appropriate for K-12 students (ages 5-18)
- Avoid any references to violence, weapons, drugs, alcohol, gambling, or adult themes
- Focus on educational, constructive, and age-appropriate workplace experiences
- Ensure all suggested activities comply with youth labor laws and safety standards
- Tasks should always include adult supervision

FORMATTING REQUIREMENTS:
- Keep language simple, clear, and easy to read
- Use short sentences and avoid jargon
- Be concise - 2-3 sentences maximum
- Make tasks specific and actionable

When suggesting tasks:
- The task should be hands-on and safe for young learners
- Include a clear timeframe
- Specify who will supervise the student
- If a project idea is provided, the task MUST contribute to that project

Format your response as:
1. The specific task (tied to the project if one exists)
2. Timeline or deadline
3. Who will supervise`;

      let organizationContext = '';
      if (organizationName) {
        organizationContext = `\n\nOrganization Context:
- Organization Name: ${organizationName}`;
        if (interestReason) {
          organizationContext += `\n- Why they're hosting student interns: ${interestReason}`;
        }
        if (numberOfInterns) {
          organizationContext += `\n- Number of student interns: ${numberOfInterns}`;
        }
      }

      let projectContext = '';
      if (projectIdea) {
        projectContext = `\n\n🎯 MAIN PROJECT: ${projectIdea}`;
      }

      userPrompt = `Generate a K-12 appropriate work-based learning task:

Skill: ${skillName}
${skillDescription ? `Description: ${skillDescription}` : ''}
${selectedTools && selectedTools.length > 0 ? `Available Tools: ${selectedTools.join(', ')}` : ''}${organizationContext}${projectContext}

${projectIdea ? `This task should contribute to the main project while developing the "${skillName}" skill. Ensure it's safe and appropriate for student learners.` : `Provide a specific, safe task for a student to develop this skill at ${organizationName || 'this organization'}.`}`;
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
