/**
 * Cloudflare Pages Function — /api/chat
 * Uses Cloudflare Workers AI (FREE) — no external API key needed.
 * Model: @cf/meta/llama-3.1-8b-instruct (free on Workers AI)
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const userMessage = body?.messages?.[0]?.content || "";

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Call Cloudflare Workers AI — uses env.AI binding (free)
    const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        {
          role: "system",
          content: "You are AutoAudit, an expert cybersecurity GRC AI agent. You only respond with raw JSON objects. Never use markdown, backticks, or explanation. Start every response with { and end with }."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 2048,
      temperature: 0.3,
    });

    // Workers AI returns { response: "..." }
    const text = aiResponse?.response || "";

    if (!text) {
      return new Response(JSON.stringify({ error: "AI returned empty response" }), {
        status: 500, headers: corsHeaders,
      });
    }

    // Return in same shape the frontend expects
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
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
