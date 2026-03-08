import { useState, useRef, useEffect } from "react";

// ISO 27001:2022 controls — labels stay in English (international standard), AI responds in chosen language
const CONTROLS = [
  { domain:"A.5 Organizational", items:[
    { id:"A.5.1",  name:"Information Security Policies" },
    { id:"A.5.2",  name:"Information Security Roles" },
    { id:"A.5.15", name:"Access Control Policy" },
    { id:"A.5.24", name:"Incident Management Planning" },
    { id:"A.5.30", name:"ICT Readiness for Business Continuity" },
  ]},
  { domain:"A.6 People", items:[
    { id:"A.6.1", name:"Screening" },
    { id:"A.6.3", name:"Information Security Awareness & Training" },
    { id:"A.6.5", name:"Responsibilities After Termination" },
  ]},
  { domain:"A.7 Physical", items:[
    { id:"A.7.1", name:"Physical Security Perimeters" },
    { id:"A.7.4", name:"Physical Security Monitoring" },
    { id:"A.7.7", name:"Clear Desk and Clear Screen" },
  ]},
  { domain:"A.8 Technological", items:[
    { id:"A.8.2",  name:"Privileged Access Rights" },
    { id:"A.8.5",  name:"Secure Authentication" },
    { id:"A.8.8",  name:"Management of Technical Vulnerabilities" },
    { id:"A.8.12", name:"Data Leakage Prevention" },
    { id:"A.8.15", name:"Logging" },
    { id:"A.8.24", name:"Use of Cryptography" },
  ]},
];
const ALL_CONTROLS = CONTROLS.flatMap(d=>d.items);

const VERDICT_STYLE = {
  Compliant:     { color:"#22c55e", bg:"#14532d20", border:"#22c55e30", icon:"✓" },
  Partial:       { color:"#eab308", bg:"#78350f20", border:"#eab30830", icon:"~" },
  "Non-Compliant":{ color:"#ef4444", bg:"#7f1d1d20", border:"#ef444430", icon:"✗" },
};

function buildPrompt(control, answer, hasFile, lang, orgName, industry) {
  const langNote = lang==="ar"
    ? "IMPORTANT: Respond entirely in Arabic. Keep control IDs and verdicts (Compliant/Partial/Non-Compliant) in English."
    : "Respond in English.";
  return `You are an ISO 27001:2022 lead auditor assessing ${orgName} (${industry}).
${langNote}
Control under assessment: ${control.id} — ${control.name}
Assessor's response: "${answer}"${hasFile?" [Supporting evidence document was uploaded and reviewed]":""}

Provide your assessment in this EXACT format (no extra text):
QUESTION: [One specific follow-up or clarifying question about this control, OR write NONE if fully answered]
VERDICT: [Compliant OR Partial OR Non-Compliant]
FINDING: [1-2 sentence assessment of what was found]
RECOMMENDATION: [1-2 sentence specific action to improve or maintain compliance]`;
}

function buildQuestionPrompt(control, lang, orgName, industry) {
  const langNote = lang==="ar"
    ? "Ask your question in Arabic. Keep control ID in English."
    : "Ask in English.";
  return `You are an ISO 27001:2022 lead auditor conducting a gap assessment for ${orgName} (${industry}).
${langNote}
Ask ONE concise, specific interview question to assess control ${control.id} — ${control.name}.
Output only the question, no preamble.`;
}

function buildSummaryPrompt(results, orgName, industry, lang) {
  const verdicts = results.map(r=>`${r.id}: ${r.verdict}`).join(", ");
  const score    = Math.round((results.filter(r=>r.verdict==="Compliant").length/results.length)*100);
  const langNote = lang==="ar" ? "Write the entire summary in Arabic." : "Write in English.";
  return `You are an ISO 27001:2022 lead auditor. ${langNote}
Write a concise executive summary (4-5 sentences) for ${orgName} (${industry}).
Overall compliance score: ${score}%. Verdicts: ${verdicts}.
Cover: overall posture, top 2 strengths, top 2 critical gaps, one strategic recommendation.`;
}

async function callAI(prompt) {
  const res  = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
  const data = await res.json();
  return (data.content||[]).map(b=>b.text||"").join("");
}

async function fileToBase64(file) {
  return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(file);});
}

function parseAssessment(raw) {
  const get=(key)=>{const m=raw.match(new RegExp(key+":?\\s*(.+?)(?=\\n[A-Z]+:|$)","si"));return m?m[1].trim():"";};
  return { question:get("QUESTION"), verdict:get("VERDICT"), finding:get("FINDING"), recommendation:get("RECOMMENDATION") };
}

export default function GapModule({ t, isRTL, lang }) {
  const [orgForm, setOrgForm]   = useState(null);
  const [draft, setDraft]       = useState({orgName:"",industry:"",size:""});
  if (!orgForm) return <OrgSetup draft={draft} setDraft={setDraft} onStart={()=>setOrgForm({...draft})} t={t} isRTL={isRTL}/>;
  return <Assessment form={orgForm} onReset={()=>{setOrgForm(null);setDraft({orgName:"",industry:"",size:""});}} t={t} isRTL={isRTL} lang={lang}/>;
}

function OrgSetup({ draft, setDraft, onStart, t, isRTL }) {
  const valid = draft.orgName && draft.industry && draft.size;
  return (
    <div style={{maxWidth:500}} dir={isRTL?"rtl":"ltr"}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:22,fontWeight:900,color:"#f1f5f9",marginBottom:6}}>{t.gapTitle}</h2>
        <p style={{color:"#475569",fontSize:13,lineHeight:1.7}}>{t.gapSubtitle}</p>
      </div>
      <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:14,padding:24,marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:18,display:"flex",alignItems:"center",gap:7}}>
          <span style={{width:3,height:13,background:"#10b981",borderRadius:2,display:"inline-block"}}/>{t.orgDetails}
        </div>
        {[[t.orgName,"orgName",t.orgNamePlaceholder],[t.industry,"industry",t.industryPlaceholder||"e.g. Financial Services"],[t.orgSize,"size",t.orgSizePlaceholder||"e.g. 200 employees"]].map(([label,key,ph])=>(
          <div key={key} style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label} *</label>
            <input value={draft[key]} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))} placeholder={ph} dir="auto"
              style={{width:"100%",padding:"10px 13px",border:"1.5px solid #1e293b",borderRadius:9,fontSize:13,background:"#080e1c",color:"#e2e8f0",fontFamily:"inherit"}}/>
          </div>
        ))}
        <div style={{background:"#10b98110",border:"1px solid #10b98125",borderRadius:10,padding:"12px 14px",marginTop:4}}>
          <div style={{fontSize:10,fontWeight:700,color:"#10b981",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>{t.whatToExpect}</div>
          {t.gapExpect.map(s=>(
            <div key={s} style={{fontSize:12,color:"#64748b",display:"flex",gap:7,alignItems:"flex-start",marginBottom:4}}>
              <span style={{color:"#10b981",flexShrink:0}}>✓</span>{s}
            </div>
          ))}
        </div>
      </div>
      <button onClick={onStart} disabled={!valid}
        style={{width:"100%",padding:"14px",background:valid?"linear-gradient(135deg,#10b981,#059669)":"#1e293b",border:"none",borderRadius:11,color:valid?"#fff":"#475569",fontSize:14,fontWeight:800,cursor:valid?"pointer":"default",fontFamily:"inherit"}}>
        {t.startGap}
      </button>
    </div>
  );
}

function Assessment({ form, onReset, t, isRTL, lang }) {
  const [phase, setPhase]         = useState("idle"); // idle | questioning | reviewing | complete
  const [ctrlIdx, setCtrlIdx]     = useState(0);
  const [messages, setMessages]   = useState([]);
  const [results, setResults]     = useState([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [showTracker, setShowTracker] = useState(true);
  const [summary, setSummary]     = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const fileRef  = useRef(null);
  const bottomRef= useRef(null);
  const ctrl     = ALL_CONTROLS[ctrlIdx];
  const score    = results.length ? Math.round((results.filter(r=>r.verdict==="Compliant").length/results.length)*100) : 0;

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);

  function addMsg(role, text, meta={}) { setMessages(m=>[...m,{role,text,...meta}]); }

  async function startAssessment() {
    setPhase("questioning");
    setLoading(true);
    addMsg("assistant", lang==="ar"?`🚀 بدء تقييم ISO 27001:2022 لـ ${form.orgName}.\n\nسيتم تقييم 16 ضابطاً عبر 4 مجالات. ابدأ بالضابط الأول:`:`🚀 Starting ISO 27001:2022 assessment for ${form.orgName}.\n\nWe will assess 16 controls across 4 domains. Let's begin with the first control:`);
    const q = await callAI(buildQuestionPrompt(ctrl, lang, form.orgName, form.industry));
    addMsg("assistant", q, {controlId: ctrl.id, controlName: ctrl.name});
    setLoading(false);
  }

  async function submitAnswer() {
    const ans = input.trim();
    if (!ans && !pendingFile) return;
    setInput("");

    let fileInfo = null;
    if (pendingFile) {
      const b64 = await fileToBase64(pendingFile);
      fileInfo = { name:pendingFile.name, type:pendingFile.type, b64 };
      addMsg("user", ans || (lang==="ar"?"[تم رفع ملف دليل]":"[Evidence file uploaded]"), { file: pendingFile.name });
      setPendingFile(null);
    } else {
      addMsg("user", ans);
    }

    setLoading(true);
    addMsg("assistant", lang==="ar"?`جارٍ تقييم ${ctrl.id}…`:`Evaluating ${ctrl.id}…`, {isStatus:true});

    const raw    = await callAI(buildPrompt(ctrl, ans||(lang==="ar"?"دليل مرفوع":"uploaded evidence"), !!fileInfo, lang, form.orgName, form.industry));
    const parsed = parseAssessment(raw);
    const verdict= parsed.verdict.includes("Non")?"Non-Compliant":parsed.verdict.includes("Partial")?"Partial":"Compliant";

    setMessages(m=>m.filter(x=>!x.isStatus));
    setResults(r=>[...r,{ id:ctrl.id, name:ctrl.name, verdict, finding:parsed.finding, recommendation:parsed.recommendation }]);

    const vs = VERDICT_STYLE[verdict];
    addMsg("assistant",
      `**${ctrl.id} — ${ctrl.name}**\n\n` +
      `${lang==="ar"?"الحكم":"Verdict"}: ${verdict} ${vs.icon}\n\n` +
      `${lang==="ar"?"النتيجة":"Finding"}: ${parsed.finding}\n\n` +
      `${lang==="ar"?"التوصية":"Recommendation"}: ${parsed.recommendation}`,
      {verdict}
    );

    const next = ctrlIdx + 1;
    if (next >= ALL_CONTROLS.length) {
      setPhase("complete");
      setLoading(true);
      const sum = await callAI(buildSummaryPrompt([...results,{id:ctrl.id,verdict}], form.orgName, form.industry, lang));
      setSummary(sum);
      addMsg("assistant", (lang==="ar"?"✅ اكتمل التقييم! إليك الملخص التنفيذي:":"✅ Assessment complete! Here is your executive summary:") + "\n\n" + sum);
      setLoading(false);
    } else {
      setCtrlIdx(next);
      const nextCtrl = ALL_CONTROLS[next];
      const q = await callAI(buildQuestionPrompt(nextCtrl, lang, form.orgName, form.industry));
      addMsg("assistant", q, {controlId:nextCtrl.id, controlName:nextCtrl.name});
    }
    setLoading(false);
  }

  function fmt(text) {
    return text.split("\n").map((line,i,arr)=>{
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return <span key={i}>{parts.map((p,j)=>p.startsWith("**")&&p.endsWith("**")?<strong key={j} style={{color:"#e2e8f0"}}>{p.slice(2,-2)}</strong>:p)}{i<arr.length-1&&<br/>}</span>;
    });
  }

  const placeholder = phase==="idle"
    ? (lang==="ar"?'اكتب "start" للبدء…':t.typeStart)
    : phase==="complete"
    ? t.askFollowup
    : t.describeImpl;

  return (
    <div style={{maxWidth:1000,animation:"fadeUp 0.3s ease"}} dir={isRTL?"rtl":"ltr"}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>

      <div style={{display:"grid",gridTemplateColumns:showTracker?"1fr 260px":"1fr",gap:16,alignItems:"flex-start"}}>
        {/* Chat */}
        <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:16,overflow:"hidden"}}>
          {/* Header */}
          <div style={{background:"linear-gradient(135deg,#0f172a,#022c22)",padding:"12px 16px",borderBottom:"1px solid #1a2744",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🔍</div>
            <div style={{flex:1}}>
              <div style={{color:"#f1f5f9",fontWeight:700,fontSize:13}}>{t.isoAssessment}</div>
              <div style={{color:"#475569",fontSize:11}}>{form.orgName} · {phase==="complete"?"✅ "+t.assessmentComplete : phase==="idle"?t.readyToStart:`${t.assessingControl} ${ctrlIdx+1} ${t.of} ${ALL_CONTROLS.length}`}</div>
            </div>
            <button onClick={()=>setShowTracker(v=>!v)} style={{background:"#10b98115",border:"1px solid #10b98130",color:"#10b981",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit",marginRight:4}}>
              {showTracker?t.hide:t.show} {t.tracker}
            </button>
            <button onClick={onReset} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{t.reset}</button>
          </div>

          {/* Progress */}
          {phase!=="idle"&&(
            <div style={{padding:"8px 16px",background:"#080e1c",borderBottom:"1px solid #1a2744"}}>
              <div style={{display:"flex",gap:2,flexWrap:"wrap"}}>
                {ALL_CONTROLS.map((c,i)=>{
                  const r=results.find(x=>x.id===c.id);
                  const bg=r?VERDICT_STYLE[r.verdict].color:i===ctrlIdx&&phase!=="complete"?"#0ea5e9":"#1e293b";
                  return <div key={c.id} title={c.id} style={{flex:1,minWidth:6,height:4,borderRadius:2,background:bg,transition:"background 0.3s"}}/>;
                })}
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{height:480,overflowY:"auto",padding:16,background:"#080e1c",display:"flex",flexDirection:"column",gap:10}}>
            {messages.length===0&&(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:16,color:"#334155"}}>
                <div style={{width:60,height:60,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>🔍</div>
                <div style={{textAlign:"center"}}>
                  <div style={{color:"#64748b",fontWeight:700,marginBottom:6}}>{lang==="ar"?"جاهز لبدء تقييم ISO 27001:2022":t.gapTitle}</div>
                  <div style={{fontSize:12,color:"#334155"}}>{lang==="ar"?`${ALL_CONTROLS.length} ضابطاً سيتم تقييمها لـ ${form.orgName}`:`${ALL_CONTROLS.length} controls to assess for ${form.orgName}`}</div>
                </div>
              </div>
            )}
            {messages.map((m,i)=>{
              const vs = m.verdict ? VERDICT_STYLE[m.verdict] : null;
              return (
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
                  {m.role==="assistant"&&<div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🔍</div>}
                  <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"linear-gradient(135deg,#10b981,#059669)":vs?vs.bg:"#0f172a",color:"#e2e8f0",fontSize:13,lineHeight:1.7,border:m.role==="assistant"?`1px solid ${vs?vs.border:"#1a2744"}`:"none",whiteSpace:"pre-wrap",direction:"auto"}}>
                    {m.controlId&&<div style={{fontSize:10,fontWeight:700,color:"#10b981",marginBottom:6,fontFamily:"monospace"}}>{m.controlId} — {m.controlName}</div>}
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
              {phase!=="idle"&&(
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
              <button
                onClick={phase==="idle"?startAssessment:submitAnswer}
                disabled={loading||(phase!=="idle"&&!input.trim()&&!pendingFile)}
                style={{padding:"10px 18px",background:loading?"#1e293b":"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:9,color:loading?"#475569":"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
                {phase==="idle"?t.startAssessment.replace("🚀 ",""):t.submit}
              </button>
            </div>
          </div>
        </div>

        {/* Tracker */}
        {showTracker&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:16}}>
              <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>{t.liveScore}</div>
              <div style={{fontSize:36,fontWeight:900,color:score>=75?"#22c55e":score>=50?"#eab308":"#ef4444",lineHeight:1,marginBottom:6}}>{score}%</div>
              <div style={{height:4,background:"#1e293b",borderRadius:2,overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",width:score+"%",background:score>=75?"#22c55e":score>=50?"#eab308":"#ef4444",borderRadius:2,transition:"width 0.5s"}}/>
              </div>
              <div style={{fontSize:11,color:"#475569"}}>{results.length} / {ALL_CONTROLS.length} {t.controlsAssessed}</div>
            </div>

            {CONTROLS.map(domain=>(
              <div key={domain.domain} style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#475569",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.07em"}}>{domain.domain}</div>
                {domain.items.map(item=>{
                  const r=results.find(x=>x.id===item.id);
                  const isCurrent=item.id===ctrl?.id&&phase==="questioning";
                  const vs=r?VERDICT_STYLE[r.verdict]:null;
                  return (
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,padding:"4px 6px",borderRadius:6,background:isCurrent?"#0ea5e910":"transparent",border:isCurrent?"1px solid #0ea5e930":"1px solid transparent"}}>
                      <span style={{fontFamily:"monospace",fontSize:10,color:vs?vs.color:isCurrent?"#0ea5e9":"#334155",fontWeight:700,flexShrink:0,width:40}}>{item.id}</span>
                      <span style={{fontSize:11,color:vs?vs.color:isCurrent?"#94a3b8":"#334155",flex:1,lineHeight:1.3}}>{item.name}</span>
                      {r&&<span style={{fontSize:13,flexShrink:0}}>{vs.icon}</span>}
                      {isCurrent&&!r&&<span style={{width:6,height:6,borderRadius:"50%",background:"#0ea5e9",flexShrink:0,animation:"pulse 1s infinite"}}/>}
                    </div>
                  );
                })}
              </div>
            ))}

            {results.length>0&&(
              <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Summary</div>
                {[["Compliant","#22c55e"],["Partial","#eab308"],["Non-Compliant","#ef4444"]].map(([v,c])=>{
                  const n=results.filter(r=>r.verdict===v).length;
                  return n>0?<div key={v} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,fontSize:12}}>
                    <span style={{color:"#64748b"}}>{v}</span><span style={{fontWeight:700,color:c}}>{n}</span>
                  </div>:null;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
