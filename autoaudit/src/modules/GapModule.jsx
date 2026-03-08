import { useState, useRef, useEffect } from "react";

// ALL 93 ISO 27001:2022 Annex A Controls
const CONTROLS = [
  { domain:"A.5 Organizational Controls", color:"#0ea5e9", items:[
    { id:"A.5.1",  name:"Policies for information security" },
    { id:"A.5.2",  name:"Information security roles and responsibilities" },
    { id:"A.5.3",  name:"Segregation of duties" },
    { id:"A.5.4",  name:"Management responsibilities" },
    { id:"A.5.5",  name:"Contact with authorities" },
    { id:"A.5.6",  name:"Contact with special interest groups" },
    { id:"A.5.7",  name:"Threat intelligence" },
    { id:"A.5.8",  name:"Information security in project management" },
    { id:"A.5.9",  name:"Inventory of information and other associated assets" },
    { id:"A.5.10", name:"Acceptable use of information and other associated assets" },
    { id:"A.5.11", name:"Return of assets" },
    { id:"A.5.12", name:"Classification of information" },
    { id:"A.5.13", name:"Labelling of information" },
    { id:"A.5.14", name:"Information transfer" },
    { id:"A.5.15", name:"Access control" },
    { id:"A.5.16", name:"Identity management" },
    { id:"A.5.17", name:"Authentication information" },
    { id:"A.5.18", name:"Access rights" },
    { id:"A.5.19", name:"Information security in supplier relationships" },
    { id:"A.5.20", name:"Addressing information security within supplier agreements" },
    { id:"A.5.21", name:"Managing information security in the ICT supply chain" },
    { id:"A.5.22", name:"Monitoring, review and change management of supplier services" },
    { id:"A.5.23", name:"Information security for use of cloud services" },
    { id:"A.5.24", name:"Information security incident management planning and preparation" },
    { id:"A.5.25", name:"Assessment and decision on information security events" },
    { id:"A.5.26", name:"Response to information security incidents" },
    { id:"A.5.27", name:"Learning from information security incidents" },
    { id:"A.5.28", name:"Collection of evidence" },
    { id:"A.5.29", name:"Information security during disruption" },
    { id:"A.5.30", name:"ICT readiness for business continuity" },
    { id:"A.5.31", name:"Legal, statutory, regulatory and contractual requirements" },
    { id:"A.5.32", name:"Intellectual property rights" },
    { id:"A.5.33", name:"Protection of records" },
    { id:"A.5.34", name:"Privacy and protection of PII" },
    { id:"A.5.35", name:"Independent review of information security" },
    { id:"A.5.36", name:"Compliance with policies, rules and standards for information security" },
    { id:"A.5.37", name:"Documented operating procedures" },
  ]},
  { domain:"A.6 People Controls", color:"#8b5cf6", items:[
    { id:"A.6.1", name:"Screening" },
    { id:"A.6.2", name:"Terms and conditions of employment" },
    { id:"A.6.3", name:"Information security awareness, education and training" },
    { id:"A.6.4", name:"Disciplinary process" },
    { id:"A.6.5", name:"Responsibilities after termination or change of employment" },
    { id:"A.6.6", name:"Confidentiality or non-disclosure agreements" },
    { id:"A.6.7", name:"Remote working" },
    { id:"A.6.8", name:"Information security event reporting" },
  ]},
  { domain:"A.7 Physical Controls", color:"#f59e0b", items:[
    { id:"A.7.1",  name:"Physical security perimeters" },
    { id:"A.7.2",  name:"Physical entry" },
    { id:"A.7.3",  name:"Securing offices, rooms and facilities" },
    { id:"A.7.4",  name:"Physical security monitoring" },
    { id:"A.7.5",  name:"Protecting against physical and environmental threats" },
    { id:"A.7.6",  name:"Working in secure areas" },
    { id:"A.7.7",  name:"Clear desk and clear screen" },
    { id:"A.7.8",  name:"Equipment siting and protection" },
    { id:"A.7.9",  name:"Security of assets off-premises" },
    { id:"A.7.10", name:"Storage media" },
    { id:"A.7.11", name:"Supporting utilities" },
    { id:"A.7.12", name:"Cabling security" },
    { id:"A.7.13", name:"Equipment maintenance" },
    { id:"A.7.14", name:"Secure disposal or re-use of equipment" },
  ]},
  { domain:"A.8 Technological Controls", color:"#10b981", items:[
    { id:"A.8.1",  name:"User endpoint devices" },
    { id:"A.8.2",  name:"Privileged access rights" },
    { id:"A.8.3",  name:"Information access restriction" },
    { id:"A.8.4",  name:"Access to source code" },
    { id:"A.8.5",  name:"Secure authentication" },
    { id:"A.8.6",  name:"Capacity management" },
    { id:"A.8.7",  name:"Protection against malware" },
    { id:"A.8.8",  name:"Management of technical vulnerabilities" },
    { id:"A.8.9",  name:"Configuration management" },
    { id:"A.8.10", name:"Information deletion" },
    { id:"A.8.11", name:"Data masking" },
    { id:"A.8.12", name:"Data leakage prevention" },
    { id:"A.8.13", name:"Information backup" },
    { id:"A.8.14", name:"Redundancy of information processing facilities" },
    { id:"A.8.15", name:"Logging" },
    { id:"A.8.16", name:"Monitoring activities" },
    { id:"A.8.17", name:"Clock synchronisation" },
    { id:"A.8.18", name:"Use of privileged utility programs" },
    { id:"A.8.19", name:"Installation of software on operational systems" },
    { id:"A.8.20", name:"Networks security" },
    { id:"A.8.21", name:"Security of network services" },
    { id:"A.8.22", name:"Segregation of networks" },
    { id:"A.8.23", name:"Web filtering" },
    { id:"A.8.24", name:"Use of cryptography" },
    { id:"A.8.25", name:"Secure development life cycle" },
    { id:"A.8.26", name:"Application security requirements" },
    { id:"A.8.27", name:"Secure system architecture and engineering principles" },
    { id:"A.8.28", name:"Secure coding" },
    { id:"A.8.29", name:"Security testing in development and acceptance" },
    { id:"A.8.30", name:"Outsourced development" },
    { id:"A.8.31", name:"Separation of development, test and production environments" },
    { id:"A.8.32", name:"Change management" },
    { id:"A.8.33", name:"Test information" },
    { id:"A.8.34", name:"Protection of information systems during audit testing" },
  ]},
];

const ALL_CONTROLS = CONTROLS.flatMap(d => d.items);
const TOTAL = ALL_CONTROLS.length; // 93

const VERDICT_STYLE = {
  Compliant:       { color:"#22c55e", bg:"#14532d20", border:"#22c55e30", icon:"✓" },
  Partial:         { color:"#eab308", bg:"#78350f20", border:"#eab30830", icon:"~" },
  "Non-Compliant": { color:"#ef4444", bg:"#7f1d1d20", border:"#ef444430", icon:"✗" },
  Skipped:         { color:"#64748b", bg:"#1e293b",   border:"#33415530", icon:"—" },
};

// ── Prompts ──────────────────────────────────────────────────────────────────
function buildQuestionPrompt(control, lang, orgName, industry) {
  const langNote = lang==="ar"
    ? "Ask your question in Arabic. Keep the control ID in English."
    : "Ask in English.";
  return `You are an ISO 27001:2022 lead auditor conducting a gap assessment for ${orgName} (${industry}).
${langNote}
Ask ONE concise, specific interview question to assess control ${control.id} — ${control.name}.
Output only the question itself, no preamble or label.`;
}

function buildAssessPrompt(control, answer, hasFile, lang, orgName, industry) {
  const langNote = lang==="ar"
    ? "Respond entirely in Arabic except keep control IDs and verdict words (Compliant/Partial/Non-Compliant) in English."
    : "Respond in English.";
  return `You are an ISO 27001:2022 lead auditor assessing ${orgName} (${industry}).
${langNote}
Control: ${control.id} — ${control.name}
Response: "${answer}"${hasFile?" [Evidence document uploaded and reviewed]":""}

Reply in EXACTLY this format (no extra text):
VERDICT: [Compliant OR Partial OR Non-Compliant]
FINDING: [1-2 sentence assessment]
RECOMMENDATION: [1-2 sentence specific action]`;
}

function buildSummaryPrompt(results, orgName, industry, lang) {
  const compliant  = results.filter(r=>r.verdict==="Compliant").length;
  const partial    = results.filter(r=>r.verdict==="Partial").length;
  const nonComp    = results.filter(r=>r.verdict==="Non-Compliant").length;
  const score      = Math.round((compliant / results.length) * 100);
  const topGaps    = results.filter(r=>r.verdict==="Non-Compliant").slice(0,5).map(r=>r.id).join(", ");
  const langNote   = lang==="ar" ? "Write the entire summary in Arabic." : "Write in English.";
  return `You are an ISO 27001:2022 lead auditor. ${langNote}
Write a concise executive summary (5-6 sentences) for ${orgName} (${industry}).
Score: ${score}% (${compliant} Compliant, ${partial} Partial, ${nonComp} Non-Compliant out of ${results.length} controls assessed).
Top gaps: ${topGaps||"none"}.
Cover: overall security posture, top 2 strengths, top 3 critical gaps, strategic recommendation, certification readiness.`;
}

async function callAI(prompt) {
  const res  = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({messages:[{role:"user",content:prompt}]}) });
  const data = await res.json();
  return (data.content||[]).map(b=>b.text||"").join("");
}

function parseAssess(raw) {
  const get = key => { const m = raw.match(new RegExp(key+":?\\s*(.+?)(?=\\n[A-Z]+:|$)","si")); return m?m[1].trim():""; };
  const v = get("VERDICT");
  const verdict = v.includes("Non")?"Non-Compliant":v.includes("Partial")?"Partial":"Compliant";
  return { verdict, finding:get("FINDING"), recommendation:get("RECOMMENDATION") };
}

async function fileToBase64(file) {
  return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(file); });
}

// ── Components ────────────────────────────────────────────────────────────────
export default function GapModule({ t, isRTL, lang }) {
  const [orgForm, setOrgForm] = useState(null);
  const [draft, setDraft]     = useState({orgName:"",industry:"",size:""});
  if (!orgForm) return <OrgSetup draft={draft} setDraft={setDraft} onStart={()=>setOrgForm({...draft})} t={t} isRTL={isRTL}/>;
  return <Assessment form={orgForm} onReset={()=>{setOrgForm(null);setDraft({orgName:"",industry:"",size:""});}} t={t} isRTL={isRTL} lang={lang}/>;
}

function OrgSetup({ draft, setDraft, onStart, t, isRTL }) {
  const valid = draft.orgName && draft.industry && draft.size;
  return (
    <div style={{maxWidth:540}} dir={isRTL?"rtl":"ltr"}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:22,fontWeight:900,color:"#f1f5f9",marginBottom:6}}>{t.gapTitle}</h2>
        <p style={{color:"#475569",fontSize:13,lineHeight:1.7}}>{t.gapSubtitle}</p>
      </div>

      {/* Stats banner */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
        {[["93","Controls"],["4","Domains"],["37","Organizational"],["14","Physical"]].map(([n,l])=>(
          <div key={l} style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:900,color:"#10b981"}}>{n}</div>
            <div style={{fontSize:10,color:"#475569",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:14,padding:24,marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:18,display:"flex",alignItems:"center",gap:7}}>
          <span style={{width:3,height:13,background:"#10b981",borderRadius:2,display:"inline-block"}}/>{t.orgDetails}
        </div>
        {[[t.orgName,"orgName",t.orgNamePlaceholder],[t.industry,"industry","e.g. Financial Services"],[t.orgSize,"size","e.g. 200 employees"]].map(([label,key,ph])=>(
          <div key={key} style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label} *</label>
            <input value={draft[key]} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))} placeholder={ph} dir="auto"
              style={{width:"100%",padding:"10px 13px",border:"1.5px solid #1e293b",borderRadius:9,fontSize:13,background:"#080e1c",color:"#e2e8f0",fontFamily:"inherit"}}/>
          </div>
        ))}

        {/* Domain breakdown */}
        <div style={{marginTop:8,padding:"14px",background:"#10b98108",border:"1px solid #10b98120",borderRadius:10}}>
          <div style={{fontSize:10,fontWeight:700,color:"#10b981",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>ISO 27001:2022 — All 4 Domains</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {CONTROLS.map(d=>(
              <div key={d.domain} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:3,height:12,borderRadius:2,background:d.color,flexShrink:0}}/>
                <div style={{fontSize:12,color:"#64748b",flex:1}}>{d.domain}</div>
                <span style={{padding:"2px 8px",background:d.color+"15",color:d.color,borderRadius:4,fontSize:10,fontWeight:700}}>{d.items.length} controls</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button onClick={onStart} disabled={!valid}
        style={{width:"100%",padding:"14px",background:valid?"linear-gradient(135deg,#10b981,#059669)":"#1e293b",border:"none",borderRadius:11,color:valid?"#fff":"#475569",fontSize:14,fontWeight:800,cursor:valid?"pointer":"default",fontFamily:"inherit",boxShadow:valid?"0 4px 16px #10b98130":"none"}}>
        🔍 {t.startGap} — 93 {lang==="ar"?"ضابطاً":"Controls"}
      </button>
    </div>
  );
}

function Assessment({ form, onReset, t, isRTL, lang }) {
  const [phase, setPhase]       = useState("idle");
  const [ctrlIdx, setCtrlIdx]   = useState(0);
  const [messages, setMessages] = useState([]);
  const [results, setResults]   = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showTracker, setShowTracker] = useState(true);
  const [pendingFile, setPendingFile] = useState(null);
  const [activeDomain, setActiveDomain] = useState(0);
  const [summary, setSummary]   = useState("");
  const fileRef  = useRef(null);
  const bottomRef= useRef(null);

  const ctrl  = ALL_CONTROLS[ctrlIdx];
  const score = results.length ? Math.round((results.filter(r=>r.verdict==="Compliant").length / results.length) * 100) : 0;
  const scoreColor = score>=75?"#22c55e":score>=50?"#eab308":"#ef4444";

  // Current domain info
  const currentDomain = CONTROLS.find(d => d.items.some(i => i.id === ctrl?.id));

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);

  function addMsg(role, text, meta={}) { setMessages(m=>[...m,{role,text,...meta}]); }

  async function startAssessment() {
    setPhase("questioning");
    setLoading(true);
    addMsg("assistant", lang==="ar"
      ? `🚀 بدء تقييم شامل لـ ISO 27001:2022 — جميع 93 ضابطاً لـ ${form.orgName}.\n\nسيتم التقييم عبر 4 مجالات. لنبدأ:`
      : `🚀 Starting full ISO 27001:2022 assessment — all 93 controls for ${form.orgName}.\n\nWe'll work through 4 domains. Let's begin:`);
    const q = await callAI(buildQuestionPrompt(ctrl, lang, form.orgName, form.industry));
    addMsg("assistant", q, {controlId:ctrl.id, controlName:ctrl.name});
    setLoading(false);
  }

  async function submitAnswer() {
    const ans = input.trim();
    if (!ans && !pendingFile) return;
    setInput("");

    let hasFile = false;
    if (pendingFile) {
      hasFile = true;
      addMsg("user", ans||(lang==="ar"?"[تم رفع دليل]":"[Evidence uploaded]"), {file:pendingFile.name});
      setPendingFile(null);
    } else {
      addMsg("user", ans);
    }

    setLoading(true);
    const statusMsg = lang==="ar" ? `جارٍ تقييم ${ctrl.id}…` : `Evaluating ${ctrl.id}…`;
    addMsg("assistant", statusMsg, {isStatus:true});

    const raw    = await callAI(buildAssessPrompt(ctrl, ans||(lang==="ar"?"دليل مرفوع":"uploaded evidence"), hasFile, lang, form.orgName, form.industry));
    const parsed = parseAssess(raw);

    setMessages(m => m.filter(x=>!x.isStatus));
    const newResult = { id:ctrl.id, name:ctrl.name, verdict:parsed.verdict, finding:parsed.finding, recommendation:parsed.recommendation };
    setResults(r => [...r, newResult]);

    const vs = VERDICT_STYLE[parsed.verdict];
    addMsg("assistant",
      `**${ctrl.id} — ${ctrl.name}**\n\n${lang==="ar"?"الحكم":"Verdict"}: ${parsed.verdict} ${vs.icon}\n\n${lang==="ar"?"النتيجة":"Finding"}: ${parsed.finding}\n\n${lang==="ar"?"التوصية":"Recommendation"}: ${parsed.recommendation}`,
      {verdict:parsed.verdict}
    );

    const next = ctrlIdx + 1;
    if (next >= TOTAL) {
      setPhase("complete");
      setLoading(true);
      const allResults = [...results, newResult];
      const sum = await callAI(buildSummaryPrompt(allResults, form.orgName, form.industry, lang));
      setSummary(sum);
      addMsg("assistant", (lang==="ar"?"✅ اكتمل التقييم الشامل! تم تقييم جميع 93 ضابطاً.\n\n":"✅ Full assessment complete! All 93 controls assessed.\n\n") + sum);
      setLoading(false);
    } else {
      setCtrlIdx(next);
      const nextCtrl = ALL_CONTROLS[next];
      // Update active domain tab
      const domIdx = CONTROLS.findIndex(d => d.items.some(i => i.id === nextCtrl.id));
      setActiveDomain(domIdx);
      const q = await callAI(buildQuestionPrompt(nextCtrl, lang, form.orgName, form.industry));
      addMsg("assistant", q, {controlId:nextCtrl.id, controlName:nextCtrl.name});
      setLoading(false);
    }
  }

  function fmt(text) {
    return text.split("\n").map((line,i,arr)=>{
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return <span key={i}>{parts.map((p,j)=>p.startsWith("**")&&p.endsWith("**")?<strong key={j} style={{color:"#e2e8f0"}}>{p.slice(2,-2)}</strong>:p)}{i<arr.length-1&&<br/>}</span>;
    });
  }

  const placeholder = phase==="idle"
    ? (lang==="ar"?'اضغط زر البدء أدناه…':"Click Start below…")
    : phase==="complete" ? t.askFollowup : t.describeImpl;

  // Progress per domain
  const domainProgress = CONTROLS.map(d=>({
    ...d,
    assessed: d.items.filter(i=>results.find(r=>r.id===i.id)).length,
    compliant: d.items.filter(i=>results.find(r=>r.id===i.id&&r.verdict==="Compliant")).length,
  }));

  return (
    <div style={{maxWidth:1100,animation:"fadeUp 0.3s ease"}} dir={isRTL?"rtl":"ltr"}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      <div style={{display:"grid",gridTemplateColumns:showTracker?"1fr 280px":"1fr",gap:16,alignItems:"flex-start"}}>

        {/* ── Chat Panel ── */}
        <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:16,overflow:"hidden"}}>

          {/* Header */}
          <div style={{background:"linear-gradient(135deg,#0f172a,#022c22)",padding:"12px 16px",borderBottom:"1px solid #1a2744",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🔍</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:"#f1f5f9",fontWeight:700,fontSize:13}}>ISO 27001:2022 — {form.orgName}</div>
              <div style={{color:"#475569",fontSize:11}}>
                {phase==="complete" ? "✅ "+(lang==="ar"?"اكتمل التقييم":"Assessment Complete")
                  : phase==="idle" ? (lang==="ar"?"جاهز للبدء":"Ready to start")
                  : `${lang==="ar"?"الضابط":"Control"} ${ctrlIdx+1}/${TOTAL} — ${currentDomain?.domain||""}`}
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>setShowTracker(v=>!v)} style={{background:"#10b98115",border:"1px solid #10b98130",color:"#10b981",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                {showTracker?t.hide:t.show} {t.tracker}
              </button>
              <button onClick={onReset} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{t.reset}</button>
            </div>
          </div>

          {/* Progress bar — all 93 controls */}
          {phase!=="idle"&&(
            <div style={{padding:"6px 12px",background:"#080e1c",borderBottom:"1px solid #1a2744"}}>
              <div style={{display:"flex",gap:1,flexWrap:"nowrap",overflowX:"auto"}}>
                {ALL_CONTROLS.map((c,i)=>{
                  const r = results.find(x=>x.id===c.id);
                  const isCurr = i===ctrlIdx && phase!=="complete";
                  const bg = r ? VERDICT_STYLE[r.verdict].color : isCurr ? "#0ea5e9" : "#1e293b";
                  return <div key={c.id} title={c.id} style={{flex:"0 0 6px",height:6,borderRadius:1,background:bg,transition:"background 0.3s"}}/>;
                })}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:"#334155"}}>
                <span>{results.length}/{TOTAL} {lang==="ar"?"مُقيَّم":"assessed"}</span>
                <span style={{color:scoreColor,fontWeight:700}}>{score}%</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{height:500,overflowY:"auto",padding:16,background:"#080e1c",display:"flex",flexDirection:"column",gap:10}}>
            {messages.length===0&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:16,color:"#334155"}}>
                <div style={{width:70,height:70,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>🔍</div>
                <div style={{textAlign:"center"}}>
                  <div style={{color:"#64748b",fontWeight:700,fontSize:15,marginBottom:6}}>{lang==="ar"?"تقييم ISO 27001:2022 الشامل":"Full ISO 27001:2022 Gap Assessment"}</div>
                  <div style={{fontSize:12,color:"#334155"}}>{lang==="ar"?`93 ضابطاً — 4 مجالات — ${form.orgName}`:`93 controls · 4 domains · ${form.orgName}`}</div>
                  <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12,flexWrap:"wrap"}}>
                    {CONTROLS.map(d=><span key={d.domain} style={{padding:"3px 10px",background:d.color+"15",color:d.color,borderRadius:4,fontSize:10,fontWeight:700}}>{d.items.length} {d.domain.split(" ")[1]}</span>)}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m,i)=>{
              const vs = m.verdict ? VERDICT_STYLE[m.verdict] : null;
              return (
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
                  {m.role==="assistant"&&(
                    <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🔍</div>
                  )}
                  <div style={{
                    maxWidth:"82%",padding:"10px 14px",
                    borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",
                    background:m.role==="user"?"linear-gradient(135deg,#10b981,#059669)":vs?vs.bg:"#0f172a",
                    color:"#e2e8f0",fontSize:13,lineHeight:1.7,
                    border:m.role==="assistant"?`1px solid ${vs?vs.border:"#1a2744"}`:"none",
                    whiteSpace:"pre-wrap",direction:"auto"
                  }}>
                    {m.controlId&&(
                      <div style={{fontSize:10,fontWeight:700,color:"#10b981",marginBottom:6,fontFamily:"monospace"}}>
                        {m.controlId} — {m.controlName}
                      </div>
                    )}
                    {m.file&&<div style={{fontSize:10,color:"#22c55e",marginBottom:4}}>📎 {m.file}</div>}
                    {fmt(m.text)}
                  </div>
                </div>
              );
            })}

            {loading&&(
              <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🔍</div>
                <div style={{padding:"11px 14px",background:"#0f172a",borderRadius:16,border:"1px solid #1a2744"}}>
                  <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#475569",animation:`bounce 1s ${i*0.2}s infinite`}}/>)}</div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{padding:"12px 16px",background:"#0f172a",borderTop:"1px solid #1a2744"}}>
            {pendingFile&&(
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"6px 10px",background:"#10b98115",border:"1px solid #10b98130",borderRadius:7}}>
                <span style={{color:"#10b981",fontSize:12}}>📎 {pendingFile.name}</span>
                <button onClick={()=>setPendingFile(null)} style={{marginLeft:"auto",background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:14}}>×</button>
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              {phase==="questioning"&&(
                <>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv" style={{display:"none"}} onChange={e=>setPendingFile(e.target.files[0])}/>
                  <button onClick={()=>fileRef.current?.click()} title={t.uploadEvidence}
                    style={{padding:"10px 12px",background:"#1e293b",border:"1px solid #334155",borderRadius:9,color:"#64748b",fontSize:14,cursor:"pointer",flexShrink:0}}>📎</button>
                </>
              )}
              <input value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(phase==="idle"?startAssessment():submitAnswer())}
                placeholder={placeholder} dir="auto"
                style={{flex:1,padding:"10px 13px",border:"1.5px solid #1e293b",borderRadius:9,fontSize:13,background:"#080e1c",color:"#e2e8f0",fontFamily:"inherit"}}/>
              <button onClick={phase==="idle"?startAssessment:submitAnswer}
                disabled={loading||(phase==="questioning"&&!input.trim()&&!pendingFile)}
                style={{padding:"10px 18px",background:loading?"#1e293b":"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:9,color:loading?"#475569":"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0,whiteSpace:"nowrap"}}>
                {phase==="idle"?(lang==="ar"?"🚀 ابدأ":"🚀 Start"):t.submit}
              </button>
            </div>
          </div>
        </div>

        {/* ── Tracker Panel ── */}
        {showTracker&&(
          <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:"90vh",overflowY:"auto"}}>

            {/* Score card */}
            <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:16}}>
              <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>{t.liveScore}</div>
              <div style={{fontSize:40,fontWeight:900,color:scoreColor,lineHeight:1,marginBottom:6}}>{score}%</div>
              <div style={{height:5,background:"#1e293b",borderRadius:3,overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",width:score+"%",background:scoreColor,borderRadius:3,transition:"width 0.5s"}}/>
              </div>
              <div style={{fontSize:11,color:"#475569",marginBottom:10}}>{results.length} / {TOTAL} {t.controlsAssessed}</div>
              {/* Verdict counts */}
              <div style={{display:"flex",gap:6}}>
                {[["Compliant","#22c55e","✓"],["Partial","#eab308","~"],["Non-Compliant","#ef4444","✗"]].map(([v,c,icon])=>{
                  const n = results.filter(r=>r.verdict===v).length;
                  return <div key={v} style={{flex:1,textAlign:"center",padding:"6px 4px",background:c+"12",borderRadius:7,border:`1px solid ${c}25`}}>
                    <div style={{fontSize:18,fontWeight:800,color:c}}>{n}</div>
                    <div style={{fontSize:9,color:"#475569",fontWeight:600}}>{icon}</div>
                  </div>;
                })}
              </div>
            </div>

            {/* Domain tabs */}
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {CONTROLS.map((d,i)=>(
                <button key={i} onClick={()=>setActiveDomain(i)}
                  style={{padding:"4px 8px",background:activeDomain===i?d.color+"20":"transparent",border:`1px solid ${activeDomain===i?d.color:"#1a2744"}`,borderRadius:6,color:activeDomain===i?d.color:"#475569",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {d.domain.split(" ")[0]} {d.domain.split(" ")[1]}
                </button>
              ))}
            </div>

            {/* Controls list for active domain */}
            <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:"10px 12px"}}>
              <div style={{fontSize:10,fontWeight:700,color:CONTROLS[activeDomain].color,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>
                {CONTROLS[activeDomain].domain} — {domainProgress[activeDomain].assessed}/{CONTROLS[activeDomain].items.length}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:3,maxHeight:300,overflowY:"auto"}}>
                {CONTROLS[activeDomain].items.map(item=>{
                  const r = results.find(x=>x.id===item.id);
                  const isCurrent = item.id===ctrl?.id && phase==="questioning";
                  const vs = r ? VERDICT_STYLE[r.verdict] : null;
                  return (
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 5px",borderRadius:5,background:isCurrent?"#0ea5e910":"transparent",border:isCurrent?"1px solid #0ea5e930":"1px solid transparent"}}>
                      <span style={{fontFamily:"monospace",fontSize:9,color:vs?vs.color:isCurrent?"#0ea5e9":"#334155",fontWeight:700,flexShrink:0,width:38}}>{item.id}</span>
                      <span style={{fontSize:10,color:vs?vs.color:isCurrent?"#94a3b8":"#334155",flex:1,lineHeight:1.2}}>{item.name}</span>
                      {r&&<span style={{fontSize:11,flexShrink:0}}>{vs.icon}</span>}
                      {isCurrent&&!r&&<div style={{width:5,height:5,borderRadius:"50%",background:"#0ea5e9",animation:"pulse 1s infinite",flexShrink:0}}/>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Domain progress bars */}
            <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Domain Progress</div>
              {domainProgress.map(d=>(
                <div key={d.domain} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:10,color:"#64748b"}}>{d.domain.replace("Controls","").trim()}</span>
                    <span style={{fontSize:10,color:d.color,fontWeight:700}}>{d.assessed}/{d.items.length}</span>
                  </div>
                  <div style={{height:3,background:"#1e293b",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:d.items.length?((d.assessed/d.items.length)*100)+"%":"0%",background:d.color,borderRadius:2,transition:"width 0.5s"}}/>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
