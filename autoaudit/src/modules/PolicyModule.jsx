import { useState } from "react";

// ── Framework colours ────────────────────────────────────────────────────────
const FRAMEWORKS = {
  "ISO 27001:2022": { color:"#0ea5e9", badge:"ISO"  },
  "NIST CSF 2.0":   { color:"#8b5cf6", badge:"NIST" },
  "PCI-DSS v4.0":   { color:"#f59e0b", badge:"PCI"  },
  "GDPR":           { color:"#10b981", badge:"GDPR" },
  "SOC 2":          { color:"#ef4444", badge:"SOC2" },
};

// ── Policy catalogue (7 types) ───────────────────────────────────────────────
const POLICY_CATALOGUE = {
  "Information Security Policy":   { ref:"POL-ISP-001", icon:"🔒", sans:"EISP" },
  "Access Control Policy":         { ref:"POL-ACP-002", icon:"🔑", sans:"Access Control" },
  "Data Classification Policy":    { ref:"POL-DCP-003", icon:"🗂️", sans:"Data Classification" },
  "Incident Response Policy":      { ref:"POL-IRP-004", icon:"🚨", sans:"Incident Response" },
  "Acceptable Use Policy":         { ref:"POL-AUP-005", icon:"✅", sans:"AUP" },
  "Password Policy":               { ref:"POL-PWD-006", icon:"🔐", sans:"Password Protection" },
  "Business Continuity Policy":    { ref:"POL-BCP-007", icon:"🔄", sans:"BCP" },
};

// ── Safe JSON parser ─────────────────────────────────────────────────────────
function safeJSON(raw) {
  try {
    let t = raw.trim()
      .replace(/^```(?:json)?[\r\n]*/i, "")
      .replace(/[\r\n]*```\s*$/i, "")
      .trim();
    const s = t.indexOf("{"), e = t.lastIndexOf("}");
    if (s < 0 || e < 0) return null;
    return JSON.parse(t.slice(s, e + 1));
  } catch { return null; }
}

// ── AI Prompt — PURE policy document, zero gap/audit content ────────────────
function makePrompt(f, lang) {
  const ar = lang === "ar";
  const langNote = ar
    ? "IMPORTANT: Write ALL text fields in Arabic. Keep reference codes, control IDs, dates, and framework names in English."
    : "Write all text in English.";
  const meta = POLICY_CATALOGUE[f.policyType] || { ref:"POL-001", sans:"Security Policy" };

  return `You are a senior information security policy writer following the SANS Institute "${meta.sans}" policy template.
${langNote}

Write a complete, professional, standalone ${f.policyType} for:
- Organization: ${f.orgName}
- Industry: ${f.industry}
- Size: ${f.size}
- Compliance Framework: ${f.framework}

THIS IS A POLICY DOCUMENT ONLY.
DO NOT include: compliance scores, maturity levels, gap analysis, risk ratings, control verdicts, or audit findings.
A policy document states WHAT the organization MUST do — it does not assess how well it currently does it.

CRITICAL: Output ONLY a raw JSON object. No markdown. No backticks. Start with { end with }.

{
  "policyTitle": "Official full title of the policy",
  "policyRef": "${meta.ref}",
  "version": "1.0",
  "effectiveDate": "2025-03-01",
  "reviewDate": "2026-03-01",
  "owner": "Job title responsible for this policy (e.g. Chief Information Security Officer)",
  "approver": "Job title who approves this policy (e.g. Chief Executive Officer)",
  "classification": "${ar ? "داخلي — سري" : "Internal — Confidential"}",
  "purpose": "2-3 sentences explaining WHY this policy exists and what risk it addresses for ${f.orgName}",
  "scope": "2-3 sentences defining WHO and WHAT systems/data/people this policy applies to",
  "policyStatements": [
    {
      "sectionTitle": "Section heading (e.g. 5.1 User Access Management)",
      "statements": [
        "SHALL statement 1 — a clear, enforceable mandatory requirement",
        "MUST statement 2",
        "MUST NOT statement 3",
        "SHALL statement 4"
      ]
    }
  ],
  "frameworkMapping": "2-3 sentences naming the specific ${f.framework} controls/clauses/articles this policy directly satisfies",
  "roles": [
    { "role": "Job title", "responsibility": "Their specific responsibility under this policy" },
    { "role": "Job title", "responsibility": "Their specific responsibility" },
    { "role": "Job title", "responsibility": "Their specific responsibility" }
  ],
  "exceptions": "How policy exceptions are formally requested, reviewed, and approved at ${f.orgName}",
  "enforcement": "Consequences of non-compliance and how violations are handled",
  "definitions": [
    { "term": "Key term", "definition": "Plain-English definition relevant to this policy" },
    { "term": "Key term", "definition": "Plain-English definition" },
    { "term": "Key term", "definition": "Plain-English definition" },
    { "term": "Key term", "definition": "Plain-English definition" }
  ],
  "relatedDocuments": [
    "Name of related policy or standard",
    "Name of related procedure or guideline",
    "Name of related document"
  ]
}

Requirements:
- policyStatements MUST have 4 to 6 sections, each with 3 to 5 bullet statements
- Every statement MUST use SHALL, MUST, or MUST NOT — mandatory policy language only
- Make every section specific to ${f.orgName} and the ${f.industry} sector
- Align tightly to ${f.framework} but do NOT assess compliance — just write requirements
- Output ONLY the JSON — nothing before or after the opening {`;
}

// ── Word document generator (.doc via HTML blob) ─────────────────────────────
function downloadWord(policy, orgName, framework, policyType, lang) {
  const ar  = lang === "ar";
  const dir = ar ? "rtl" : "ltr";
  const fw  = FRAMEWORKS[framework] || { color:"#1B3A6B" };
  const today = new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB", { year:"numeric", month:"long", day:"numeric" });

  const sectionsHTML = (policy.policyStatements || []).map((sec, idx) => `
    <h3 style="color:#1B3A6B;font-size:12pt;margin:14pt 0 5pt;padding-bottom:3pt;border-bottom:1px solid #e2e8f0;">
      ${idx + 1 + 4}. ${sec.sectionTitle}
    </h3>
    <ul style="margin:0 0 10pt;padding-${ar?"right":"left"}:18pt;">
      ${(sec.statements || []).map(s => `<li style="margin-bottom:4pt;line-height:1.65;">${s}</li>`).join("")}
    </ul>`
  ).join("");

  const rolesHTML = (policy.roles || []).map(r => `
    <tr>
      <td style="padding:6pt 10pt;border:1pt solid #e2e8f0;font-weight:bold;width:30%;background:#f8fafc;vertical-align:top;">${r.role}</td>
      <td style="padding:6pt 10pt;border:1pt solid #e2e8f0;vertical-align:top;">${r.responsibility}</td>
    </tr>`
  ).join("");

  const defsHTML = (policy.definitions || []).map(d => `
    <tr>
      <td style="padding:6pt 10pt;border:1pt solid #e2e8f0;font-weight:bold;width:28%;background:#f8fafc;vertical-align:top;">${d.term}</td>
      <td style="padding:6pt 10pt;border:1pt solid #e2e8f0;vertical-align:top;">${d.definition}</td>
    </tr>`
  ).join("");

  const relatedHTML = (policy.relatedDocuments || [])
    .map(r => `<li style="margin-bottom:4pt;">${r}</li>`).join("");

  const L = (en, arabic) => ar ? arabic : en;

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>${policy.policyTitle}</title>
  <!--[if gte mso 9]><xml><w:WordDocument>
    <w:View>Print</w:View><w:Zoom>90</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument></xml><![endif]-->
  <style>
    @page { margin: 2.5cm 2.5cm 2cm; }
    body  { font-family:Arial,sans-serif; font-size:11pt; color:#1e293b; direction:${dir}; line-height:1.5; margin:0; padding:0; }
    h1    { font-size:20pt; color:#fff; margin:0 0 6pt; }
    h2    { font-size:13pt; color:#1B3A6B; margin:18pt 0 7pt; border-bottom:2pt solid #1B3A6B; padding-bottom:4pt; page-break-after:avoid; }
    h3    { font-size:11.5pt; color:#1B3A6B; margin:12pt 0 4pt; }
    p     { margin:0 0 8pt; }
    table { width:100%; border-collapse:collapse; margin:8pt 0 14pt; font-size:10.5pt; }
    td,th { padding:6pt 10pt; border:1pt solid #d1d5db; vertical-align:top; }
    th    { background:#1B3A6B; color:#fff; font-weight:bold; text-align:${ar?"right":"left"}; }
    ul    { margin:4pt 0 10pt; }
    li    { margin-bottom:3pt; line-height:1.6; }
    .cover{ background:#1B3A6B; color:#fff; padding:26pt 30pt 22pt; margin-bottom:0; }
    .cover .sub { font-size:10pt; color:#93c5fd; margin-bottom:6pt; }
    .cover .ref { font-size:9pt; color:#7dd3fc; margin-top:8pt; font-family:monospace; }
    .cover .tag { display:inline-block; background:rgba(255,255,255,0.15); color:#e0f2fe;
                  border:1pt solid rgba(255,255,255,0.25); border-radius:3pt;
                  padding:2pt 10pt; font-size:9pt; font-weight:bold; margin-top:10pt; }
    .meta td   { border:none; padding:3pt 8pt; font-size:10pt; }
    .meta .lbl { font-weight:bold; color:#64748b; font-size:9pt; text-transform:uppercase; letter-spacing:.04em; width:33%; }
    .meta .val { color:#1e293b; }
    .notice    { background:#fffbeb; border-${ar?"right":"left"}:3pt solid #f59e0b;
                 padding:8pt 12pt; margin:8pt 0; font-size:10pt; color:#78350f; }
    .footer    { font-size:8pt; color:#94a3b8; text-align:center; margin-top:28pt;
                 border-top:1pt solid #e2e8f0; padding-top:8pt; }
  </style>
</head>
<body>

<!-- COVER STRIP -->
<div class="cover">
  <div class="sub">${orgName} &nbsp;·&nbsp; ${policyType}</div>
  <h1>${policy.policyTitle}</h1>
  <div class="ref">${policy.policyRef} &nbsp;·&nbsp; ${L("Version","الإصدار")} ${policy.version} &nbsp;·&nbsp; ${policy.classification}</div>
  <div class="tag">${framework}</div>
</div>

<!-- DOCUMENT CONTROL -->
<h2>1. ${L("Document Control","معلومات الوثيقة")}</h2>
<table class="meta">
  <tr>
    <td class="lbl">${L("Policy Reference","المرجع")}</td><td class="val">${policy.policyRef}</td>
    <td class="lbl">${L("Version","الإصدار")}</td><td class="val">${policy.version}</td>
  </tr>
  <tr>
    <td class="lbl">${L("Effective Date","تاريخ السريان")}</td><td class="val">${policy.effectiveDate}</td>
    <td class="lbl">${L("Review Date","تاريخ المراجعة")}</td><td class="val">${policy.reviewDate}</td>
  </tr>
  <tr>
    <td class="lbl">${L("Policy Owner","مالك السياسة")}</td><td class="val">${policy.owner}</td>
    <td class="lbl">${L("Approved By","المعتمِد")}</td><td class="val">${policy.approver}</td>
  </tr>
  <tr>
    <td class="lbl">${L("Classification","التصنيف")}</td><td class="val">${policy.classification}</td>
    <td class="lbl">${L("Issue Date","تاريخ الإصدار")}</td><td class="val">${today}</td>
  </tr>
</table>

<!-- PURPOSE -->
<h2>2. ${L("Purpose","الغرض")}</h2>
<p>${policy.purpose}</p>

<!-- SCOPE -->
<h2>3. ${L("Scope","النطاق")}</h2>
<p>${policy.scope}</p>

<!-- ROLES -->
<h2>4. ${L("Roles & Responsibilities","الأدوار والمسؤوليات")}</h2>
<table>
  <tr>
    <th style="width:30%">${L("Role","الدور")}</th>
    <th>${L("Responsibility","المسؤولية")}</th>
  </tr>
  ${rolesHTML}
</table>

<!-- POLICY STATEMENTS -->
<h2>5. ${L("Policy Statements","بنود السياسة")}</h2>
<div class="notice">
  ${L(
    "All statements below are mandatory requirements. The words SHALL and MUST indicate required actions; MUST NOT indicates prohibited actions.",
    "جميع البنود التالية متطلبات إلزامية. كلمة يجب تشير إلى إجراء مطلوب؛ يُحظر تشير إلى إجراء محظور."
  )}
</div>
${sectionsHTML}

<!-- FRAMEWORK MAPPING -->
<h2>6. ${L("Regulatory Framework Mapping","التوافق مع الإطار التنظيمي")}</h2>
<div class="notice">${L("This policy supports","هذه السياسة تدعم متطلبات")} <strong>${framework}</strong>${L(" compliance as follows:", " على النحو التالي:")}</div>
<p>${policy.frameworkMapping}</p>

<!-- EXCEPTIONS -->
<h2>7. ${L("Policy Exceptions","الاستثناءات")}</h2>
<p>${policy.exceptions}</p>

<!-- ENFORCEMENT -->
<h2>8. ${L("Enforcement","التطبيق والإنفاذ")}</h2>
<p>${policy.enforcement}</p>

<!-- DEFINITIONS -->
<h2>9. ${L("Definitions","التعريفات")}</h2>
<table>
  <tr>
    <th style="width:28%">${L("Term","المصطلح")}</th>
    <th>${L("Definition","التعريف")}</th>
  </tr>
  ${defsHTML}
</table>

<!-- RELATED DOCUMENTS -->
<h2>10. ${L("Related Documents","الوثائق ذات الصلة")}</h2>
<ul>${relatedHTML}</ul>

<!-- REVISION HISTORY -->
<h2>11. ${L("Revision History","سجل المراجعات")}</h2>
<table>
  <tr>
    <th style="width:12%">${L("Version","الإصدار")}</th>
    <th style="width:20%">${L("Date","التاريخ")}</th>
    <th style="width:28%">${L("Author","المؤلف")}</th>
    <th>${L("Description","الوصف")}</th>
  </tr>
  <tr>
    <td>1.0</td>
    <td>${policy.effectiveDate}</td>
    <td>AutoAudit AI</td>
    <td>${L("Initial release — generated by AutoAudit","الإصدار الأولي — تم الإنشاء بواسطة AutoAudit")}</td>
  </tr>
</table>

<div class="footer">
  ${orgName} &nbsp;·&nbsp; ${policy.policyRef} &nbsp;·&nbsp;
  ${L("Internal Confidential — Do not distribute without authorisation",
      "وثيقة داخلية سرية — لا توزع دون إذن")}
</div>

</body>
</html>`;

  const blob = new Blob(["\ufeff" + html], { type:"application/msword;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  const safe = orgName.replace(/\s+/g, "_").replace(/[^\w-]/g, "");
  a.href     = url;
  a.download = `${safe}_${policy.policyRef}_v1.0.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function PolicyModule({ t, isRTL, lang }) {
  const [step,   setStep]   = useState("form");
  const [form,   setForm]   = useState({ orgName:"", industry:"", size:"", framework:"", policyType:"" });
  const [policy, setPolicy] = useState(null);
  const [error,  setError]  = useState("");

  const fw       = FRAMEWORKS[form.framework] || { color:"#0ea5e9" };
  const polMeta  = POLICY_CATALOGUE[form.policyType] || {};

  async function generate() {
    if (!form.orgName || !form.industry || !form.size || !form.framework || !form.policyType) {
      setError(t.fillAllFields); return;
    }
    setError(""); setStep("loading");
    try {
      const res  = await fetch("/api/chat", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ messages:[{ role:"user", content: makePrompt(form, lang) }] })
      });
      if (!res.ok) throw new Error("API " + res.status);
      const data   = await res.json();
      const raw    = (data.content || []).map(b => b.text || "").join("");
      const parsed = safeJSON(raw);
      if (!parsed || !parsed.policyStatements) throw new Error(t.parseError);
      setPolicy(parsed); setStep("result");
    } catch(e) { setError("Error: " + e.message); setStep("form"); }
  }

  function reset() { setStep("form"); setPolicy(null); setError(""); }

  // ── shared small components ──
  function Lbl({ children }) {
    return (
      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#64748b",
        marginBottom:6, textTransform:"uppercase", letterSpacing:"0.07em" }}>
        {children} *
      </label>
    );
  }
  function FSelect({ label, value, onChange, options, placeholder }) {
    return (
      <div>
        <Lbl>{label}</Lbl>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width:"100%", padding:"10px 13px", border:"1.5px solid #1e293b", borderRadius:9,
            fontSize:13, background:"#0f172a", color: value ? "#e2e8f0" : "#475569",
            fontFamily:"inherit", cursor:"pointer", textAlign: isRTL ? "right" : "left",
            boxSizing:"border-box" }}>
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  // ── FORM ──
  if (step === "form" || step === "loading") return (
    <div style={{ maxWidth:680, animation:"fadeUp 0.3s ease" }} dir={isRTL ? "rtl" : "ltr"}>

      <div style={{ marginBottom:22 }}>
        <h2 style={{ fontSize:22, fontWeight:900, color:"#f1f5f9", marginBottom:6 }}>{t.policyTitle}</h2>
        <p style={{ color:"#475569", fontSize:13, lineHeight:1.7 }}>
          {isRTL
            ? "أنشئ وثيقة سياسة احترافية كاملة وفق قالب SANS — مع تصدير مباشر كملف Word باسم شركتك."
            : "Generate a complete, professional policy document based on SANS Institute templates — exported as a branded Word document."}
        </p>
      </div>

      {/* SANS badge */}
      <div style={{ background:"#0f172a", border:"1px solid #1a2744", borderRadius:11,
        padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:40, height:40, borderRadius:9, background:"linear-gradient(135deg,#0ea5e9,#0284c7)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📄</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:800, color:"#e2e8f0" }}>
            {isRTL ? "قالب SANS المعياري للسياسات" : "SANS Institute Policy Template Standard"}
          </div>
          <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>
            {isRTL
              ? "الغرض · النطاق · الأدوار · بنود السياسة · التوافق التنظيمي · التعريفات · سجل المراجعات"
              : "Purpose · Scope · Roles · Policy Statements · Framework Mapping · Definitions · Revision History"}
          </div>
        </div>
        <div style={{ padding:"4px 10px", background:"#10b98115", color:"#10b981",
          border:"1px solid #10b98130", borderRadius:6, fontSize:10, fontWeight:700, flexShrink:0 }}>
          {isRTL ? "⬇ Word" : "⬇ .doc Export"}
        </div>
      </div>

      {/* Form card */}
      <div style={{ background:"#0f172a", border:"1px solid #1a2744", borderRadius:14, padding:24, marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:800, color:"#334155", letterSpacing:"0.1em",
          textTransform:"uppercase", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:3, height:13, background:"#0ea5e9", borderRadius:2, display:"inline-block" }}/>
          {t.orgDetails}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ gridColumn:"1/-1" }}>
            <Lbl>{t.orgName}</Lbl>
            <input value={form.orgName} onChange={e => setForm(f => ({...f, orgName:e.target.value}))}
              placeholder={t.orgNamePlaceholder}
              style={{ width:"100%", padding:"10px 13px", border:"1.5px solid #1e293b", borderRadius:9,
                fontSize:13, background:"#0f172a", color:"#e2e8f0", fontFamily:"inherit",
                textAlign: isRTL ? "right" : "left", boxSizing:"border-box" }} />
          </div>
          <FSelect label={t.industry}            value={form.industry}   onChange={v=>setForm(f=>({...f,industry:v}))}   options={t.industries}            placeholder={t.industryPlaceholder}/>
          <FSelect label={t.orgSize}             value={form.size}       onChange={v=>setForm(f=>({...f,size:v}))}       options={t.orgSizes}              placeholder={t.orgSizePlaceholder}/>
          <FSelect label={t.complianceFramework} value={form.framework}  onChange={v=>setForm(f=>({...f,framework:v}))}  options={Object.keys(FRAMEWORKS)} placeholder={t.frameworkPlaceholder}/>
          <FSelect label={t.policyType}          value={form.policyType} onChange={v=>setForm(f=>({...f,policyType:v}))} options={Object.keys(POLICY_CATALOGUE)} placeholder={t.policyTypePlaceholder}/>
        </div>

        {/* Policy preview pill */}
        {form.policyType && (
          <div style={{ marginTop:14, padding:"10px 14px", background:fw.color+"08",
            border:`1px solid ${fw.color}20`, borderRadius:9, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>{polMeta.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:800, color:fw.color }}>
                {polMeta.ref} — {form.policyType}
              </div>
              <div style={{ fontSize:11, color:"#475569", marginTop:1 }}>
                {isRTL ? "قالب SANS:" : "SANS template:"} {polMeta.sans}
                {form.orgName && ` · ${form.orgName}`}
              </div>
            </div>
            <span style={{ padding:"2px 8px", background:fw.color+"20", color:fw.color,
              borderRadius:4, fontSize:10, fontWeight:700 }}>{fw.badge}</span>
          </div>
        )}

        {error && (
          <div style={{ marginTop:14, padding:"10px 13px", background:"#7f1d1d20",
            border:"1px solid #ef444440", borderRadius:8, color:"#fca5a5", fontSize:12 }}>
            {error}
          </div>
        )}
      </div>

      {step === "loading" ? (
        <div style={{ background:"#0f172a", border:"1px solid #1a2744", borderRadius:14,
          padding:"48px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
          <div style={{ position:"relative", width:52, height:52 }}>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid #1e293b" }}/>
            <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"3px solid transparent",
              borderTopColor:"#0ea5e9", animation:"sp 0.9s linear infinite" }}/>
            <div style={{ position:"absolute", inset:8, borderRadius:"50%", border:"2px solid transparent",
              borderTopColor:"#8b5cf6", animation:"sp 0.7s linear infinite reverse" }}/>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontWeight:700, color:"#e2e8f0" }}>
              {isRTL ? "جارٍ كتابة السياسة…" : "Writing policy document…"}
            </div>
            <div style={{ fontSize:12, color:"#475569", marginTop:4 }}>
              {isRTL ? "تطبيق هيكل قالب SANS" : "Applying SANS Institute template structure"}
            </div>
          </div>
        </div>
      ) : (
        <button onClick={generate}
          style={{ width:"100%", padding:14, background:"linear-gradient(135deg,#0ea5e9,#0284c7)",
            border:"none", borderRadius:11, color:"#fff", fontSize:14, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 16px #0ea5e930" }}>
          ▶ {isRTL ? "إنشاء وثيقة السياسة" : "Generate Policy Document"}
        </button>
      )}
    </div>
  );

  // ── RESULT ──
  if (!policy) return null;

  const Section = ({ accentColor, icon, title, children }) => (
    <div style={{ background:"#0f172a", border:"1px solid #1a2744", borderRadius:12,
      padding:20, marginBottom:12 }}>
      <div style={{ fontSize:10, fontWeight:700, color:"#475569", letterSpacing:"0.08em",
        textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ width:3, height:13, background:accentColor, borderRadius:2, display:"inline-block" }}/>
        {icon} {title}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth:820, animation:"fadeUp 0.3s ease" }} dir={isRTL ? "rtl" : "ltr"}>

      {/* Top action bar */}
      <div style={{ display:"flex", gap:10, marginBottom:18, alignItems:"center" }}>
        <button onClick={reset}
          style={{ padding:"8px 14px", background:"#0f172a", border:"1px solid #1e293b",
            borderRadius:9, fontSize:12, fontWeight:700, color:"#94a3b8", cursor:"pointer" }}>
          {isRTL ? "→ سياسة جديدة" : "← New Policy"}
        </button>
        <div style={{ flex:1 }}/>
        <button onClick={() => downloadWord(policy, form.orgName, form.framework, form.policyType, lang)}
          style={{ padding:"9px 20px", background:"linear-gradient(135deg,#10b981,#059669)",
            border:"none", borderRadius:9, fontSize:13, fontWeight:800, color:"#fff",
            cursor:"pointer", display:"flex", alignItems:"center", gap:8,
            boxShadow:"0 4px 14px #10b98130" }}>
          <span style={{ fontSize:16 }}>⬇</span>
          {isRTL ? "تحميل Word (.doc)" : "Download Word (.doc)"}
        </button>
      </div>

      {/* Document header card */}
      <div style={{ background:"linear-gradient(135deg,#0f172a,#1a2744)", border:"1px solid #1e293b",
        borderRadius:14, padding:"26px 28px", marginBottom:14, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180,
          background:fw.color+"0a", borderRadius:"50%", pointerEvents:"none" }}/>
        <div style={{ position:"relative" }}>
          {/* Tags row */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:14 }}>
            {[policy.policyRef, `v${policy.version}`, policy.classification, form.framework].map(tag => (
              <span key={tag} style={{ padding:"3px 10px", background:"#ffffff10", color:"#94a3b8",
                borderRadius:5, fontSize:11, fontWeight:700 }}>{tag}</span>
            ))}
          </div>
          <div style={{ fontSize:21, fontWeight:900, color:"#f1f5f9", marginBottom:5, lineHeight:1.2 }}>
            {policy.policyTitle}
          </div>
          <div style={{ fontSize:12, color:"#475569", marginBottom:18, fontWeight:600 }}>
            {form.orgName} · {form.industry} · {form.size}
          </div>
          {/* Meta grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
            {[
              [isRTL?"ساري من":"Effective",      policy.effectiveDate],
              [isRTL?"مراجعة":"Review",           policy.reviewDate],
              [isRTL?"مالك السياسة":"Owner",      policy.owner],
              [isRTL?"المعتمِد":"Approver",        policy.approver],
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <div style={{ color:"#334155", fontSize:10, fontWeight:700,
                  textTransform:"uppercase", letterSpacing:"0.08em" }}>{lbl}</div>
                <div style={{ color:"#cbd5e1", fontSize:11, fontWeight:600, marginTop:3,
                  lineHeight:1.4 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Purpose */}
      <Section accentColor="#0ea5e9" icon="🎯" title={isRTL ? "1. الغرض" : "1. Purpose"}>
        <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.8, margin:0 }}>{policy.purpose}</p>
      </Section>

      {/* 2. Scope */}
      <Section accentColor="#8b5cf6" icon="🔭" title={isRTL ? "2. النطاق" : "2. Scope"}>
        <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.8, margin:0 }}>{policy.scope}</p>
      </Section>

      {/* 3. Roles */}
      <Section accentColor="#f59e0b" icon="👥" title={isRTL ? "3. الأدوار والمسؤوليات" : "3. Roles & Responsibilities"}>
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {(policy.roles || []).map((r, i) => (
            <div key={i} style={{ display:"flex", gap:0, borderRadius:9, overflow:"hidden",
              border:"1px solid #1a2744" }}>
              <div style={{ padding:"10px 14px", background:"#f59e0b10", minWidth:160,
                fontSize:12, fontWeight:800, color:"#f59e0b", flexShrink:0,
                borderRight: isRTL ? "none":"1px solid #1a2744",
                borderLeft:  isRTL ? "1px solid #1a2744":"none" }}>
                {r.role}
              </div>
              <div style={{ padding:"10px 14px", fontSize:12, color:"#64748b", lineHeight:1.6,
                background:"#080e1c" }}>
                {r.responsibility}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 4. Policy Statements */}
      <Section accentColor="#10b981" icon="📋" title={isRTL ? "4. بنود السياسة" : "4. Policy Statements"}>
        <div style={{ padding:"9px 13px", background:"#f59e0b08", border:"1px solid #f59e0b20",
          borderRadius:8, fontSize:11, color:"#f59e0b", marginBottom:14 }}>
          {isRTL
            ? "جميع البنود إلزامية — يجب / يُحظر تشير إلى متطلبات غير قابلة للتفاوض."
            : "All statements are mandatory requirements — SHALL / MUST / MUST NOT are non-negotiable."}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {(policy.policyStatements || []).map((sec, i) => (
            <div key={i} style={{ background:"#080e1c", borderRadius:10, padding:"14px 16px",
              border:"1px solid #1a2744" }}>
              <div style={{ fontSize:13, fontWeight:800, color:"#e2e8f0", marginBottom:10,
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:22, height:22, borderRadius:6, background:"#10b98120",
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, fontWeight:800, color:"#10b981", flexShrink:0 }}>
                  {i + 1}
                </span>
                {sec.sectionTitle}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {(sec.statements || []).map((stmt, j) => (
                  <div key={j} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ color:"#10b981", fontSize:12, fontWeight:900,
                      flexShrink:0, marginTop:2 }}>→</span>
                    <span style={{ fontSize:12, color:"#64748b", lineHeight:1.7 }}>{stmt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Framework Mapping */}
      <Section accentColor={fw.color} icon="🗺️"
        title={isRTL ? `5. التوافق مع ${form.framework}` : `5. ${form.framework} Framework Mapping`}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <span style={{ padding:"3px 10px", background:fw.color+"20", color:fw.color,
            borderRadius:5, fontSize:11, fontWeight:700 }}>{fw.badge}</span>
          <span style={{ fontSize:11, color:"#475569" }}>{form.framework}</span>
        </div>
        <p style={{ fontSize:13, color:"#94a3b8", lineHeight:1.8, margin:0 }}>{policy.frameworkMapping}</p>
      </Section>

      {/* 6. Exceptions & Enforcement */}
      <Section accentColor="#ef4444" icon="⚖️"
        title={isRTL ? "6. الاستثناءات والإنفاذ" : "6. Exceptions & Enforcement"}>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ padding:"12px 14px", background:"#f59e0b08",
            border:"1px solid #f59e0b25", borderRadius:9 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#f59e0b", marginBottom:5,
              textTransform:"uppercase", letterSpacing:"0.07em" }}>
              {isRTL ? "الاستثناءات" : "Exceptions"}
            </div>
            <p style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7, margin:0 }}>{policy.exceptions}</p>
          </div>
          <div style={{ padding:"12px 14px", background:"#ef444408",
            border:"1px solid #ef444425", borderRadius:9 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#ef4444", marginBottom:5,
              textTransform:"uppercase", letterSpacing:"0.07em" }}>
              {isRTL ? "الإنفاذ" : "Enforcement"}
            </div>
            <p style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7, margin:0 }}>{policy.enforcement}</p>
          </div>
        </div>
      </Section>

      {/* 7. Definitions */}
      <Section accentColor="#6366f1" icon="📖" title={isRTL ? "7. التعريفات" : "7. Definitions"}>
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {(policy.definitions || []).map((d, i) => (
            <div key={i} style={{ display:"flex", gap:0, borderRadius:8, overflow:"hidden",
              border:"1px solid #1a2744" }}>
              <div style={{ padding:"10px 14px", background:"#6366f110", minWidth:150,
                fontSize:12, fontWeight:800, color:"#6366f1", flexShrink:0,
                borderRight: isRTL?"none":"1px solid #1a2744",
                borderLeft:  isRTL?"1px solid #1a2744":"none" }}>
                {d.term}
              </div>
              <div style={{ padding:"10px 14px", fontSize:12, color:"#64748b",
                lineHeight:1.65, background:"#080e1c" }}>
                {d.definition}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 8. Related Documents */}
      <Section accentColor="#0ea5e9" icon="🔗" title={isRTL ? "8. الوثائق ذات الصلة" : "8. Related Documents"}>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {(policy.relatedDocuments || []).map((doc, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
              background:"#080e1c", borderRadius:8, border:"1px solid #1a2744" }}>
              <span style={{ color:"#0ea5e9", flexShrink:0 }}>📄</span>
              <span style={{ fontSize:12, color:"#64748b" }}>{doc}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Bottom download CTA */}
      <div style={{ background:"linear-gradient(135deg,#064e3b,#065f46)",
        border:"1px solid #10b98130", borderRadius:12, padding:"18px 22px",
        display:"flex", alignItems:"center", gap:16, marginTop:4 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, color:"#f1f5f9", marginBottom:3 }}>
            {isRTL ? "الوثيقة جاهزة للتحميل" : "Your policy document is ready"}
          </div>
          <div style={{ fontSize:11, color:"#6ee7b7" }}>
            {form.orgName} · {polMeta.ref} · Word (.doc)
          </div>
        </div>
        <button onClick={() => downloadWord(policy, form.orgName, form.framework, form.policyType, lang)}
          style={{ padding:"11px 26px", background:"#10b981", border:"none", borderRadius:9,
            color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer", flexShrink:0 }}>
          ⬇ {isRTL ? "تحميل Word" : "Download Word"}
        </button>
      </div>

    </div>
  );
}
