import { useState, useEffect } from "react";

const FRAMEWORKS = {
  "ISO 27001:2022": { color:"#0ea5e9", badge:"ISO"  },
  "NIST CSF 2.0":   { color:"#8b5cf6", badge:"NIST" },
  "PCI-DSS v4.0":   { color:"#f59e0b", badge:"PCI"  },
  "GDPR":           { color:"#10b981", badge:"GDPR" },
  "SOC 2":          { color:"#ef4444", badge:"SOC2" },
};

// Full ISO 27001:2022 + PCI-DSS v4.0 policy coverage — 20 policies
// Grouped by category for the UI selector
const POLICY_GROUPS = [
  {
    group: "Core & Foundation",
    groupAr: "الأساسية والتأسيسية",
    policies: [
      "Information Security Policy",
      "Acceptable Use Policy",
      "Risk Assessment Policy",
      "Human Resources Security Policy",
    ]
  },
  {
    group: "Access & Identity",
    groupAr: "الوصول والهوية",
    policies: [
      "Access Control Policy",
      "Password Policy",
    ]
  },
  {
    group: "Data Protection",
    groupAr: "حماية البيانات",
    policies: [
      "Data Classification Policy",
      "Cryptography Policy",
      "Data Retention & Disposal Policy",
      "Backup & Recovery Policy",
    ]
  },
  {
    group: "Infrastructure & Operations",
    groupAr: "البنية التحتية والعمليات",
    policies: [
      "Network Security Policy",
      "Physical Security Policy",
      "Asset Management Policy",
      "Logging & Monitoring Policy",
    ]
  },
  {
    group: "Development & Change",
    groupAr: "التطوير والتغيير",
    policies: [
      "Vulnerability Management Policy",
      "Secure Development Policy",
      "Change Management Policy",
    ]
  },
  {
    group: "Incident & Continuity",
    groupAr: "الحوادث والاستمرارية",
    policies: [
      "Incident Response Policy",
      "Business Continuity Policy",
    ]
  },
  {
    group: "Supply Chain",
    groupAr: "سلسلة التوريد",
    policies: [
      "Supplier & Third-Party Security Policy",
    ]
  },
];

const POLICY_CATALOGUE = {
  // ── Core & Foundation ──────────────────────────────────────────────────────
  "Information Security Policy":          { ref:"POL-ISP-001", icon:"🔒", sans:"EISP",                       iso:"A.5.1",   pci:"12.1"  },
  "Acceptable Use Policy":                { ref:"POL-AUP-002", icon:"✅", sans:"Acceptable Use Policy",       iso:"A.5.10",  pci:"12.4"  },
  "Risk Assessment Policy":               { ref:"POL-RAP-003", icon:"⚠️", sans:"Risk Assessment Policy",      iso:"Cl. 6.1", pci:"12.3"  },
  "Human Resources Security Policy":      { ref:"POL-HRP-004", icon:"👥", sans:"Personnel Security Policy",   iso:"A.6",     pci:"12.6"  },
  // ── Access & Identity ──────────────────────────────────────────────────────
  "Access Control Policy":                { ref:"POL-ACP-005", icon:"🔑", sans:"Access Control Policy",       iso:"A.5.15",  pci:"7"     },
  "Password Policy":                      { ref:"POL-PWD-006", icon:"🔐", sans:"Password Protection Policy",  iso:"A.5.17",  pci:"8"     },
  // ── Data Protection ────────────────────────────────────────────────────────
  "Data Classification Policy":           { ref:"POL-DCP-007", icon:"🗂️", sans:"Data Classification Policy",  iso:"A.5.12",  pci:"3"     },
  "Cryptography Policy":                  { ref:"POL-CRP-008", icon:"🔏", sans:"Encryption Policy",            iso:"A.8.24",  pci:"3.5"   },
  "Data Retention & Disposal Policy":     { ref:"POL-DRP-009", icon:"🗑️", sans:"Data Retention Policy",       iso:"A.5.33",  pci:"3.2"   },
  "Backup & Recovery Policy":             { ref:"POL-BRP-010", icon:"💾", sans:"Data Backup Policy",           iso:"A.8.13",  pci:"3.1"   },
  // ── Infrastructure & Operations ────────────────────────────────────────────
  "Network Security Policy":              { ref:"POL-NSP-011", icon:"🌐", sans:"Network Security Policy",      iso:"A.8.20",  pci:"1"     },
  "Physical Security Policy":             { ref:"POL-PSP-012", icon:"🏢", sans:"Physical Security Policy",     iso:"A.7",     pci:"9"     },
  "Asset Management Policy":              { ref:"POL-AMP-013", icon:"📦", sans:"Asset Inventory Policy",       iso:"A.5.9",   pci:"2"     },
  "Logging & Monitoring Policy":          { ref:"POL-LMP-014", icon:"📊", sans:"Audit Logging Policy",         iso:"A.8.15",  pci:"10"    },
  // ── Development & Change ───────────────────────────────────────────────────
  "Vulnerability Management Policy":      { ref:"POL-VMP-015", icon:"🛡️", sans:"Vulnerability Management",    iso:"A.8.8",   pci:"6"     },
  "Secure Development Policy":            { ref:"POL-SDP-016", icon:"💻", sans:"Secure Coding Policy",         iso:"A.8.25",  pci:"6.2"   },
  "Change Management Policy":             { ref:"POL-CMP-017", icon:"🔄", sans:"Change Management Policy",     iso:"A.8.32",  pci:"6.5"   },
  // ── Incident & Continuity ──────────────────────────────────────────────────
  "Incident Response Policy":             { ref:"POL-IRP-018", icon:"🚨", sans:"Incident Response Policy",     iso:"A.5.24",  pci:"12.10" },
  "Business Continuity Policy":           { ref:"POL-BCP-019", icon:"♻️", sans:"Business Continuity Policy",  iso:"A.5.29",  pci:"12.10" },
  // ── Supply Chain ───────────────────────────────────────────────────────────
  "Supplier & Third-Party Security Policy": { ref:"POL-SSP-020", icon:"🤝", sans:"Third-Party Security Policy", iso:"A.5.19", pci:"12.8" },
};

function safeJSON(raw) {
  try {
    // Strip markdown fences if present
    let t = raw.trim()
      .replace(/^```(?:json)?[\r\n]*/i, "")
      .replace(/[\r\n]*```\s*$/i, "")
      .trim();

    // Find the start of the root JSON object
    const s = t.indexOf("{");
    if (s < 0) return null;

    // Use brace-depth matching to find the true closing } of the root object.
    // Safer than lastIndexOf("}") which lands inside a nested object
    // when the response is truncated mid-JSON.
    let depth = 0, end = -1, inStr = false, escape = false;
    for (let i = s; i < t.length; i++) {
      const ch = t[i];
      if (escape)          { escape = false; continue; }
      if (ch === "\\")     { escape = true;  continue; }
      if (ch === "\"")     { inStr = !inStr; continue; }
      if (inStr)           continue;
      if (ch === "{")      depth++;
      else if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
    }

    // If we never closed the root object the response was truncated — bail out
    if (end < 0) return null;

    const obj = JSON.parse(t.slice(s, end + 1));

    // Safety net: strip any audit/gap fields Llama might have added
    ["complianceScore","maturityLevel","frameworkAlignment",
     "riskFindings","auditFindings","findings","gaps"].forEach(k => delete obj[k]);
    return obj;
  } catch { return null; }
}

// ── Prompt: minimal schema, Llama-friendly, no negative instructions ──────────
function makePrompt(f, lang) {
  const ar   = lang === "ar";
  const meta = POLICY_CATALOGUE[f.policyType] || { ref:"POL-001", sans:"Security Policy" };

  return `You are a professional policy writer using the SANS Institute template.
${ar ? "Write all text fields in Arabic. Keep codes and dates in English." : "Write in English."}

Write a ${f.policyType} for ${f.orgName} (${f.industry}, ${f.size}) aligned to ${f.framework}.

Output ONLY this JSON. Start with { and end with }. No other text.

{
  "policyTitle": "full official title",
  "policyRef": "${meta.ref}",
  "version": "1.0",
  "effectiveDate": "2025-03-01",
  "reviewDate": "2026-03-01",
  "owner": "job title of policy owner",
  "approver": "job title of approver",
  "classification": "${ar ? "داخلي — سري" : "Internal — Confidential"}",
  "purpose": "2 sentences: why this policy exists",
  "scope": "2 sentences: who and what this policy covers",
  "roles": [
    { "role": "job title", "responsibility": "their duty under this policy" },
    { "role": "job title", "responsibility": "their duty" },
    { "role": "job title", "responsibility": "their duty" }
  ],
  "policyStatements": [
    {
      "sectionTitle": "e.g. 5.1 User Access Management",
      "statements": [
        "All users SHALL have unique accounts.",
        "Privileged access MUST be approved by the CISO.",
        "Shared accounts MUST NOT be used."
      ]
    },
    {
      "sectionTitle": "next section",
      "statements": ["statement 1", "statement 2", "statement 3"]
    },
    {
      "sectionTitle": "next section",
      "statements": ["statement 1", "statement 2", "statement 3"]
    },
    {
      "sectionTitle": "next section",
      "statements": ["statement 1", "statement 2", "statement 3"]
    }
  ],
  "frameworkMapping": "2 sentences naming specific ${f.framework} controls this policy satisfies",
  "exceptions": "1 sentence on how exceptions are requested",
  "enforcement": "1 sentence on consequences of violation",
  "definitions": [
    { "term": "term", "definition": "definition" },
    { "term": "term", "definition": "definition" },
    { "term": "term", "definition": "definition" }
  ],
  "relatedDocuments": ["Document 1", "Document 2", "Document 3"]
}`;
}

// ── Word (.doc) export ────────────────────────────────────────────────────────
function downloadWord(policy, orgName, framework, policyType, lang) {
  const ar  = lang === "ar";
  const dir = ar ? "rtl" : "ltr";
  const fw  = FRAMEWORKS[framework] || { color:"#1B3A6B" };
  const L   = (en, arabic) => ar ? arabic : en;
  const today = new Date().toLocaleDateString(ar ? "ar-SA" : "en-GB",
    { year:"numeric", month:"long", day:"numeric" });

  const sectionsHTML = (policy.policyStatements || []).map((sec, idx) => `
    <h3 style="color:#1B3A6B;font-size:12pt;margin:14pt 0 5pt;padding-bottom:3pt;border-bottom:1px solid #e2e8f0;">
      ${idx + 5}. ${sec.sectionTitle}
    </h3>
    <ul style="margin:0 0 10pt;padding-${ar ? "right" : "left"}:18pt;">
      ${(sec.statements || []).map(s => `<li style="margin-bottom:4pt;line-height:1.65;">${s}</li>`).join("")}
    </ul>`
  ).join("");

  const rolesHTML = (policy.roles || []).map(r => `
    <tr>
      <td style="padding:6pt 10pt;border:1pt solid #d1d5db;font-weight:bold;width:32%;background:#f8fafc;vertical-align:top;">${r.role}</td>
      <td style="padding:6pt 10pt;border:1pt solid #d1d5db;vertical-align:top;">${r.responsibility}</td>
    </tr>`).join("");

  const defsHTML = (policy.definitions || []).map(d => `
    <tr>
      <td style="padding:6pt 10pt;border:1pt solid #d1d5db;font-weight:bold;width:28%;background:#f8fafc;vertical-align:top;">${d.term}</td>
      <td style="padding:6pt 10pt;border:1pt solid #d1d5db;vertical-align:top;">${d.definition}</td>
    </tr>`).join("");

  const relatedHTML = (policy.relatedDocuments || [])
    .map(r => `<li style="margin-bottom:4pt;">${r}</li>`).join("");

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>${policy.policyTitle}</title>
  <!--[if gte mso 9]><xml><w:WordDocument>
    <w:View>Print</w:View><w:Zoom>90</w:Zoom>
  </w:WordDocument></xml><![endif]-->
  <style>
    @page { margin: 2.5cm 2.5cm 2cm; }
    body  { font-family:Arial,sans-serif; font-size:11pt; color:#1e293b; direction:${dir}; line-height:1.55; }
    h1    { font-size:19pt; color:#fff; margin:0 0 6pt; }
    h2    { font-size:13pt; color:#1B3A6B; margin:18pt 0 7pt; border-bottom:2pt solid #1B3A6B; padding-bottom:4pt; page-break-after:avoid; }
    h3    { font-size:11.5pt; color:#1B3A6B; margin:12pt 0 4pt; }
    p     { margin:0 0 8pt; }
    table { width:100%; border-collapse:collapse; margin:8pt 0 14pt; font-size:10.5pt; }
    td,th { padding:6pt 10pt; border:1pt solid #d1d5db; vertical-align:top; }
    th    { background:#1B3A6B; color:#fff; font-weight:bold; text-align:${ar ? "right" : "left"}; }
    ul    { margin:4pt 0 10pt; }
    li    { margin-bottom:3pt; line-height:1.6; }
    .cover{ background:#1B3A6B; color:#fff; padding:26pt 30pt 22pt; }
    .cover .sub { font-size:10pt; color:#93c5fd; margin-bottom:6pt; }
    .cover .ref { font-size:9pt; color:#7dd3fc; margin-top:8pt; font-family:monospace; }
    .meta td    { border:none; padding:3pt 8pt; font-size:10pt; }
    .meta .lbl  { font-weight:bold; color:#64748b; font-size:9pt; text-transform:uppercase; letter-spacing:.04em; width:33%; }
    .notice     { background:#fffbeb; border-${ar ? "right" : "left"}:3pt solid #f59e0b; padding:8pt 12pt; margin:8pt 0; font-size:10pt; color:#78350f; }
    .footer     { font-size:8pt; color:#94a3b8; text-align:center; margin-top:28pt; border-top:1pt solid #e2e8f0; padding-top:8pt; }
  </style>
</head>
<body>
<div class="cover">
  <div class="sub">${orgName} &nbsp;·&nbsp; ${policyType}</div>
  <h1>${policy.policyTitle}</h1>
  <div class="ref">${policy.policyRef} &nbsp;·&nbsp; ${L("Version","الإصدار")} ${policy.version} &nbsp;·&nbsp; ${policy.classification}</div>
</div>

<h2>1. ${L("Document Control","معلومات الوثيقة")}</h2>
<table class="meta">
  <tr>
    <td class="lbl">${L("Reference","المرجع")}</td><td>${policy.policyRef}</td>
    <td class="lbl">${L("Version","الإصدار")}</td><td>${policy.version}</td>
  </tr>
  <tr>
    <td class="lbl">${L("Effective","تاريخ السريان")}</td><td>${policy.effectiveDate}</td>
    <td class="lbl">${L("Next Review","المراجعة")}</td><td>${policy.reviewDate}</td>
  </tr>
  <tr>
    <td class="lbl">${L("Owner","المالك")}</td><td>${policy.owner}</td>
    <td class="lbl">${L("Approver","المعتمِد")}</td><td>${policy.approver}</td>
  </tr>
  <tr>
    <td class="lbl">${L("Classification","التصنيف")}</td><td>${policy.classification}</td>
    <td class="lbl">${L("Framework","الإطار")}</td><td>${framework}</td>
  </tr>
</table>

<h2>2. ${L("Purpose","الغرض")}</h2>
<p>${policy.purpose}</p>

<h2>3. ${L("Scope","النطاق")}</h2>
<p>${policy.scope}</p>

<h2>4. ${L("Roles & Responsibilities","الأدوار والمسؤوليات")}</h2>
<table>
  <tr>
    <th style="width:32%">${L("Role","الدور")}</th>
    <th>${L("Responsibility","المسؤولية")}</th>
  </tr>
  ${rolesHTML}
</table>

<h2>5. ${L("Policy Statements","بنود السياسة")}</h2>
<div class="notice">
  ${L("All statements are mandatory. SHALL and MUST indicate required actions; MUST NOT indicates prohibited actions.",
      "جميع البنود إلزامية. يجب تعني الإلزام؛ يُحظر تعني الحظر.")}
</div>
${sectionsHTML}

<h2>${L("Framework Alignment","التوافق التنظيمي")}</h2>
<p><strong>${framework}:</strong> ${policy.frameworkMapping}</p>

<h2>${L("Exceptions","الاستثناءات")}</h2>
<p>${policy.exceptions}</p>

<h2>${L("Enforcement","الإنفاذ")}</h2>
<p>${policy.enforcement}</p>

<h2>${L("Definitions","التعريفات")}</h2>
<table>
  <tr>
    <th style="width:28%">${L("Term","المصطلح")}</th>
    <th>${L("Definition","التعريف")}</th>
  </tr>
  ${defsHTML}
</table>

<h2>${L("Related Documents","الوثائق ذات الصلة")}</h2>
<ul>${relatedHTML}</ul>

<h2>${L("Revision History","سجل المراجعات")}</h2>
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
    <td>${L("Initial release","الإصدار الأولي")}</td>
  </tr>
</table>

<div class="footer">
  ${orgName} &nbsp;·&nbsp; ${policy.policyRef} &nbsp;·&nbsp;
  ${L("Internal Confidential — Do not distribute without authorisation",
      "وثيقة داخلية سرية — لا توزع دون إذن")}
   &nbsp;·&nbsp; ${today}
</div>
</body></html>`;

  const blob = new Blob(["\ufeff" + html], { type:"application/msword;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${orgName.replace(/\s+/g,"_").replace(/[^\w-]/g,"")}_${policy.policyRef}_v1.0.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── D1 policy session helpers ────────────────────────────────────────────────
const POLICY_KEY = "autoaudit_policy_session_id";
function loadPolicyId()   { try { return localStorage.getItem(POLICY_KEY); } catch { return null; } }
function savePolicyId(id) { try { localStorage.setItem(POLICY_KEY, id); } catch {} }
function clearPolicyId()  { try { localStorage.removeItem(POLICY_KEY); } catch {} }
function genPolicyId()    { return "pol_" + Date.now() + "_" + Math.random().toString(36).slice(2,8); }

async function dbSavePolicy(id, form, result, lang) {
  try {
    await fetch("/api/policy-session", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        action:"save", id,
        org_name:form.orgName, industry:form.industry, size:form.size,
        framework:form.framework, policy_type:form.policyType, lang,
        result
      })
    });
  } catch {}
}
async function dbLoadPolicy(id) {
  try {
    const res  = await fetch("/api/policy-session?id=" + id);
    const data = await res.json();
    return data.ok ? data.policy : null;
  } catch { return null; }
}
async function dbDeletePolicy(id) {
  try { await fetch("/api/policy-session?id=" + id, { method:"DELETE" }); } catch {}
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PolicyModule({ t, isRTL, lang }) {
  const [step,      setStep]      = useState("checking"); // checking|resume|form|loading|result
  const [form,      setForm]      = useState({ orgName:"", industry:"", size:"", framework:"", policyType:"" });
  const [policy,    setPolicy]    = useState(null);
  const [error,     setError]     = useState("");
  const [savedMeta, setSavedMeta] = useState(null); // {orgName, policyType, framework, policyRef, id}
  const [saveStatus,setSaveStatus]= useState("idle"); // idle|saving|saved|error

  const fw      = FRAMEWORKS[form.framework] || { color:"#0ea5e9" };
  const polMeta = POLICY_CATALOGUE[form.policyType] || {};

  // On mount: check for a saved policy session
  useEffect(() => {
    const storedId = loadPolicyId();
    if (!storedId) { setStep("form"); return; }
    dbLoadPolicy(storedId).then(session => {
      if (session?.policy) {
        setSavedMeta({
          id:         storedId,
          orgName:    session.org_name,
          policyType: session.policy_type,
          framework:  session.framework,
          policyRef:  session.policy_ref,
          updatedAt:  session.updated_at,
        });
        setStep("resume");
      } else {
        clearPolicyId();
        setStep("form");
      }
    }).catch(() => setStep("form"));
  }, []);

  async function generate() {
    if (!form.orgName||!form.industry||!form.size||!form.framework||!form.policyType) {
      setError(t.fillAllFields); return;
    }
    setError(""); setStep("loading");
    try {
      const res    = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages:[{ role:"user", content:makePrompt(form,lang) }] })
      });
      if (!res.ok) throw new Error("API " + res.status);
      const data   = await res.json();
      const raw    = (data.content||[]).map(b=>b.text||"").join("");
      const parsed = safeJSON(raw);
      if (!parsed||!parsed.policyStatements) throw new Error(t.parseError);

      // Save to D1
      setSaveStatus("saving");
      const sid = genPolicyId();
      savePolicyId(sid);
      await dbSavePolicy(sid, form, parsed, lang);
      setSaveStatus("saved");

      setPolicy(parsed); setStep("result");
    } catch(e) { setError("Error: "+e.message); setStep("form"); setSaveStatus("idle"); }
  }

  async function resumeSaved() {
    if (!savedMeta) return;
    setStep("checking");
    const session = await dbLoadPolicy(savedMeta.id);
    if (session?.policy) {
      setForm({
        orgName:    session.org_name,
        industry:   session.industry,
        size:       session.size,
        framework:  session.framework,
        policyType: session.policy_type,
      });
      setPolicy(session.policy);
      setSaveStatus("saved");
      setStep("result");
    } else {
      clearPolicyId();
      setStep("form");
    }
  }

  function startNew() {
    const oldId = loadPolicyId();
    if (oldId) dbDeletePolicy(oldId);
    clearPolicyId();
    setPolicy(null); setSavedMeta(null);
    setForm({ orgName:"", industry:"", size:"", framework:"", policyType:"" });
    setStep("form");
  }

  function reset() {
    const id = loadPolicyId();
    if (id) dbDeletePolicy(id);
    clearPolicyId();
    setStep("form"); setPolicy(null); setError(""); setSaveStatus("idle"); setSavedMeta(null);
    setForm({ orgName:"", industry:"", size:"", framework:"", policyType:"" });
  }

  // ── small helpers ──
  function Lbl({ children }) {
    return <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",
      marginBottom:6,textTransform:"uppercase",letterSpacing:"0.07em"}}>{children} *</label>;
  }
  function FSelect({ label, value, onChange, options, placeholder }) {
    return (
      <div>
        <Lbl>{label}</Lbl>
        <select value={value} onChange={e=>onChange(e.target.value)}
          style={{width:"100%",padding:"10px 13px",border:"1.5px solid #1e293b",borderRadius:9,
            fontSize:13,background:"#0f172a",color:value?"#e2e8f0":"#475569",
            fontFamily:"inherit",cursor:"pointer",textAlign:isRTL?"right":"left",boxSizing:"border-box"}}>
          <option value="">{placeholder}</option>
          {options.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  function Card({ accentColor, icon, title, children }) {
    return (
      <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:20,marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,color:"#475569",letterSpacing:"0.08em",
          textTransform:"uppercase",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:3,height:13,background:accentColor,borderRadius:2,display:"inline-block"}}/>
          {icon} {title}
        </div>
        {children}
      </div>
    );
  }

  // ── CHECKING spinner ──────────────────────────────────────────────────────
  if (step==="checking") return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300}}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{position:"relative",width:40,height:40}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid #1e293b"}}/>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid transparent",borderTopColor:"#0ea5e9",animation:"sp 0.9s linear infinite"}}/>
      </div>
    </div>
  );

  // ── RESUME banner ──────────────────────────────────────────────────────────
  if (step==="resume" && savedMeta) {
    const savedFw = FRAMEWORKS[savedMeta.framework] || { color:"#0ea5e9", badge:"?" };
    const savedMd = POLICY_CATALOGUE[savedMeta.policyType] || { icon:"📄" };
    const savedDate = savedMeta.updatedAt
      ? new Date(savedMeta.updatedAt).toLocaleDateString(isRTL?"ar-SA":"en-GB",{day:"numeric",month:"short",year:"numeric"})
      : "";
    return (
      <div style={{maxWidth:540}} dir={isRTL?"rtl":"ltr"}>
        <h2 style={{fontSize:22,fontWeight:900,color:"#f1f5f9",marginBottom:6}}>{t.policyTitle}</h2>
        <p style={{color:"#475569",fontSize:13,marginBottom:20}}>
          {isRTL?"أنشئ وثيقة سياسة احترافية وفق قالب SANS.":"Generate a complete professional policy document using the SANS Institute template."}
        </p>

        <div style={{background:"#0f172a",border:"1px solid #0ea5e940",borderRadius:14,padding:24,marginBottom:14,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#0ea5e9,#8b5cf6)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#0ea5e9,#0284c7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>💾</div>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:"#f1f5f9"}}>{isRTL?"سياسة محفوظة":"Saved Policy Found"}</div>
              <div style={{fontSize:11,color:"#475569"}}>{isRTL?"يمكنك استعادة وثيقتك الأخيرة":"Restore your last generated document"}</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[
              [isRTL?"المنظمة":"Organization",  savedMeta.orgName],
              [isRTL?"الإطار":"Framework",       savedMeta.framework],
              [isRTL?"نوع السياسة":"Policy",     savedMeta.policyType],
              [isRTL?"المرجع":"Reference",        savedMeta.policyRef || "—"],
            ].map(([l,v])=>(
              <div key={l} style={{background:"#080e1c",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",lineHeight:1.3}}>{v}</div>
              </div>
            ))}
          </div>

          {savedDate && (
            <div style={{fontSize:11,color:"#334155",marginBottom:14,display:"flex",alignItems:"center",gap:5}}>
              <span style={{color:"#22c55e"}}>●</span>
              {isRTL?"آخر حفظ: ":"Last saved: "}{savedDate} · Cloudflare D1
            </div>
          )}

          <div style={{display:"flex",gap:10}}>
            <button onClick={resumeSaved}
              style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#0ea5e9,#0284c7)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}>
              {savedMd.icon} {isRTL?"استعادة السياسة":"Restore Policy"}
            </button>
            <button onClick={startNew}
              style={{padding:"11px 16px",background:"#1e293b",border:"1px solid #334155",borderRadius:9,color:"#94a3b8",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              {isRTL?"سياسة جديدة":"New Policy"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  if (step==="form"||step==="loading") return (
    <div style={{maxWidth:680,animation:"fadeUp 0.3s ease"}} dir={isRTL?"rtl":"ltr"}>
      <div style={{marginBottom:22}}>
        <h2 style={{fontSize:22,fontWeight:900,color:"#f1f5f9",marginBottom:6}}>{t.policyTitle}</h2>
        <p style={{color:"#475569",fontSize:13,lineHeight:1.7}}>
          {isRTL
            ? "أنشئ وثيقة سياسة احترافية وفق قالب SANS — مع تصدير Word باسم شركتك."
            : "Generate a complete professional policy document using the SANS Institute template — exported as a branded Word file."}
        </p>
      </div>

      {/* Banner */}
      <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:11,
        padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:9,background:"linear-gradient(135deg,#0ea5e9,#0284c7)",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📄</div>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:800,color:"#e2e8f0"}}>
            {isRTL?"قالب SANS المعياري":"SANS Institute Policy Template"}
          </div>
          <div style={{fontSize:11,color:"#475569",marginTop:2}}>
            {isRTL
              ?"الغرض · النطاق · الأدوار · بنود السياسة · التوافق التنظيمي · التعريفات · سجل المراجعات"
              :"Purpose · Scope · Roles · Policy Statements · Framework Mapping · Definitions · Revision History"}
          </div>
        </div>
        <div style={{padding:"4px 10px",background:"#10b98115",color:"#10b981",
          border:"1px solid #10b98130",borderRadius:6,fontSize:10,fontWeight:700,flexShrink:0}}>
          ⬇ .doc
        </div>
      </div>

      {/* Form card */}
      <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:14,padding:24,marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:800,color:"#334155",letterSpacing:"0.1em",
          textTransform:"uppercase",marginBottom:20,display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:3,height:13,background:"#0ea5e9",borderRadius:2,display:"inline-block"}}/>
          {t.orgDetails}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{gridColumn:"1/-1"}}>
            <Lbl>{t.orgName}</Lbl>
            <input value={form.orgName} onChange={e=>setForm(f=>({...f,orgName:e.target.value}))}
              placeholder={t.orgNamePlaceholder}
              style={{width:"100%",padding:"10px 13px",border:"1.5px solid #1e293b",borderRadius:9,
                fontSize:13,background:"#0f172a",color:"#e2e8f0",fontFamily:"inherit",
                textAlign:isRTL?"right":"left",boxSizing:"border-box"}}/>
          </div>
          <FSelect label={t.industry}            value={form.industry}   onChange={v=>setForm(f=>({...f,industry:v}))}   options={t.industries}            placeholder={t.industryPlaceholder}/>
          <FSelect label={t.orgSize}             value={form.size}       onChange={v=>setForm(f=>({...f,size:v}))}       options={t.orgSizes}              placeholder={t.orgSizePlaceholder}/>
          <FSelect label={t.complianceFramework} value={form.framework}  onChange={v=>setForm(f=>({...f,framework:v}))}  options={Object.keys(FRAMEWORKS)} placeholder={t.frameworkPlaceholder}/>
        </div>
        {/* Grouped policy type selector — 20 policies across 7 categories */}
        <div style={{marginTop:16}}>
          <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.07em"}}>{t.policyType} *</label>
          <select value={form.policyType} onChange={e=>setForm(f=>({...f,policyType:e.target.value}))}
            style={{width:"100%",padding:"10px 13px",border:"1.5px solid #1e293b",borderRadius:9,
              fontSize:13,background:"#0f172a",color:form.policyType?"#e2e8f0":"#475569",
              fontFamily:"inherit",cursor:"pointer",textAlign:isRTL?"right":"left",boxSizing:"border-box"}}>
            <option value="">{t.policyTypePlaceholder}</option>
            {POLICY_GROUPS.map(g=>(
              <optgroup key={g.group} label={isRTL?g.groupAr:g.group}>
                {g.policies.map(p=>(
                  <option key={p} value={p}>{POLICY_CATALOGUE[p]?.icon} {p}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {form.policyType && (
          <div style={{marginTop:14,padding:"12px 14px",background:fw.color+"08",
            border:`1px solid ${fw.color}20`,borderRadius:9,display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22}}>{polMeta.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:800,color:fw.color}}>
                {polMeta.ref} — {form.policyType}
              </div>
              <div style={{fontSize:11,color:"#475569",marginTop:2,display:"flex",gap:10,flexWrap:"wrap"}}>
                <span>SANS: {polMeta.sans}</span>
                {polMeta.iso&&<span style={{color:"#0ea5e9"}}>ISO {polMeta.iso}</span>}
                {polMeta.pci&&<span style={{color:"#f59e0b"}}>PCI Req.{polMeta.pci}</span>}
                {form.orgName&&<span style={{color:"#64748b"}}>· {form.orgName}</span>}
              </div>
            </div>
            <span style={{padding:"2px 8px",background:fw.color+"20",color:fw.color,
              borderRadius:4,fontSize:10,fontWeight:700}}>{fw.badge}</span>
          </div>
        )}

        {error&&<div style={{marginTop:14,padding:"10px 13px",background:"#7f1d1d20",
          border:"1px solid #ef444440",borderRadius:8,color:"#fca5a5",fontSize:12}}>{error}</div>}
      </div>

      {step==="loading"
        ?<div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:14,
            padding:"48px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
           <div style={{position:"relative",width:52,height:52}}>
             <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid #1e293b"}}/>
             <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid transparent",
               borderTopColor:"#0ea5e9",animation:"sp 0.9s linear infinite"}}/>
             <div style={{position:"absolute",inset:8,borderRadius:"50%",border:"2px solid transparent",
               borderTopColor:"#8b5cf6",animation:"sp 0.7s linear infinite reverse"}}/>
           </div>
           <div style={{textAlign:"center"}}>
             <div style={{fontWeight:700,color:"#e2e8f0"}}>
               {isRTL?"جارٍ كتابة السياسة…":"Writing policy document…"}
             </div>
             <div style={{fontSize:12,color:"#475569",marginTop:4}}>
               {isRTL?"تطبيق قالب SANS":"Applying SANS template"}
             </div>
           </div>
         </div>
        :<button onClick={generate}
           style={{width:"100%",padding:14,background:"linear-gradient(135deg,#0ea5e9,#0284c7)",
             border:"none",borderRadius:11,color:"#fff",fontSize:14,fontWeight:800,
             cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px #0ea5e930"}}>
           ▶ {isRTL?"إنشاء وثيقة السياسة":"Generate Policy Document"}
         </button>
      }
    </div>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (!policy) return null;

  return (
    <div style={{maxWidth:820,animation:"fadeUp 0.3s ease"}} dir={isRTL?"rtl":"ltr"}>

      {/* Action bar */}
      <div style={{display:"flex",gap:10,marginBottom:18,alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={startNew}
          style={{padding:"8px 14px",background:"#0f172a",border:"1px solid #1e293b",
            borderRadius:9,fontSize:12,fontWeight:700,color:"#94a3b8",cursor:"pointer"}}>
          {isRTL?"→ سياسة جديدة":"← New Policy"}
        </button>
        {/* D1 save status */}
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",
          background:"#0f172a",border:"1px solid #1a2744",borderRadius:7}}>
          <style>{`@keyframes sp2{to{transform:rotate(360deg)}}`}</style>
          {saveStatus==="saving" && <div style={{width:6,height:6,borderRadius:"50%",border:"2px solid transparent",borderTopColor:"#f59e0b",animation:"sp2 0.8s linear infinite"}}/>}
          {saveStatus==="saved"  && <span style={{color:"#22c55e",fontSize:10}}>●</span>}
          {saveStatus==="idle"   && <span style={{color:"#475569",fontSize:10}}>●</span>}
          <span style={{fontSize:10,fontWeight:700,color:saveStatus==="saved"?"#22c55e":saveStatus==="saving"?"#f59e0b":"#475569"}}>
            {saveStatus==="saving"?(isRTL?"حفظ…":"Saving…"):saveStatus==="saved"?(isRTL?"محفوظ في D1":"Saved to D1"):"D1"}
          </span>
        </div>
        <div style={{flex:1}}/>
        <button onClick={()=>downloadWord(policy,form.orgName,form.framework,form.policyType,lang)}
          style={{padding:"9px 20px",background:"linear-gradient(135deg,#10b981,#059669)",
            border:"none",borderRadius:9,fontSize:13,fontWeight:800,color:"#fff",
            cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 14px #10b98130"}}>
          ⬇ {isRTL?"تحميل Word (.doc)":"Download Word (.doc)"}
        </button>
      </div>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1a2744)",border:"1px solid #1e293b",
        borderRadius:14,padding:"26px 28px",marginBottom:14,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,
          background:fw.color+"0a",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
            {[policy.policyRef,`v${policy.version}`,policy.classification,form.framework].map(tag=>(
              <span key={tag} style={{padding:"3px 10px",background:"#ffffff10",color:"#94a3b8",
                borderRadius:5,fontSize:11,fontWeight:700}}>{tag}</span>
            ))}
          </div>
          <div style={{fontSize:21,fontWeight:900,color:"#f1f5f9",marginBottom:5,lineHeight:1.2}}>
            {policy.policyTitle}
          </div>
          <div style={{fontSize:12,color:"#475569",marginBottom:18,fontWeight:600}}>
            {form.orgName} · {form.industry} · {form.size}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
            {[
              [isRTL?"ساري من":"Effective",     policy.effectiveDate],
              [isRTL?"مراجعة":"Review",          policy.reviewDate],
              [isRTL?"مالك السياسة":"Owner",     policy.owner],
              [isRTL?"المعتمِد":"Approver",       policy.approver],
            ].map(([lbl,val])=>(
              <div key={lbl}>
                <div style={{color:"#334155",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>{lbl}</div>
                <div style={{color:"#cbd5e1",fontSize:11,fontWeight:600,marginTop:3,lineHeight:1.4}}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Purpose */}
      <Card accentColor="#0ea5e9" icon="🎯" title={isRTL?"1. الغرض":"1. Purpose"}>
        <p style={{fontSize:13,color:"#94a3b8",lineHeight:1.8,margin:0}}>{policy.purpose}</p>
      </Card>

      {/* 2. Scope */}
      <Card accentColor="#8b5cf6" icon="🔭" title={isRTL?"2. النطاق":"2. Scope"}>
        <p style={{fontSize:13,color:"#94a3b8",lineHeight:1.8,margin:0}}>{policy.scope}</p>
      </Card>

      {/* 3. Roles */}
      <Card accentColor="#f59e0b" icon="👥" title={isRTL?"3. الأدوار والمسؤوليات":"3. Roles & Responsibilities"}>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {(policy.roles||[]).map((r,i)=>(
            <div key={i} style={{display:"flex",borderRadius:9,overflow:"hidden",border:"1px solid #1a2744"}}>
              <div style={{padding:"10px 14px",background:"#f59e0b10",minWidth:160,fontSize:12,
                fontWeight:800,color:"#f59e0b",flexShrink:0,
                borderRight:isRTL?"none":"1px solid #1a2744",
                borderLeft:isRTL?"1px solid #1a2744":"none"}}>
                {r.role}
              </div>
              <div style={{padding:"10px 14px",fontSize:12,color:"#64748b",lineHeight:1.6,background:"#080e1c"}}>
                {r.responsibility}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Policy Statements */}
      <Card accentColor="#10b981" icon="📋" title={isRTL?"4. بنود السياسة":"4. Policy Statements"}>
        <div style={{padding:"9px 13px",background:"#f59e0b08",border:"1px solid #f59e0b20",
          borderRadius:8,fontSize:11,color:"#f59e0b",marginBottom:14}}>
          {isRTL
            ?"جميع البنود إلزامية — يجب / يُحظر متطلبات غير قابلة للتفاوض."
            :"All statements are mandatory — SHALL / MUST / MUST NOT are non-negotiable requirements."}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {(policy.policyStatements||[]).map((sec,i)=>(
            <div key={i} style={{background:"#080e1c",borderRadius:10,padding:"14px 16px",border:"1px solid #1a2744"}}>
              <div style={{fontSize:13,fontWeight:800,color:"#e2e8f0",marginBottom:10,
                display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:22,height:22,borderRadius:6,background:"#10b98120",
                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                  fontSize:10,fontWeight:800,color:"#10b981",flexShrink:0}}>{i+1}</span>
                {sec.sectionTitle}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {(sec.statements||[]).map((stmt,j)=>(
                  <div key={j} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <span style={{color:"#10b981",fontSize:12,fontWeight:900,flexShrink:0,marginTop:2}}>→</span>
                    <span style={{fontSize:12,color:"#64748b",lineHeight:1.7}}>{stmt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Framework Mapping */}
      <Card accentColor={fw.color} icon="🗺️"
        title={isRTL?`5. التوافق مع ${form.framework}`:`5. ${form.framework} Framework Mapping`}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{padding:"3px 10px",background:fw.color+"20",color:fw.color,
            borderRadius:5,fontSize:11,fontWeight:700}}>{fw.badge}</span>
        </div>
        <p style={{fontSize:13,color:"#94a3b8",lineHeight:1.8,margin:0}}>{policy.frameworkMapping}</p>
      </Card>

      {/* 6. Exceptions & Enforcement */}
      <Card accentColor="#ef4444" icon="⚖️" title={isRTL?"6. الاستثناءات والإنفاذ":"6. Exceptions & Enforcement"}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{padding:"12px 14px",background:"#f59e0b08",border:"1px solid #f59e0b25",borderRadius:9}}>
            <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",marginBottom:5,textTransform:"uppercase"}}>
              {isRTL?"الاستثناءات":"Exceptions"}
            </div>
            <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.7,margin:0}}>{policy.exceptions}</p>
          </div>
          <div style={{padding:"12px 14px",background:"#ef444408",border:"1px solid #ef444425",borderRadius:9}}>
            <div style={{fontSize:11,fontWeight:700,color:"#ef4444",marginBottom:5,textTransform:"uppercase"}}>
              {isRTL?"الإنفاذ":"Enforcement"}
            </div>
            <p style={{fontSize:12,color:"#94a3b8",lineHeight:1.7,margin:0}}>{policy.enforcement}</p>
          </div>
        </div>
      </Card>

      {/* 7. Definitions */}
      <Card accentColor="#6366f1" icon="📖" title={isRTL?"7. التعريفات":"7. Definitions"}>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {(policy.definitions||[]).map((d,i)=>(
            <div key={i} style={{display:"flex",borderRadius:8,overflow:"hidden",border:"1px solid #1a2744"}}>
              <div style={{padding:"10px 14px",background:"#6366f110",minWidth:150,fontSize:12,
                fontWeight:800,color:"#6366f1",flexShrink:0,
                borderRight:isRTL?"none":"1px solid #1a2744",
                borderLeft:isRTL?"1px solid #1a2744":"none"}}>
                {d.term}
              </div>
              <div style={{padding:"10px 14px",fontSize:12,color:"#64748b",lineHeight:1.65,background:"#080e1c"}}>
                {d.definition}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 8. Related Documents */}
      <Card accentColor="#0ea5e9" icon="🔗" title={isRTL?"8. الوثائق ذات الصلة":"8. Related Documents"}>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {(policy.relatedDocuments||[]).map((doc,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
              background:"#080e1c",borderRadius:8,border:"1px solid #1a2744"}}>
              <span style={{color:"#0ea5e9",flexShrink:0}}>📄</span>
              <span style={{fontSize:12,color:"#64748b"}}>{doc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Download CTA */}
      <div style={{background:"linear-gradient(135deg,#064e3b,#065f46)",border:"1px solid #10b98130",
        borderRadius:12,padding:"18px 22px",display:"flex",alignItems:"center",gap:16,marginTop:4}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,color:"#f1f5f9",marginBottom:3}}>
            {isRTL?"الوثيقة جاهزة للتحميل":"Your policy document is ready"}
          </div>
          <div style={{fontSize:11,color:"#6ee7b7"}}>
            {form.orgName} · {polMeta.ref} · Word (.doc)
          </div>
        </div>
        <button onClick={()=>downloadWord(policy,form.orgName,form.framework,form.policyType,lang)}
          style={{padding:"11px 26px",background:"#10b981",border:"none",borderRadius:9,
            color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",flexShrink:0}}>
          ⬇ {isRTL?"تحميل Word":"Download Word"}
        </button>
      </div>
    </div>
  );
}
