import { useState, useRef, useEffect } from "react";

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
const SEV_COLOR    = { Critical:"#dc2626", High:"#ea580c", Medium:"#d97706", Low:"#65a30d" };
const MAT_COLOR    = { Initial:"#ef4444", Developing:"#f59e0b", Defined:"#3b82f6", Managed:"#8b5cf6", Optimising:"#10b981" };
const STAT_STYLE   = {
  "Fully Compliant":  { bg:"#dcfce7", color:"#166534", dot:"#22c55e" },
  "Partial Coverage": { bg:"#fef9c3", color:"#854d0e", dot:"#eab308" },
  "Gap Identified":   { bg:"#fee2e2", color:"#991b1b", dot:"#ef4444" },
  "Not Applicable":   { bg:"#f3f4f6", color:"#374151", dot:"#9ca3af" }
};

function safeParseJSON(raw) {
  try {
    let t = raw.trim().replace(/^```(?:json)?[\r\n]*/i,"").replace(/[\r\n]*```\s*$/i,"").trim();
    const s=t.indexOf("{"), e=t.lastIndexOf("}");
    if(s<0||e<0||e<=s) return null;
    return JSON.parse(t.slice(s,e+1));
  } catch(_){ return null; }
}

function makeAuditPrompt(f) {
  return `You are AutoAudit, an expert cybersecurity GRC AI agent.
Task: Generate a ${f.policyType} for ${f.orgName} (${f.industry}, ${f.size}), aligned to ${f.framework}.
CRITICAL: Respond with ONLY a raw JSON object. No markdown. No backticks. Start with { end with }.
Schema: {"policyTitle":"string","version":"1.0","effectiveDate":"2025-03-01","reviewDate":"2026-03-01","classification":"Internal / Confidential","executiveSummary":"2 sentences","frameworkAlignment":[{"controlId":"ID","controlName":"name","status":"Fully Compliant","notes":"1 sentence"},{"controlId":"ID","controlName":"name","status":"Partial Coverage","notes":"1 sentence"},{"controlId":"ID","controlName":"name","status":"Gap Identified","notes":"1 sentence"},{"controlId":"ID","controlName":"name","status":"Fully Compliant","notes":"1 sentence"},{"controlId":"ID","controlName":"name","status":"Fully Compliant","notes":"1 sentence"}],"policySections":[{"title":"1. Purpose","content":"2 sentences"},{"title":"2. Scope","content":"2 sentences"},{"title":"3. Policy Statement","content":"3 sentences"},{"title":"4. Roles and Responsibilities","content":"3 sentences"},{"title":"5. ${f.framework} Requirements","content":"3 sentences"},{"title":"6. Compliance and Enforcement","content":"2 sentences"}],"riskFindings":[{"id":"F-001","finding":"1 sentence","severity":"High","recommendation":"1 sentence"},{"id":"F-002","finding":"1 sentence","severity":"Medium","recommendation":"1 sentence"},{"id":"F-003","finding":"1 sentence","severity":"Low","recommendation":"1 sentence"}],"complianceScore":72,"maturityLevel":"Developing","nextSteps":["action 1","action 2","action 3"]}
status: "Fully Compliant"|"Partial Coverage"|"Gap Identified"|"Not Applicable"
severity: "Critical"|"High"|"Medium"|"Low"
maturityLevel: "Initial"|"Developing"|"Defined"|"Managed"|"Optimising"
Make all content specific to ${f.orgName} and ${f.industry}. Output ONLY the JSON.`;
}

const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #print-report, #print-report * { visibility: visible !important; }
  #print-report { position: fixed; top: 0; left: 0; width: 100%; background: #fff; padding: 24px; }
  .no-print { display: none !important; }
  @page { margin: 15mm; }
}
`;

function Badge({ status }) {
  const s = STAT_STYLE[status]||STAT_STYLE["Not Applicable"];
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
      <label style={{display:"block",fontSize:12,fontWeight:700,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label} *</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",background:"#fff",cursor:"pointer",fontFamily:"inherit",boxSizing:"border-box",color:value?"#0f172a":"#94a3b8"}}>
        <option value="">{placeholder}</option>
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20,padding:"60px 20px"}}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{position:"relative",width:60,height:60}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid #e2e8f0"}}/>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid transparent",borderTopColor:"#0ea5e9",animation:"sp 0.9s linear infinite"}}/>
        <div style={{position:"absolute",inset:8,borderRadius:"50%",border:"2px solid transparent",borderTopColor:"#8b5cf6",animation:"sp 0.7s linear infinite reverse"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#0ea5e9",animation:"pulse 1.5s ease-in-out infinite"}}/>
        </div>
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1e293b"}}>Agent is running…</div>
        <div style={{fontSize:12,color:"#64748b",marginTop:4}}>Analysing framework controls &amp; generating policy</div>
      </div>
    </div>
  );
}

function Chatbot({ report, form }) {
  const [messages, setMessages] = useState([
    { role:"assistant", text:`Hi! I've reviewed the audit report for **${form.orgName}**. Ask me anything about the findings, compliance gaps, or what to prioritize. 💬` }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    const newMsgs = [...messages, { role:"user", text:q }];
    setMessages(newMsgs);
    setLoading(true);
    const ctx = `You are AutoAudit AI, a helpful cybersecurity GRC assistant. The user just generated this audit report:
Org: ${form.orgName} (${form.industry}, ${form.size}) | Framework: ${form.framework}
Policy: ${report.policyTitle} | Score: ${report.complianceScore}/100 | Maturity: ${report.maturityLevel}
Findings: ${JSON.stringify(report.riskFindings)}
Alignment: ${JSON.stringify(report.frameworkAlignment)}
Next Steps: ${JSON.stringify(report.nextSteps)}
Answer concisely and helpfully. Be specific. Keep answers under 150 words unless detail is needed.
User question: ${q}`;
    try {
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages:[{ role:"user", content: ctx }] })
      });
      const data = await res.json();
      const text = (data.content||[]).map(b=>b.text||"").join("") || "Sorry, couldn't generate a response. Please try again.";
      setMessages(m=>[...m, { role:"assistant", text }]);
    } catch(e) {
      setMessages(m=>[...m, { role:"assistant", text:"Error connecting to AI. Please try again." }]);
    }
    setLoading(false);
  }

  const suggestions = ["What should I fix first?","Explain the compliance gaps","How do I improve maturity?","What are the critical risks?"];

  return (
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,overflow:"hidden",marginTop:20}}>
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e1b4b)",padding:"16px 20px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#0ea5e9,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤖</div>
        <div>
          <div style={{color:"#fff",fontWeight:700,fontSize:14}}>AutoAudit AI Assistant</div>
          <div style={{color:"#64748b",fontSize:11}}>Ask questions about this report</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e"}}/>
          <span style={{color:"#64748b",fontSize:11}}>Online</span>
        </div>
      </div>

      <div style={{height:320,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:12,background:"#f8fafc"}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"linear-gradient(135deg,#0ea5e9,#8b5cf6)":"#fff",color:m.role==="user"?"#fff":"#1e293b",fontSize:13,lineHeight:1.6,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",border:m.role==="assistant"?"1px solid #e2e8f0":"none"}}>
              {m.text.split("**").map((part,j)=>j%2===1?<strong key={j}>{part}</strong>:part)}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{display:"flex",justifyContent:"flex-start"}}>
            <div style={{padding:"12px 16px",background:"#fff",borderRadius:"16px 16px 16px 4px",border:"1px solid #e2e8f0"}}>
              <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
              <div style={{display:"flex",gap:4}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#94a3b8",animation:`bounce 1s ease-in-out ${i*0.2}s infinite`}}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {messages.length<=1 && (
        <div style={{padding:"8px 16px",display:"flex",flexWrap:"wrap",gap:6,background:"#f8fafc",borderTop:"1px solid #f1f5f9"}}>
          {suggestions.map(s=>(
            <button key={s} onClick={()=>setInput(s)} style={{padding:"5px 12px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:20,fontSize:12,color:"#475569",cursor:"pointer",fontFamily:"inherit"}}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{padding:"12px 16px",background:"#fff",borderTop:"1px solid #e2e8f0",display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Ask about this audit report…"
          style={{flex:1,padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={send} disabled={loading||!input.trim()}
          style={{padding:"10px 18px",background:loading||!input.trim()?"#e2e8f0":"linear-gradient(135deg,#0ea5e9,#8b5cf6)",border:"none",borderRadius:10,color:loading||!input.trim()?"#94a3b8":"#fff",fontSize:13,fontWeight:700,cursor:loading||!input.trim()?"not-allowed":"pointer",fontFamily:"inherit"}}>
          Send
        </button>
      </div>
    </div>
  );
}

function ReportView({ report, form, fw, onBack }) {
  const sc = report.complianceScore>=75?"#10b981":report.complianceScore>=50?"#f59e0b":"#ef4444";
  const matLevels = ["Initial","Developing","Defined","Managed","Optimising"];

  return (
    <div>
      <style>{PRINT_STYLE}</style>

      <div className="no-print" style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap",alignItems:"center"}}>
        <button onClick={onBack} style={{padding:"9px 16px",background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:13,fontWeight:600,color:"#374151",cursor:"pointer"}}>
          ← New Audit
        </button>
        <div style={{flex:1}}/>
        <button onClick={()=>window.print()} style={{padding:"9px 20px",background:"linear-gradient(135deg,#0f172a,#1e1b4b)",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
          ⬇ Download PDF Report
        </button>
      </div>

      <div id="print-report">
        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 60%,#0f172a 100%)",borderRadius:16,padding:"32px 28px",marginBottom:16,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,background:fw.color+"12",borderRadius:"50%"}}/>
          <div style={{position:"absolute",bottom:-40,left:-40,width:160,height:160,background:"#8b5cf618",borderRadius:"50%"}}/>
          <div style={{position:"relative"}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
              {[form.framework,"v"+report.version,report.classification].map(t=>(
                <span key={t} style={{padding:"4px 12px",background:"#ffffff12",color:"#94a3b8",borderRadius:6,fontSize:11,fontWeight:700}}>{t}</span>
              ))}
            </div>
            <div style={{fontSize:22,fontWeight:800,color:"#fff",marginBottom:6,lineHeight:1.2}}>{report.policyTitle}</div>
            <div style={{fontSize:13,color:"#64748b",marginBottom:16,fontWeight:600}}>{form.orgName} · {form.industry} · {form.size}</div>
            <div style={{fontSize:14,color:"#cbd5e1",lineHeight:1.7,maxWidth:600,borderLeft:"3px solid "+fw.color,paddingLeft:14}}>{report.executiveSummary}</div>
            <div style={{display:"flex",gap:28,marginTop:20}}>
              {[["Effective",report.effectiveDate],["Next Review",report.reviewDate],["Classification",report.classification]].map(([l,v])=>(
                <div key={l}><div style={{color:"#475569",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>{l}</div><div style={{color:"#e2e8f0",fontSize:13,fontWeight:700,marginTop:3}}>{v}</div></div>
              ))}
            </div>
          </div>
        </div>

        {/* Score Cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:16}}>
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:20,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${sc},${sc}88)`}}/>
            <div style={{fontSize:10,fontWeight:700,color:"#64748b",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Compliance Score</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:4,marginBottom:12}}>
              <span style={{fontSize:42,fontWeight:900,color:sc,lineHeight:1}}>{report.complianceScore}</span>
              <span style={{fontSize:16,color:"#94a3b8",marginBottom:4}}>/100</span>
            </div>
            <div style={{height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:report.complianceScore+"%",background:`linear-gradient(90deg,${sc},${sc}bb)`,borderRadius:3}}/>
            </div>
          </div>

          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:20,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${MAT_COLOR[report.maturityLevel]||"#3b82f6"},transparent)`}}/>
            <div style={{fontSize:10,fontWeight:700,color:"#64748b",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Maturity Level</div>
            <div style={{fontSize:24,fontWeight:800,color:MAT_COLOR[report.maturityLevel]||"#3b82f6",marginBottom:8}}>{report.maturityLevel}</div>
            <div style={{display:"flex",gap:4}}>
              {matLevels.map((l,i)=><div key={l} style={{flex:1,height:4,borderRadius:2,background:i<=matLevels.indexOf(report.maturityLevel)?(MAT_COLOR[report.maturityLevel]||"#3b82f6"):"#e2e8f0"}}/>)}
            </div>
            <div style={{fontSize:11,color:"#94a3b8",marginTop:6}}>of 5 maturity stages</div>
          </div>

          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:20,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#ef4444,#f59e0b)"}}/>
            <div style={{fontSize:10,fontWeight:700,color:"#64748b",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Risk Findings</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:4}}>
              {["Critical","High","Medium","Low"].map(sv=>{
                const n=(report.riskFindings||[]).filter(x=>x.severity===sv).length;
                return n>0?<div key={sv} style={{textAlign:"center",padding:"6px 10px",background:SEV_COLOR[sv]+"10",borderRadius:8,border:"1px solid "+SEV_COLOR[sv]+"25"}}>
                  <div style={{fontSize:22,fontWeight:800,color:SEV_COLOR[sv]}}>{n}</div>
                  <div style={{fontSize:10,color:"#94a3b8",fontWeight:600}}>{sv}</div>
                </div>:null;
              })}
            </div>
          </div>
        </div>

        {/* Framework Alignment */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:22,marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:"#64748b",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:3,height:14,background:fw.color,borderRadius:2,display:"inline-block"}}/>
            Framework Control Alignment — {form.framework}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {(report.frameworkAlignment||[]).map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px",background:"#f8fafc",borderRadius:10,border:"1px solid #f1f5f9"}}>
                <span style={{padding:"3px 9px",background:fw.color+"15",color:fw.color,borderRadius:5,fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0,fontFamily:"monospace"}}>{item.controlId}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#1e293b",marginBottom:2}}>{item.controlName}</div>
                  <div style={{fontSize:12,color:"#64748b",lineHeight:1.5}}>{item.notes}</div>
                </div>
                <div style={{flexShrink:0}}><Badge status={item.status}/></div>
              </div>
            ))}
          </div>
        </div>

        {/* Policy Document */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:24,marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:"#64748b",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:20,display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:3,height:14,background:"#8b5cf6",borderRadius:2,display:"inline-block"}}/>
            Generated Policy Document
          </div>
          {(report.policySections||[]).map((sec,i)=>(
            <div key={i} style={{borderTop:i>0?"1px solid #f1f5f9":"none",paddingTop:i>0?18:0,marginTop:i>0?18:0}}>
              <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:22,height:22,borderRadius:6,background:"#f1f5f9",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#64748b",flexShrink:0}}>{i+1}</span>
                {sec.title.replace(/^\d+\.\s*/,"")}
              </div>
              <div style={{fontSize:13,color:"#475569",lineHeight:1.75,paddingLeft:30}}>{sec.content}</div>
            </div>
          ))}
        </div>

        {/* Findings */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:14,padding:22,marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:700,color:"#64748b",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:3,height:14,background:"#ef4444",borderRadius:2,display:"inline-block"}}/>
            Audit Findings &amp; Recommendations
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {(report.riskFindings||[]).map((f,i)=>(
              <div key={i} style={{padding:"14px 16px",borderRadius:12,border:"1px solid "+SEV_COLOR[f.severity]+"30",background:SEV_COLOR[f.severity]+"06",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:SEV_COLOR[f.severity]}}/>
                <div style={{paddingLeft:10}}>
                  <div style={{display:"flex",gap:8,marginBottom:6,alignItems:"center"}}>
                    <span style={{fontFamily:"monospace",fontSize:11,color:"#94a3b8",fontWeight:700}}>{f.id}</span>
                    <span style={{padding:"2px 9px",background:SEV_COLOR[f.severity]+"20",color:SEV_COLOR[f.severity],borderRadius:5,fontSize:11,fontWeight:700}}>{f.severity}</span>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:5}}>{f.finding}</div>
                  <div style={{fontSize:12,color:"#64748b",display:"flex",alignItems:"flex-start",gap:6}}>
                    <span style={{color:SEV_COLOR[f.severity],fontWeight:700,flexShrink:0}}>→</span>{f.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div style={{background:"linear-gradient(135deg,#0f172a,#1e1b4b)",borderRadius:14,padding:24}}>
          <div style={{fontSize:10,fontWeight:700,color:"#475569",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:18}}>Recommended Next Steps</div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {(report.nextSteps||[]).map((step,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:14}}>
                <span style={{width:26,height:26,borderRadius:"50%",background:fw.color+"25",color:fw.color,fontSize:12,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:"1px solid "+fw.color+"40"}}>{i+1}</span>
                <span style={{fontSize:13,color:"#cbd5e1",lineHeight:1.65,paddingTop:3}}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <div className="no-print">
        <Chatbot report={report} form={form} />
      </div>
    </div>
  );
}

export default function App() {
  const [step,   setStep]   = useState("form");
  const [form,   setForm]   = useState({orgName:"",industry:"",size:"",framework:"",policyType:""});
  const [report, setReport] = useState(null);
  const [error,  setError]  = useState("");
  const fw = FRAMEWORKS[form.framework]||{color:"#0ea5e9",controls:[],badge:""};

  async function runAgent() {
    if (!form.orgName||!form.industry||!form.size||!form.framework||!form.policyType) {
      setError("Please fill in all fields before running the agent."); return;
    }
    setError(""); setStep("loading");
    try {
      const res = await fetch("/api/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ messages:[{role:"user",content:makeAuditPrompt(form)}] })
      });
      if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error("API "+res.status+": "+(e?.error||res.statusText)); }
      const data = await res.json();
      const raw  = (data.content||[]).map(b=>b.text||"").join("");
      if (!raw) throw new Error("Agent returned empty response.");
      const parsed = safeParseJSON(raw);
      if (!parsed) throw new Error("Could not parse agent output — please try again.");
      setReport(parsed); setStep("result");
    } catch(e) { setError("Error: "+e.message); setStep("form"); }
  }

  return (
    <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"'Segoe UI',system-ui,sans-serif",fontSize:14}}>
      <style>{`*{box-sizing:border-box}select:focus,input:focus{border-color:#0ea5e9!important;box-shadow:0 0 0 3px #0ea5e920}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp 0.4s ease forwards}`}</style>

      {/* Nav */}
      <div style={{background:"#0f172a",padding:"0 24px",height:56,display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid #1e293b",position:"sticky",top:0,zIndex:100}}>
        <div style={{width:32,height:32,background:"linear-gradient(135deg,#0ea5e9,#8b5cf6)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px #0ea5e940"}}>
          <span style={{color:"#fff",fontWeight:900,fontSize:15}}>A</span>
        </div>
        <span style={{color:"#fff",fontWeight:800,fontSize:16}}>AutoAudit</span>
        <span style={{color:"#334155",fontSize:13}}>/</span>
        <span style={{color:"#64748b",fontSize:13}}>Policy Generation Agent</span>
        <div style={{marginLeft:"auto",display:"flex",gap:5,flexWrap:"wrap"}}>
          {Object.entries(FRAMEWORKS).map(([,f])=>(
            <span key={f.badge} style={{padding:"2px 8px",borderRadius:4,background:f.color+"18",color:f.color,fontSize:10,fontWeight:800,border:"1px solid "+f.color+"35"}}>{f.badge}</span>
          ))}
        </div>
      </div>

      <div style={{maxWidth:860,margin:"0 auto",padding:"32px 16px"}}>
        {(step==="form"||step==="loading") && (
          <div className="fade-up">
            <div style={{marginBottom:28}}>
              <h1 style={{fontSize:26,fontWeight:900,color:"#0f172a",margin:"0 0 8px",letterSpacing:"-0.02em"}}>Policy Generation Agent</h1>
              <p style={{color:"#64748b",margin:0,fontSize:14,lineHeight:1.6}}>Enter your organization details and the AI agent will generate a compliance-aligned policy document, audit report, and risk findings.</p>
            </div>

            <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16,padding:28,marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:10,fontWeight:800,color:"#64748b",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:22,display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:3,height:14,background:"#0ea5e9",borderRadius:2,display:"inline-block"}}/>
                Organization Details
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
                <div style={{gridColumn:"1 / -1"}}>
                  <label style={{display:"block",fontSize:12,fontWeight:700,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Organization Name *</label>
                  <input value={form.orgName} onChange={e=>setForm(f=>({...f,orgName:e.target.value}))} placeholder="e.g. Acme Corporation"
                    style={{width:"100%",padding:"11px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,outline:"none",fontFamily:"inherit",transition:"all 0.15s"}}/>
                </div>
                <Select label="Industry"             value={form.industry}   onChange={v=>setForm(f=>({...f,industry:v}))}   options={INDUSTRIES}              placeholder="Select industry"/>
                <Select label="Organization Size"    value={form.size}       onChange={v=>setForm(f=>({...f,size:v}))}       options={ORG_SIZES}               placeholder="Select size"/>
                <Select label="Compliance Framework" value={form.framework}  onChange={v=>setForm(f=>({...f,framework:v}))}  options={Object.keys(FRAMEWORKS)} placeholder="Select framework"/>
                <Select label="Policy Type"          value={form.policyType} onChange={v=>setForm(f=>({...f,policyType:v}))} options={POLICY_TYPES}            placeholder="Select policy type"/>
              </div>

              {form.framework && (
                <div style={{marginTop:18,padding:"14px 16px",background:fw.color+"08",border:"1px solid "+fw.color+"20",borderRadius:12}}>
                  <div style={{fontSize:10,fontWeight:800,color:fw.color,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>Controls to be assessed</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                    {fw.controls.map(c=><span key={c} style={{padding:"4px 12px",background:fw.color+"15",color:fw.color,borderRadius:5,fontSize:11,fontWeight:600}}>{c}</span>)}
                  </div>
                </div>
              )}

              {error && <div style={{marginTop:16,padding:"11px 14px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,color:"#dc2626",fontSize:13,fontWeight:500}}>{error}</div>}
            </div>

            {step==="loading"
              ? <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:16}}><Spinner/></div>
              : <button onClick={runAgent} style={{width:"100%",padding:"15px",background:"linear-gradient(135deg,#0ea5e9,#8b5cf6)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 14px #0ea5e940"}}>
                  ▶ Run Policy Generation Agent
                </button>
            }
          </div>
        )}

        {step==="result" && report && (
          <div className="fade-up">
            <ReportView report={report} form={form} fw={fw} onBack={()=>{setStep("form");setReport(null);}}/>
          </div>
        )}
      </div>
    </div>
  );
}
