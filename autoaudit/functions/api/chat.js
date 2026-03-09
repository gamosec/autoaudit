/**
 * Cloudflare Pages Function — /api/chat
 * Uses Cloudflare Workers AI (FREE) — no external API key needed.
 * Model: @cf/meta/llama-3.1-8b-instruct (free on Workers AI)
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const body        = await request.json();
    const userMessage = body?.messages?.[0]?.content || "";

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Detect policy / JSON-generation requests — covers all prompt variants
    const isJsonRequest =
      userMessage.includes("Output ONLY this JSON")                  ||
      userMessage.includes("Respond with ONLY a raw JSON")           ||
      userMessage.includes("CRITICAL: Respond with ONLY a raw JSON") ||
      userMessage.includes("SANS Institute template")                ||
      userMessage.includes("Output ONLY the JSON");

    const systemPrompt = isJsonRequest
      ? `You are a professional information security policy writer.
You output ONLY raw JSON objects — no markdown, no backticks, no explanation.
Start your response with { and end with }.
Never include compliance scores, maturity levels, gap analysis, or audit findings.`
      : `You are AutoAudit, an expert cybersecurity GRC AI agent specializing in ISO 27001, NIST CSF, PCI-DSS, GDPR, and SOC 2.
You support both English and Arabic. When the user writes in Arabic, always respond fully in Arabic.
Give concise, expert, practical answers.`;

    const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage  }
      ],
      max_tokens:  3000,
      temperature: 0.3,
    });

    const text = aiResponse?.response || "";

    if (!text) {
      return new Response(JSON.stringify({ error: "AI returned empty response" }), {
        status: 500, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({
      content: [{ type: "text", text }]
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Worker error" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
