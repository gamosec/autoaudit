/**
 * Cloudflare Pages Function — /api/chat
 * Model: @cf/meta/llama-3.3-70b-instruct-fp8-fast  (70B — much better than 8B)
 */

// ── Embedded GRC knowledge base ───────────────────────────────────────────────
// Injected into the system prompt so the model has accurate reference data
// even when its training data is incomplete or wrong on specific controls.
const GRC_KB = `
=== ISO 27001:2022 ANNEX A — ALL 93 CONTROLS ===
A.5 Organizational Controls (37 controls):
A.5.1 Policies for information security | A.5.2 Information security roles and responsibilities | A.5.3 Segregation of duties | A.5.4 Management responsibilities | A.5.5 Contact with authorities | A.5.6 Contact with special interest groups | A.5.7 Threat intelligence | A.5.8 Information security in project management | A.5.9 Inventory of information and other associated assets | A.5.10 Acceptable use of information and other associated assets | A.5.11 Return of assets | A.5.12 Classification of information | A.5.13 Labelling of information | A.5.14 Information transfer | A.5.15 Access control | A.5.16 Identity management | A.5.17 Authentication information | A.5.18 Access rights | A.5.19 Information security in supplier relationships | A.5.20 Addressing information security within supplier agreements | A.5.21 Managing information security in the ICT supply chain | A.5.22 Monitoring, review and change management of supplier services | A.5.23 Information security for use of cloud services | A.5.24 Information security incident management planning and preparation | A.5.25 Assessment and decision on information security events | A.5.26 Response to information security incidents | A.5.27 Learning from information security incidents | A.5.28 Collection of evidence | A.5.29 Information security during disruption | A.5.30 ICT readiness for business continuity | A.5.31 Legal, statutory, regulatory and contractual requirements | A.5.32 Intellectual property rights | A.5.33 Protection of records | A.5.34 Privacy and protection of PII | A.5.35 Independent review of information security | A.5.36 Compliance with policies, rules and standards for information security | A.5.37 Documented operating procedures

A.6 People Controls (8 controls):
A.6.1 Screening | A.6.2 Terms and conditions of employment | A.6.3 Information security awareness, education and training | A.6.4 Disciplinary process | A.6.5 Responsibilities after termination or change of employment | A.6.6 Confidentiality or non-disclosure agreements | A.6.7 Remote working | A.6.8 Information security event reporting

A.7 Physical Controls (14 controls):
A.7.1 Physical security perimeters | A.7.2 Physical entry | A.7.3 Securing offices, rooms and facilities | A.7.4 Physical security monitoring | A.7.5 Protecting against physical and environmental threats | A.7.6 Working in secure areas | A.7.7 Clear desk and clear screen | A.7.8 Equipment siting and protection | A.7.9 Security of assets off-premises | A.7.10 Storage media | A.7.11 Supporting utilities | A.7.12 Cabling security | A.7.13 Equipment maintenance | A.7.14 Secure disposal or re-use of equipment

A.8 Technological Controls (34 controls):
A.8.1 User endpoint devices | A.8.2 Privileged access rights | A.8.3 Information access restriction | A.8.4 Access to source code | A.8.5 Secure authentication | A.8.6 Capacity management | A.8.7 Protection against malware | A.8.8 Management of technical vulnerabilities | A.8.9 Configuration management | A.8.10 Information deletion | A.8.11 Data masking | A.8.12 Data leakage prevention | A.8.13 Information backup | A.8.14 Redundancy of information processing facilities | A.8.15 Logging | A.8.16 Monitoring activities | A.8.17 Clock synchronisation | A.8.18 Use of privileged utility programs | A.8.19 Installation of software on operational systems | A.8.20 Networks security | A.8.21 Security of network services | A.8.22 Segregation of networks | A.8.23 Web filtering | A.8.24 Use of cryptography | A.8.25 Secure development life cycle | A.8.26 Application security requirements | A.8.27 Secure system architecture and engineering principles | A.8.28 Secure coding | A.8.29 Security testing in development and acceptance | A.8.30 Outsourced development | A.8.31 Separation of development, test and production environments | A.8.32 Change management | A.8.33 Test information | A.8.34 Protection of information systems during audit testing

=== ISO 27001:2022 KEY FACTS ===
- Full title: ISO/IEC 27001:2022 Information security, cybersecurity and privacy protection — Information security management systems — Requirements
- Published: October 2022 (replaced ISO 27001:2013)
- Total controls: 93 in Annex A (was 114 in 2013 version)
- Domains: 4 (was 14 in 2013)
- New controls added in 2022 (11 new): A.5.7 Threat intelligence, A.5.23 Cloud services security, A.5.30 ICT readiness for BCP, A.7.4 Physical security monitoring, A.8.9 Configuration management, A.8.10 Information deletion, A.8.11 Data masking, A.8.12 Data leakage prevention, A.8.16 Monitoring activities, A.8.23 Web filtering, A.8.28 Secure coding
- Certification body: Accredited Certification Bodies (CBs) perform stage 1 + stage 2 audits
- Surveillance audits: annually | Recertification: every 3 years
- Statement of Applicability (SoA): mandatory document listing all controls and applicability

=== PCI-DSS v4.0 KEY REQUIREMENTS ===
Req 1: Install and maintain network security controls
Req 2: Apply secure configurations to all system components
Req 3: Protect stored account data
Req 4: Protect cardholder data with strong cryptography during transmission
Req 5: Protect all systems and networks from malicious software
Req 6: Develop and maintain secure systems and software
Req 7: Restrict access to system components and cardholder data by business need to know
Req 8: Identify users and authenticate access to system components
Req 9: Restrict physical access to cardholder data
Req 10: Log and monitor all access to system components and cardholder data
Req 11: Test security of systems and networks regularly
Req 12: Support information security with organizational policies and programs
- PCI-DSS v4.0 published: March 2022 | v3.2.1 retired: March 2024
- SAQ types: A, A-EP, B, B-IP, C, C-VT, D (Merchant), D (Service Provider), P2PE
- Levels: Level 1 (>6M transactions/year), Level 2 (1-6M), Level 3 (20k-1M), Level 4 (<20k)

=== NIST CSF 2.0 KEY FACTS ===
- Published: February 2024 (replaced CSF 1.1)
- 6 Core Functions: GOVERN (new), IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER
- GOVERN added in v2.0 — covers organizational context, risk management strategy, supply chain
- 22 Categories, 106 Subcategories
- Tiers: 1 (Partial), 2 (Risk Informed), 3 (Repeatable), 4 (Adaptive)

=== GDPR KEY ARTICLES ===
Art.5 Principles, Art.6 Lawful basis, Art.7 Consent, Art.13-14 Transparency, Art.17 Right to erasure, Art.20 Data portability, Art.24 Controller responsibility, Art.25 Data protection by design, Art.28 Processors, Art.32 Security measures, Art.33 Breach notification (72h), Art.35 DPIA, Art.37 DPO, Art.44-49 Transfers
- GDPR fines: up to €20M or 4% global annual turnover (whichever higher) for serious violations
- DPO required when: public authority, large-scale systematic monitoring, large-scale special categories

=== SOC 2 KEY FACTS ===
- Based on AICPA Trust Services Criteria (TSC)
- 5 Trust Service Categories: Security (CC), Availability (A), Confidentiality (C), Processing Integrity (PI), Privacy (P)
- Security (CC) is mandatory — others are optional
- Type I: point-in-time assessment | Type II: period assessment (6-12 months minimum)
- Common Criteria (CC): CC1 Control Environment, CC2 Communication, CC3 Risk Assessment, CC4 Monitoring, CC5 Control Activities, CC6 Logical Access, CC7 System Operations, CC8 Change Management, CC9 Risk Mitigation
`.trim();

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body        = await request.json();
    const userMessage = body?.messages?.[0]?.content || "";

    if (!userMessage) {
      return new Response(JSON.stringify({ error: "No message provided" }), {
        status: 400, headers: CORS,
      });
    }

    // Detect policy/JSON generation requests vs GRC chat
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
Never include compliance scores, maturity levels, gap analysis, or audit findings in a policy document.`
      : `You are AutoAudit, an expert AI cybersecurity and GRC consultant with deep knowledge of information security standards and frameworks.

You have access to the following accurate reference data — always use it when answering questions about these frameworks:

${GRC_KB}

Instructions:
- Always use the reference data above for factual questions about ISO 27001, PCI-DSS, NIST CSF, GDPR, and SOC 2
- Give clear, accurate, specific answers. Never guess at control numbers or requirements
- When listing controls, use the exact IDs and names from the reference data
- Support both English and Arabic. When the user writes in Arabic, always respond fully in Arabic
- Keep responses concise and practical unless the user asks for detail
- Format lists clearly using numbered or bulleted structure when appropriate`;

    const aiResponse = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userMessage  }
      ],
      max_tokens:  3000,
      temperature: 0.2,
    });

    const text = aiResponse?.response || "";

    if (!text) {
      return new Response(JSON.stringify({ error: "AI returned empty response" }), {
        status: 500, headers: CORS,
      });
    }

    return new Response(JSON.stringify({
      content: [{ type: "text", text }]
    }), { status: 200, headers: CORS });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Worker error" }),
      { status: 500, headers: CORS }
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
