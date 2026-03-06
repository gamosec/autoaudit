import { useState } from "react";

const FRAMEWORKS = {
  "ISO 27001:2022": { color:"#0ea5e9", badge:"ISO",  controls:["A.5 Organizational Controls","A.6 People Controls","A.7 Physical Controls","A.8 Technological Controls"] },
  "NIST CSF 2.0":   { color:"#8b5cf6", badge:"NIST", controls:["GV.OC — Organizational Context","ID.AM — Asset Management","PR.AA — Identity & Access","DE.CM — Continuous Monitoring"] },
  "PCI-DSS v4.0":   { color:"#f59e0b", badge:"PCI",  controls:["Req. 1 — Network Security","Req. 7 — Access Control","Req. 8 — Authentication","Req. 12 — Security Policy"] },
  "GDPR":           { color:"#10b981", badge:"GDPR", controls:["Art. 5 — Processing Principles","Art. 24 — Controller Responsibility","Art. 32 — Security Measures","Art. 37 — DPO Designation"] },
  "SOC 2":          { color:"#ef4444", badge:"SOC2", controls:["CC1 — Control Environment","CC6 — Logical Access","CC7 — System Operations","CC9 — Risk Mitigation"] }
};

const POLICY_TYPES = ["Information Security Policy","Access Control Policy","Data Classification Policy","Incident Response Policy","Acceptable Use Policy"];
const INDUSTRIES   = ["Financial Services","Healthcare","E-Commerce / Retail","Technology / SaaS","Government","Manufacturing","Education"];
const ORG_SIZES    = ["Small (< 50 employees)","Medium (50-500 employees)","Large (500+ employees)"];

const SEV_COLOR  = { Critical:"#dc2626", High:"#ea580c", Medium:"#d97706", Low:"#65a30d" };
const MAT_COLOR  = { Initial:"#ef4444", Developing:"#f59e0b", Defined:"#3b82f6", Managed:"#8b5cf6", Optimising:"#10b981" };
const STAT_STYLE = {
  "Fully Compliant":  { bg:"#dcfce7", color:"#166534", dot:"#22c55e" },
  "Partial Coverage": { bg:"#fef9c3", color:"#854d0e", dot:"#eab308" },
  "Gap Identified":   { bg:"#fee2e2", color:"#991b1b", dot:"#ef4444" },
  "Not Applicable":   { bg:"#f3f4f6", color:"#374151", dot:"#9ca3af" }
};

function safeParseJSON(raw) {
  try {
    let t = raw.trim();
    t = t.replace(/^```(?:json)?[\r\n]*/i, "").replace(/[\r\n]*```\s*$/i, "").trim();
    const s = t.indexOf("{"), e = t.lastIndexOf("}");
    if (s < 0 || e < 0 || e <= s) return null;
    return JSON.parse(t.slice(s, e + 1));
  } catch (_) { return null; }
}

function makePrompt(f) {
  return [
    "You are AutoAudit, an expert cybersecurity GRC AI agent.",
    "",
    "Task: Generate a " + f.policyType + " for " + f.orgName + " (" + f.industry + ", " + f.size + "), aligned to " + f.framework + ".",
    "",
    "CRITICAL: Respond with ONLY a raw JSON object. No markdown. No backtick fences. No explanation. Start your response with { and end with }.",
    "",
    'Schema (fill in all fields):',
    '{',
    '  "policyTitle": "string",',
    '  "version": "1.0",',
    '  "effectiveDate": "2025-03-01",',
    '  "reviewDate": "2026-03-01",',
    '  "classification": "Internal / Confidential",',
    '  "executiveSummary": "2 sentences about this policy purpose",',
    '  "frameworkAlignment": [',
    '    {"controlId":"ID","controlName":"name","status":"Fully Compliant","notes":"1 sentence"},',
    '    {"controlId":"ID","controlName":"name","status":"Partial Coverage","notes":"1 sentence"},',
    '    {"controlId":"ID","controlName":"name","status":"Gap Identified","notes":"1 sentence"},',
    '    {"controlId":"ID","controlName":"name","status":"Fully Compliant","notes":"1 sentence"},',
    '    {"controlId":"ID","controlName":"name","status":"Fully Compliant","notes":"1 sentence"}',
    '  ],',
    '  "policySections": [',
    '    {"title":"1. Purpose","content":"2 sentences"},',
    '    {"title":"2. Scope","content":"2 sentences"},',
    '    {"title":"3. Policy Statement","content":"3 sentences"},',
    '    {"title":"4. Roles and Responsibilities","content":"3 sentences"},',
    '    {"title":"5. ' + f.framework + ' Requirements","content":"3 sentences"},',
    '    {"title":"6. Compliance and Enforcement","content":"2 sentences"}',
    '  ],',
    '  "riskFindings": [',
    '    {"id":"F-001","finding":"1 sentence","severity":"High","recommendation":"1 sentence"},',
    '    {"id":"F-002","finding":"1 sentence","severity":"Medium","recommendation":"1 sentence"},',
    '    {"id":"F-003","finding":"1 sentence","severity":"Low","recommendation":"1 sentence"}',
    '  ],',
    '  "complianceScore": 72,',
    '  "maturityLevel": "Developing",',
    '  "nextSteps": ["action 1","action 2","action 3"]',
    '}',
    '',
    'status values: "Fully Compliant" | "Partial Coverage" | "Gap Identified" | "Not Applicable"',
    'severity values: "Critical" | "High" | "Medium" | "Low"',
    'maturityLevel values: "Initial" | "Developing" | "Defined" | "Managed" | "Optimising"',
    'complianceScore: integer 0-100',
    '',
    'Make all content specific to ' + f.orgName + ' and ' + f.industry + '.',
    'Output ONLY the JSON object starting with { — nothing before or after.'
  ].join("\n");
}

function Spinner() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20,padding:"60px 20px"}}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{position:"relative",width:56,height:56}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid #e2e8f0"}}/>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid transparent",borderTopColor:"#0ea5e9",animation:"sp 0.9s linear infinite"}}/>
        <div style={{position:"absolute",inset:8,borderRadius:"50%",border:"2px solid transparent",borderTopColor:"#8b5cf6",animation:"sp 0.7s linear infinite reverse"}}/>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1e293b"}}>Agent is running…</div>
        <div style={{fontSize:12,color:"#64748b",marginTop:4}}>Analysing framework controls &amp; generating policy</div>
      </div>
    </div>
  );
}

function Badge({ status }) {
  const s = STAT_STYLE[status] || STAT_STYLE["Not Applicable"];
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:s.bg,color:s.color,fontSize:11,fontWeight:700}}>
      <span style={{width:6,height:6,borderRadius:"50%",background:s.dot}}/>
      {status}
    </span>
  );
}

function Select({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>{label} *</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:14,outline:"none",background:"#fff",cursor:"pointer",fontFamily:"inherit",boxSizing:"border-box"}}>
        <option value="">{placeholder}</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ReportView({ report, form, fw, onBack }) {
  const sc = report.complianceScore >= 75 ? "#10b981" : report.complianceScore >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <button onClick={onBack} style={{marginBottom:24,padding:"8px 16px",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,fontWeight:600,color:"#374151",cursor:"pointer"}}>
        ← New Audit
      </button>

      {/* Header */}
      <div style={{background:"#0f172a",borderRadius:16,padding:28,marginBottom:16,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,background:fw.color+"15",borderRadius:"50%"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>
            {[form.framework, "v"+report.version, report.classification].map(t=>(
              <span key={t} style={{padding:"3px 10px",background:"#ffffff15",color:"#94a3b8",borderRadius:6,fontSize:11,fontWeight:600}}>{t}</span>
            ))}
          </div>
          <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:4}}>{report.policyTitle}</div>
          <div style={{fontSize:13,color:"#94a3b8",marginBottom:14}}>{form.orgName} · {form.industry}</div>
          <div style={{fontSize:14,color:"#cbd5e1",lineHeight:1.6,maxWidth:580}}>{report.executiveSummary}</div>
          <div style={{display:"flex",gap:24,marginTop:16}}>
            <div><div style={{color:"#64748b",fontSize:11,fontWeight:600}}>EFFECTIVE</div><div style={{color:"#e2e8f0",fontSize:13,fontWeight:600,marginTop:2}}>{report.effectiveDate}</div></div>
            <div><div style={{color:"#64748b",fontSize:11,fontWeight:600}}>NEXT REVIEW</div><div style={{color:"#e2e8f0",fontSize:13,fontWeight:600,marginTop:2}}>{report.reviewDate}</div></div>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:16}}>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:18}}>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8}}>COMPLIANCE SCORE</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:4}}>
            <span style={{fontSize:38,fontWeight:800,color:sc,lineHeight:1}}>{report.complianceScore}</span>
            <span style={{fontSize:15,color:"#94a3b8",marginBottom:3}}>/100</span>
          </div>
          <div style={{marginTop:10,height:5,background:"#f1f5f9",borderRadius:3}}>
            <div style={{height:"100%",width:report.complianceScore+"%",background:sc,borderRadius:3}}/>
          </div>
        </div>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:18}}>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8}}>MATURITY LEVEL</div>
          <div style={{fontSize:22,fontWeight:800,color:MAT_COLOR[report.maturityLevel]||"#3b82f6"}}>{report.maturityLevel}</div>
          <div style={{fontSize:12,color:"#94a3b8",marginTop:6}}>of 5 maturity stages</div>
        </div>
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:18}}>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8}}>RISK FINDINGS</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:6}}>
            {["Critical","High","Medium","Low"].map(sv=>{
              const n=(report.riskFindings||[]).filter(x=>x.severity===sv).length;
              return n>0?<div key={sv} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:SEV_COLOR[sv]}}>{n}</div><div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{sv}</div></div>:null;
            })}
          </div>
        </div>
      </div>

      {/* Framework Alignment */}
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:22,marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Framework Control Alignment — {form.framework}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(report.frameworkAlignment||[]).map((item,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 12px",background:"#f8fafc",borderRadius:8,border:"1px solid #f1f5f9"}}>
              <span style={{padding:"2px 8px",background:fw.color+"15",color:fw.color,borderRadius:4,fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0,fontFamily:"monospace"}}>{item.controlId}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13,color:"#1e293b",marginBottom:2}}>{item.controlName}</div>
                <div style={{fontSize:12,color:"#64748b"}}>{item.notes}</div>
              </div>
              <div style={{flexShrink:0}}><Badge status={item.status}/></div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Sections */}
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:22,marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:18}}>Generated Policy Document</div>
        {(report.policySections||[]).map((sec,i)=>(
          <div key={i} style={{borderTop:i>0?"1px solid #f1f5f9":"none",paddingTop:i>0?16:0,marginTop:i>0?16:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:6}}>{sec.title}</div>
            <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>{sec.content}</div>
          </div>
        ))}
      </div>

      {/* Findings */}
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:22,marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Audit Findings &amp; Recommendations</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(report.riskFindings||[]).map((f,i)=>(
            <div key={i} style={{padding:"12px 14px",borderRadius:10,border:"1px solid "+SEV_COLOR[f.severity]+"30",background:SEV_COLOR[f.severity]+"08"}}>
              <div style={{display:"flex",gap:8,marginBottom:5}}>
                <span style={{fontFamily:"monospace",fontSize:11,color:"#94a3b8",fontWeight:700}}>{f.id}</span>
                <span style={{padding:"1px 8px",background:SEV_COLOR[f.severity]+"20",color:SEV_COLOR[f.severity],borderRadius:4,fontSize:11,fontWeight:700}}>{f.severity}</span>
              </div>
              <div style={{fontSize:13,fontWeight:600,color:"#1e293b",marginBottom:3}}>{f.finding}</div>
              <div style={{fontSize:12,color:"#64748b"}}>→ {f.recommendation}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e1b4b)",borderRadius:12,padding:22}}>
        <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14}}>Recommended Next Steps</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(report.nextSteps||[]).map((step,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12}}>
              <span style={{width:22,height:22,borderRadius:"50%",background:fw.color+"30",color:fw.color,fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</span>
              <span style={{fontSize:13,color:"#cbd5e1",lineHeight:1.6}}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [step,   setStep]   = useState("form");
  const [form,   setForm]   = useState({orgName:"",industry:"",size:"",framework:"",policyType:""});
  const [report, setReport] = useState(null);
  const [error,  setError]  = useState("");

  const fw = FRAMEWORKS[form.framework] || { color:"#0ea5e9", controls:[], badge:"" };

  async function runAgent() {
    const empty = !form.orgName || !form.industry || !form.size || !form.framework || !form.policyType;
    if (empty) { setError("Please fill in all fields before running the agent."); return; }
    setError(""); setStep("loading");
    try {
      // Call our secure Cloudflare Worker proxy instead of Anthropic directly
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:4000,
          messages:[{role:"user",content:makePrompt(form)}]
        })
      });
      if (!res.ok) {
        const e = await res.json().catch(()=>({}));
        throw new Error("API " + res.status + ": " + (e?.error || e?.error?.message || res.statusText));
      }
      const data = await res.json();
      const raw  = (data.content||[]).map(b=>b.text||"").join("");
      if (!raw) throw new Error("Agent returned empty response.");
      const parsed = safeParseJSON(raw);
      if (!parsed) throw new Error("Could not parse agent output — please try again.");
      setReport(parsed); setStep("result");
    } catch(e) {
      setError("Error: " + e.message); setStep("form");
    }
  }

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"'Segoe UI',system-ui,sans-serif",fontSize:14}}>

      {/* Nav */}
      <div style={{background:"#0f172a",padding:"12px 24px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:30,height:30,background:"linear-gradient(135deg,#0ea5e9,#8b5cf6)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{color:"#fff",fontWeight:900,fontSize:14}}>A</span>
        </div>
        <span style={{color:"#fff",fontWeight:700,fontSize:16}}>AutoAudit</span>
        <span style={{color:"#475569",fontSize:12}}>/ Policy Generation Agent</span>
        <div style={{marginLeft:"auto",display:"flex",gap:5,flexWrap:"wrap"}}>
          {Object.entries(FRAMEWORKS).map(([,f])=>(
            <span key={f.badge} style={{padding:"2px 7px",borderRadius:4,background:f.color+"20",color:f.color,fontSize:10,fontWeight:700,border:"1px solid "+f.color+"40"}}>{f.badge}</span>
          ))}
        </div>
      </div>

      <div style={{maxWidth:840,margin:"0 auto",padding:"28px 16px"}}>

        {(step==="form"||step==="loading") && (
          <div>
            <h1 style={{fontSize:24,fontWeight:800,color:"#0f172a",margin:"0 0 6px"}}>Policy Generation Agent</h1>
            <p style={{color:"#64748b",margin:"0 0 24px",fontSize:14}}>Enter your organization details and the agent will generate a compliance-aligned policy document and audit report.</p>

            <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:24,marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:18}}>Organization Details</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={{gridColumn:"1 / -1"}}>
                  <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Organization Name *</label>
                  <input value={form.orgName} onChange={e=>setForm(f=>({...f,orgName:e.target.value}))} placeholder="e.g. Acme Corporation"
                    style={{width:"100%",padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}
                    onFocus={e=>e.target.style.borderColor="#0ea5e9"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
                </div>
                <Select label="Industry"             value={form.industry}   onChange={v=>setForm(f=>({...f,industry:v}))}   options={INDUSTRIES}              placeholder="Select industry"/>
                <Select label="Organization Size"    value={form.size}       onChange={v=>setForm(f=>({...f,size:v}))}       options={ORG_SIZES}               placeholder="Select size"/>
                <Select label="Compliance Framework" value={form.framework}  onChange={v=>setForm(f=>({...f,framework:v}))}  options={Object.keys(FRAMEWORKS)} placeholder="Select framework"/>
                <Select label="Policy Type"          value={form.policyType} onChange={v=>setForm(f=>({...f,policyType:v}))} options={POLICY_TYPES}            placeholder="Select policy type"/>
              </div>

              {form.framework && (
                <div style={{marginTop:16,padding:"12px 14px",background:fw.color+"10",border:"1px solid "+fw.color+"25",borderRadius:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:fw.color,marginBottom:8}}>CONTROLS TO BE ASSESSED</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {fw.controls.map(c=><span key={c} style={{padding:"3px 10px",background:fw.color+"20",color:fw.color,borderRadius:4,fontSize:11,fontWeight:600}}>{c}</span>)}
                  </div>
                </div>
              )}

              {error && <div style={{marginTop:14,padding:"10px 14px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,color:"#dc2626",fontSize:13}}>{error}</div>}
            </div>

            {step==="loading"
              ? <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14}}><Spinner/></div>
              : <button onClick={runAgent} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#0ea5e9,#8b5cf6)",border:"none",borderRadius:10,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  ▶ Run Policy Generation Agent
                </button>
            }
          </div>
        )}

        {step==="result" && report && (
          <ReportView report={report} form={form} fw={fw} onBack={()=>{setStep("form");setReport(null);}}/>
        )}
      </div>
    </div>
  );
}
