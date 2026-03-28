import { useState, useRef, useEffect, useCallback } from "react";

// ── Controls (93 total — ISO 27001:2022) ─────────────────────────────────────
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
    { id:"A.5.24", name:"Information security incident management planning" },
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
    { id:"A.5.36", name:"Compliance with policies, rules and standards" },
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

const VC = { "Compliant":"#22c55e", "Partial":"#eab308", "Non-Compliant":"#ef4444" };
const VB = { "Compliant":"#14532d20","Partial":"#78350f20","Non-Compliant":"#7f1d1d20" };

// ── Session helpers ───────────────────────────────────────────────────────────
const SESSION_KEY = "autoaudit_gap_session_id";

function genId() {
  return "gap_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
}
function loadStoredId()  { try { return localStorage.getItem(SESSION_KEY); } catch { return null; } }
function saveStoredId(id){ try { localStorage.setItem(SESSION_KEY, id); } catch {} }
function clearStoredId() { try { localStorage.removeItem(SESSION_KEY); } catch {} }

// ── D1 API calls ──────────────────────────────────────────────────────────────
async function dbCreate(id, org_name, industry, size, lang) {
  await fetch("/api/session", { method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ action:"create", id, org_name, industry, size, lang }) });
}
async function dbUpdate(id, phase, ctrl_idx) {
  await fetch("/api/session", { method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ action:"update", id, phase, ctrl_idx }) });
}
async function dbSaveResult(session_id, ctrl_id, ctrl_name, verdict, finding, recommendation) {
  await fetch("/api/session", { method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ action:"result", session_id, ctrl_id, ctrl_name, verdict, finding, recommendation }) });
}
async function dbSaveMessage(session_id, role, msg_text, extras={}) {
  if (extras.is_status) return; // never persist loading indicators
  await fetch("/api/session", { method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ action:"message", session_id, role, msg_text, ...extras }) });
}
async function dbLoad(id) {
  const res  = await fetch(`/api/session?id=${id}`);
  const data = await res.json();
  return data.ok ? data : null;
}
async function dbDelete(id) {
  await fetch(`/api/session?id=${id}`, { method:"DELETE" });
}

// ── AI helpers ────────────────────────────────────────────────────────────────
async function callAI(prompt) {
  const res  = await fetch("/api/chat", { method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ messages:[{ role:"user", content:prompt }] }) });
  const data = await res.json();
  return (data.content||[]).map(b=>b.text||"").join("");
}

function parseVerdict(raw) {
  const get = key => { const m = raw.match(new RegExp(key+":?\\s*(.+?)(?=\\n[A-Z]+:|$)","si")); return m ? m[1].trim() : ""; };
  const v = get("VERDICT");
  const verdict = v.includes("Non") ? "Non-Compliant" : v.includes("Partial") ? "Partial" : "Compliant";
  return { verdict, finding:get("FINDING"), recommendation:get("RECOMMENDATION") };
}

function qPrompt(ctrl, lang, org, industry) {
  const note = lang==="ar" ? "Ask in Arabic. Keep control ID in English." : "Ask in English.";
  return `ISO 27001:2022 lead auditor for ${org} (${industry}). ${note}\nAsk ONE specific interview question to assess control ${ctrl.id} - ${ctrl.name}.\nOutput only the question text.`;
}
function aPrompt(ctrl, ans, hasFile, lang, org, industry) {
  const note = lang==="ar" ? "Respond in Arabic. Keep control IDs and verdict words (Compliant/Partial/Non-Compliant) in English." : "Respond in English.";
  return `ISO 27001:2022 lead auditor assessing ${org} (${industry}). ${note}\nControl: ${ctrl.id} - ${ctrl.name}\nResponse: "${ans}"${hasFile?" [Evidence uploaded]":""}\n\nReply EXACTLY:\nVERDICT: [Compliant OR Partial OR Non-Compliant]\nFINDING: [1-2 sentences]\nRECOMMENDATION: [1-2 sentences]`;
}
function sPrompt(results, org, industry, lang) {
  const c=results.filter(r=>r.verdict==="Compliant").length;
  const p=results.filter(r=>r.verdict==="Partial").length;
  const n=results.filter(r=>r.verdict==="Non-Compliant").length;
  const score=Math.round((c/results.length)*100);
  const gaps=results.filter(r=>r.verdict==="Non-Compliant").slice(0,5).map(r=>r.ctrl_id||r.id).join(", ");
  const note=lang==="ar"?"Write entirely in Arabic.":"Write in English.";
  return `ISO 27001:2022 auditor. ${note}\n5-6 sentence executive summary for ${org} (${industry}).\nScore: ${score}% (${c} Compliant, ${p} Partial, ${n} Non-Compliant of ${results.length} controls).\nTop gaps: ${gaps||"none"}.\nCover: posture, strengths, critical gaps, recommendation, certification readiness.`;
}

// ── Root component ────────────────────────────────────────────────────────────
export default function GapModule({ t, isRTL, lang }) {
  const [view,     setView]     = useState("checking"); // checking | resume | setup | assessment
  const [session,  setSession]  = useState(null);       // loaded D1 session object
  const [draft,    setDraft]    = useState({ orgName:"", industry:"", size:"" });

  // On mount: check localStorage for a stored session ID, try to load from D1
  useEffect(() => {
    const storedId = loadStoredId();
    if (!storedId) { setView("setup"); return; }
    dbLoad(storedId).then(data => {
      if (data?.session) {
        setSession(data);
        setView("resume");
      } else {
        clearStoredId();
        setView("setup");
      }
    }).catch(() => { setView("setup"); });
  }, []);

  function startFresh() {
    const oldId = loadStoredId();
    if (oldId) dbDelete(oldId);
    clearStoredId();
    setSession(null);
    setView("setup");
  }

  async function handleStart() {
    const id = genId();
    saveStoredId(id);
    await dbCreate(id, draft.orgName, draft.industry, draft.size, lang);
    setSession({ session:{ id, org_name:draft.orgName, industry:draft.industry, size:draft.size, lang, phase:"idle", ctrl_idx:0 }, results:[], messages:[] });
    setView("assessment");
  }

  function handleResume() { setView("assessment"); }

  // ── Checking spinner ──
  if (view === "checking") return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300}}>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{position:"relative",width:40,height:40}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid #1e293b"}}/>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid transparent",borderTopColor:"#10b981",animation:"sp 0.9s linear infinite"}}/>
      </div>
    </div>
  );

  // ── Resume banner ──
  if (view === "resume" && session?.session) {
    const s = session.session;
    const assessed = session.results?.length || 0;
    const score = assessed ? Math.round((session.results.filter(r=>r.verdict==="Compliant").length/assessed)*100) : 0;
    const scoreColor = score>=75?"#22c55e":score>=50?"#eab308":"#ef4444";
    return (
      <div style={{maxWidth:520}} dir={isRTL?"rtl":"ltr"}>
        <h2 style={{fontSize:22,fontWeight:900,color:"#f1f5f9",marginBottom:6}}>{t.gapTitle}</h2>
        <p style={{color:"#475569",fontSize:13,marginBottom:20}}>{t.gapSubtitle}</p>

        {/* Session card */}
        <div style={{background:"#0f172a",border:"1px solid #10b98140",borderRadius:14,padding:24,marginBottom:14,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#10b981,#059669)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>💾</div>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:"#f1f5f9"}}>{isRTL?"جلسة محفوظة":"Saved Session Found"}</div>
              <div style={{fontSize:11,color:"#475569"}}>{isRTL?"يمكنك الاستمرار من حيث توقفت":"Continue where you left off"}</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {[
              [isRTL?"المنظمة":"Organization", s.org_name],
              [isRTL?"القطاع":"Industry",      s.industry],
              [isRTL?"الضوابط المقيمة":"Assessed", `${assessed} / ${TOTAL}`],
              [isRTL?"الدرجة الحالية":"Score",    `${score}%`],
            ].map(([l,v]) => (
              <div key={l} style={{background:"#080e1c",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#475569",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>{l}</div>
                <div style={{fontSize:14,fontWeight:800,color: l.includes("Score")||l.includes("الدرجة") ? scoreColor : "#e2e8f0"}}>{v}</div>
              </div>
            ))}
          </div>

          {/* Mini progress bar */}
          <div style={{marginBottom:16}}>
            <div style={{height:6,background:"#1e293b",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:(assessed/TOTAL*100)+"%",background:"linear-gradient(90deg,#10b981,#059669)",borderRadius:3}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:"#334155"}}>
              <span>{assessed} {isRTL?"مقيم":"assessed"}</span>
              <span>{TOTAL - assessed} {isRTL?"متبقي":"remaining"}</span>
            </div>
          </div>

          <div style={{display:"flex",gap:10}}>
            <button onClick={handleResume}
              style={{flex:1,padding:"11px",background:"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:9,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"}}>
              ▶ {isRTL?"استمر في التقييم":"Resume Assessment"}
            </button>
            <button onClick={startFresh}
              style={{padding:"11px 16px",background:"#1e293b",border:"1px solid #334155",borderRadius:9,color:"#94a3b8",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              {isRTL?"بدء جديد":"New Session"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Setup form ──
  if (view === "setup") return (
    <OrgSetup draft={draft} setDraft={setDraft} onStart={handleStart} t={t} isRTL={isRTL} lang={lang}/>
  );

  // ── Assessment ──
  if (view === "assessment" && session?.session) return (
    <Assessment
      session={session}
      onReset={startFresh}
      t={t} isRTL={isRTL} lang={lang}
    />
  );

  return null;
}

// ── OrgSetup ──────────────────────────────────────────────────────────────────
function OrgSetup({ draft, setDraft, onStart, t, isRTL, lang }) {
  const [loading, setLoading] = useState(false);
  const valid = draft.orgName && draft.industry && draft.size;

  async function handleStart() {
    if (!valid) return;
    setLoading(true);
    await onStart();
    setLoading(false);
  }

  return (
    <div style={{maxWidth:520}} dir={isRTL?"rtl":"ltr"}>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:22,fontWeight:900,color:"#f1f5f9",marginBottom:6}}>{t.gapTitle}</h2>
        <p style={{color:"#475569",fontSize:13}}>{t.gapSubtitle}</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:20}}>
        {[["93","Controls"],["4","Domains"],["37","Org"],["34","Tech"]].map(([n,l]) => (
          <div key={l} style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:900,color:"#10b981"}}>{n}</div>
            <div style={{fontSize:10,color:"#475569"}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:14,padding:24,marginBottom:16}}>
        {[[t.orgName,"orgName",t.orgNamePlaceholder],[t.industry,"industry","e.g. Financial Services"],[t.orgSize,"size","e.g. 200 employees"]].map(([label,key,ph]) => (
          <div key={key} style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label} *</label>
            <input value={draft[key]} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))} placeholder={ph} dir="auto"
              style={{width:"100%",padding:"10px 13px",border:"1.5px solid #1e293b",borderRadius:9,fontSize:13,background:"#080e1c",color:"#e2e8f0",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
        ))}
        <div style={{background:"#10b98108",border:"1px solid #10b98120",borderRadius:10,padding:14}}>
          <div style={{fontSize:10,fontWeight:700,color:"#10b981",marginBottom:10,textTransform:"uppercase"}}>ISO 27001:2022 — All 4 Domains</div>
          {CONTROLS.map(d=>(
            <div key={d.domain} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
              <div style={{width:3,height:12,borderRadius:2,background:d.color,flexShrink:0}}/>
              <div style={{fontSize:12,color:"#64748b",flex:1}}>{d.domain}</div>
              <span style={{padding:"2px 7px",background:d.color+"15",color:d.color,borderRadius:4,fontSize:10,fontWeight:700}}>{d.items.length}</span>
            </div>
          ))}
        </div>

        {/* D1 badge */}
        <div style={{marginTop:14,padding:"8px 12px",background:"#f59e0b08",border:"1px solid #f59e0b20",borderRadius:8,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:14}}>💾</span>
          <div style={{fontSize:11,color:"#64748b"}}>
            {isRTL
              ? "سيتم حفظ تقدمك تلقائياً في قاعدة بيانات Cloudflare D1 — يمكنك العودة في أي وقت"
              : "Your progress auto-saves to Cloudflare D1 — return anytime to continue"}
          </div>
        </div>
      </div>

      <button onClick={handleStart} disabled={!valid||loading}
        style={{width:"100%",padding:14,background:valid&&!loading?"linear-gradient(135deg,#10b981,#059669)":"#1e293b",border:"none",borderRadius:11,color:valid&&!loading?"#fff":"#475569",fontSize:14,fontWeight:800,cursor:valid&&!loading?"pointer":"default",fontFamily:"inherit"}}>
        {loading?(isRTL?"جارٍ الإنشاء…":"Creating session…"):(t.startGap+" — 93 "+(lang==="ar"?"ضابطاً":"Controls"))}
      </button>
    </div>
  );
}

// ── Assessment ────────────────────────────────────────────────────────────────
function Assessment({ session: initSession, onReset, t, isRTL, lang }) {
  const sid        = initSession.session.id;
  const form       = { orgName: initSession.session.org_name, industry: initSession.session.industry, size: initSession.session.size };

  // Restore state from D1 data
  const [phase,        setPhase]        = useState(initSession.session.phase || "idle");
  const [ctrlIdx,      setCtrlIdx]      = useState(initSession.session.ctrl_idx || 0);
  const [results,      setResults]      = useState(
    (initSession.results || []).map(r => ({ id:r.ctrl_id, name:r.ctrl_name, verdict:r.verdict, finding:r.finding, recommendation:r.recommendation }))
  );
  const [messages,     setMessages]     = useState(
    (initSession.messages || []).map(m => ({ role:m.role, text:m.msg_text, controlId:m.control_id, controlName:m.control_name, verdict:m.verdict, file:m.file_name }))
  );
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showTracker,  setShowTracker]  = useState(true);
  const [pendingFile,  setPendingFile]  = useState(null);
  const [activeDomain, setActiveDomain] = useState(0);
  const [saveStatus,   setSaveStatus]   = useState("saved"); // saved | saving | error
  const fileRef  = useRef(null);
  const bottomRef = useRef(null);

  const ctrl       = ALL_CONTROLS[ctrlIdx];
  const score      = results.length ? Math.round((results.filter(r=>r.verdict==="Compliant").length/results.length)*100) : 0;
  const scoreColor = score>=75?"#22c55e":score>=50?"#eab308":"#ef4444";
  const currentDomain = ctrl ? CONTROLS.find(d=>d.items.some(i=>i.id===ctrl.id)) : null;

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, loading]);

  // Save indicator helpers
  const withSave = useCallback(async (fn) => {
    setSaveStatus("saving");
    try { await fn(); setSaveStatus("saved"); }
    catch { setSaveStatus("error"); }
  }, []);

  const addMsg = useCallback((role, text, meta={}) => {
    const msg = {role, text, ...meta};
    setMessages(m => [...m, msg]);
    if (!meta.isStatus) {
      withSave(() => dbSaveMessage(sid, role, text, {
        control_id:   meta.controlId   || null,
        control_name: meta.controlName || null,
        verdict:      meta.verdict     || null,
        file_name:    meta.file        || null,
      }));
    }
  }, [sid, withSave]);

  const startAssessment = async () => {
    setPhase("questioning");
    setLoading(true);
    const intro = lang==="ar"
      ? "بدء تقييم ISO 27001:2022 — جميع 93 ضابطاً لـ " + form.orgName + ". لنبدأ:"
      : "Starting full ISO 27001:2022 assessment — all 93 controls for " + form.orgName + ". Let's begin:";
    addMsg("assistant", intro);
    await withSave(() => dbUpdate(sid, "questioning", 0));
    const q = await callAI(qPrompt(ctrl, lang, form.orgName, form.industry));
    addMsg("assistant", q, {controlId:ctrl.id, controlName:ctrl.name});
    setLoading(false);
  };

  const submitAnswer = async () => {
    const ans = input.trim();
    if (!ans && !pendingFile) return;
    setInput("");
    const hasFile = !!pendingFile;
    const fName   = pendingFile?.name;
    addMsg("user", ans||(lang==="ar"?"[دليل مرفوع]":"[Evidence uploaded]"), hasFile?{file:fName}:{});
    setPendingFile(null);
    setLoading(true);
    // Show transient status (not saved to DB)
    setMessages(m => [...m, {role:"assistant", text:lang==="ar"?"جاري التقييم...":"Evaluating...", isStatus:true}]);

    const raw    = await callAI(aPrompt(ctrl, ans||"evidence uploaded", hasFile, lang, form.orgName, form.industry));
    const parsed = parseVerdict(raw);

    // Remove status message
    setMessages(m => m.filter(x => !x.isStatus));

    const newResult = { id:ctrl.id, name:ctrl.name, ...parsed };
    let nextResults;
    setResults(r => { nextResults = [...r, newResult]; return nextResults; });

    const verdictText =
      ctrl.id + " - " + ctrl.name + "\n\n" +
      (lang==="ar"?"الحكم":"Verdict")       + ": " + parsed.verdict       + "\n\n" +
      (lang==="ar"?"النتيجة":"Finding")     + ": " + parsed.finding       + "\n\n" +
      (lang==="ar"?"التوصية":"Recommendation") + ": " + parsed.recommendation;

    addMsg("assistant", verdictText, {verdict:parsed.verdict});

    // Save result to D1
    await withSave(() => dbSaveResult(sid, ctrl.id, ctrl.name, parsed.verdict, parsed.finding, parsed.recommendation));

    const next = ctrlIdx + 1;
    if (next >= TOTAL) {
      setPhase("complete");
      await withSave(() => dbUpdate(sid, "complete", ctrlIdx));
      setTimeout(async () => {
        const finalRes = await new Promise(resolve => setResults(r => { resolve(r); return r; }));
        const sum = await callAI(sPrompt(finalRes, form.orgName, form.industry, lang));
        addMsg("assistant", (lang==="ar"?"اكتمل التقييم! جميع 93 ضابطاً.\n\n":"Assessment complete! All 93 controls.\n\n") + sum);
        setLoading(false);
      }, 200);
    } else {
      setCtrlIdx(next);
      await withSave(() => dbUpdate(sid, "questioning", next));
      const nextCtrl = ALL_CONTROLS[next];
      setActiveDomain(CONTROLS.findIndex(d=>d.items.some(i=>i.id===nextCtrl.id)));
      const q = await callAI(qPrompt(nextCtrl, lang, form.orgName, form.industry));
      addMsg("assistant", q, {controlId:nextCtrl.id, controlName:nextCtrl.name});
      setLoading(false);
    }
  };

  const placeholder = phase==="idle"
    ? (lang==="ar"?"اضغط ابدأ...":"Click Start...")
    : phase==="complete" ? t.askFollowup : t.describeImpl;

  return (
    <div style={{maxWidth:1100}} dir={isRTL?"rtl":"ltr"}>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}} @keyframes sp{to{transform:rotate(360deg)}}`}</style>
      <div style={{display:"grid",gridTemplateColumns:showTracker?"1fr 270px":"1fr",gap:16,alignItems:"flex-start"}}>

        {/* ── Chat panel ── */}
        <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:16,overflow:"hidden"}}>

          {/* Header */}
          <div style={{background:"linear-gradient(135deg,#0f172a,#022c22)",padding:"12px 16px",borderBottom:"1px solid #1a2744",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🔍</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:"#f1f5f9",fontWeight:700,fontSize:13}}>ISO 27001:2022 — {form.orgName}</div>
              <div style={{color:"#475569",fontSize:11}}>
                {phase==="complete"?(lang==="ar"?"اكتمل":"Complete"):phase==="idle"?(lang==="ar"?"جاهز":"Ready"):
                  (lang==="ar"?"الضابط ":"Control ")+(ctrlIdx+1)+"/"+TOTAL+(currentDomain?" — "+currentDomain.domain:"")}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              {/* Auto-save indicator */}
              <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",background:"#080e1c",borderRadius:5,border:"1px solid #1a2744"}}>
                {saveStatus==="saving" && <div style={{width:6,height:6,borderRadius:"50%",border:"2px solid transparent",borderTopColor:"#f59e0b",animation:"sp 0.8s linear infinite"}}/>}
                {saveStatus==="saved"  && <span style={{color:"#22c55e",fontSize:10}}>●</span>}
                {saveStatus==="error"  && <span style={{color:"#ef4444",fontSize:10}}>●</span>}
                <span style={{fontSize:9,color:saveStatus==="saved"?"#22c55e":saveStatus==="error"?"#ef4444":"#f59e0b",fontWeight:700}}>
                  {saveStatus==="saving"?(isRTL?"حفظ…":"Saving…"):saveStatus==="saved"?(isRTL?"محفوظ":"Saved"):(isRTL?"خطأ":"Error")}
                </span>
              </div>
              <button onClick={()=>setShowTracker(v=>!v)}
                style={{background:"#10b98115",border:"1px solid #10b98130",color:"#10b981",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                {showTracker?t.hide:t.show} {t.tracker}
              </button>
              <button onClick={onReset}
                style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                {t.reset}
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {phase!=="idle" && (
            <div style={{padding:"6px 12px",background:"#080e1c",borderBottom:"1px solid #1a2744"}}>
              <div style={{display:"flex",gap:1}}>
                {ALL_CONTROLS.map((c,i) => {
                  const r=results.find(x=>x.id===c.id);
                  const isCurr=i===ctrlIdx&&phase!=="complete";
                  const bg=r?(VC[r.verdict]||"#475569"):isCurr?"#0ea5e9":"#1e293b";
                  return <div key={c.id} title={c.id} style={{flex:"0 0 8px",height:6,borderRadius:1,background:bg}}/>;
                })}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:"#334155"}}>
                <span>{results.length}/{TOTAL} {lang==="ar"?"مقيم":"assessed"}</span>
                <span style={{color:scoreColor,fontWeight:700}}>{score}%</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div style={{height:500,overflowY:"auto",padding:16,background:"#080e1c",display:"flex",flexDirection:"column",gap:10}}>
            {messages.length===0 && (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:16}}>
                <div style={{width:70,height:70,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>🔍</div>
                <div style={{textAlign:"center"}}>
                  <div style={{color:"#64748b",fontWeight:700,fontSize:15,marginBottom:6}}>{lang==="ar"?"تقييم ISO 27001:2022 الشامل":"Full ISO 27001:2022 Gap Assessment"}</div>
                  <div style={{fontSize:12,color:"#334155"}}>{lang==="ar"?("93 ضابطاً — "+form.orgName):("93 controls — "+form.orgName)}</div>
                  <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12,flexWrap:"wrap"}}>
                    {CONTROLS.map(d=><span key={d.domain} style={{padding:"3px 10px",background:d.color+"15",color:d.color,borderRadius:4,fontSize:10,fontWeight:700}}>{d.items.length} {d.domain.split(" ")[1]}</span>)}
                  </div>
                  <div style={{marginTop:14,padding:"7px 14px",background:"#10b98110",border:"1px solid #10b98125",borderRadius:8,display:"inline-block"}}>
                    <span style={{fontSize:11,color:"#10b981"}}>💾 {isRTL?"التقدم محفوظ في Cloudflare D1":"Progress auto-saved to Cloudflare D1"}</span>
                  </div>
                </div>
              </div>
            )}
            {messages.map((m,i) => {
              const vc = m.verdict?(VC[m.verdict]||"#475569"):null;
              const vb = m.verdict?(VB[m.verdict]||"#0f172a"):null;
              return (
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
                  {m.role==="assistant" && <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🔍</div>}
                  <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"linear-gradient(135deg,#10b981,#059669)":(vb||"#0f172a"),color:"#e2e8f0",fontSize:13,lineHeight:1.7,border:m.role==="assistant"?("1px solid "+(vc?vc+"30":"#1a2744")):"none",whiteSpace:"pre-wrap",direction:"auto"}}>
                    {m.controlId && <div style={{fontSize:10,fontWeight:700,color:"#10b981",marginBottom:6,fontFamily:"monospace"}}>{m.controlId} — {m.controlName}</div>}
                    {m.file      && <div style={{fontSize:10,color:"#22c55e",marginBottom:4}}>📎 {m.file}</div>}
                    {m.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#10b981,#059669)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🔍</div>
                <div style={{padding:"11px 14px",background:"#0f172a",borderRadius:16,border:"1px solid #1a2744"}}>
                  <div style={{display:"flex",gap:4}}>{[0,1,2].map(j=><div key={j} style={{width:5,height:5,borderRadius:"50%",background:"#475569",animation:`bounce 1s ${j*0.2}s infinite`}}/>)}</div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input area */}
          <div style={{padding:"12px 16px",background:"#0f172a",borderTop:"1px solid #1a2744"}}>
            {pendingFile && (
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"6px 10px",background:"#10b98115",border:"1px solid #10b98130",borderRadius:7}}>
                <span style={{color:"#10b981",fontSize:12}}>📎 {pendingFile.name}</span>
                <button onClick={()=>setPendingFile(null)} style={{marginLeft:"auto",background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:16}}>×</button>
              </div>
            )}
            <div style={{display:"flex",gap:8}}>
              {phase==="questioning" && <>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv" style={{display:"none"}} onChange={e=>setPendingFile(e.target.files[0])}/>
                <button onClick={()=>fileRef.current?.click()} title={t.uploadEvidence}
                  style={{padding:"10px 12px",background:"#1e293b",border:"1px solid #334155",borderRadius:9,color:"#64748b",fontSize:14,cursor:"pointer",flexShrink:0}}>📎</button>
              </>}
              <input value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){phase==="idle"?startAssessment():submitAnswer();}}}
                placeholder={placeholder} dir="auto"
                style={{flex:1,padding:"10px 13px",border:"1.5px solid #1e293b",borderRadius:9,fontSize:13,background:"#080e1c",color:"#e2e8f0",fontFamily:"inherit"}}/>
              <button onClick={phase==="idle"?startAssessment:submitAnswer}
                disabled={loading||(phase==="questioning"&&!input.trim()&&!pendingFile)}
                style={{padding:"10px 18px",background:loading?"#1e293b":"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:9,color:loading?"#475569":"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
                {phase==="idle"?(lang==="ar"?"ابدأ":"Start"):t.submit}
              </button>
            </div>
          </div>
        </div>

        {/* ── Tracker panel ── */}
        {showTracker && (
          <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:16}}>
              <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>{t.liveScore}</div>
              <div style={{fontSize:40,fontWeight:900,color:scoreColor,lineHeight:1,marginBottom:6}}>{score}%</div>
              <div style={{height:5,background:"#1e293b",borderRadius:3,overflow:"hidden",marginBottom:8}}>
                <div style={{height:"100%",width:score+"%",background:scoreColor,borderRadius:3,transition:"width 0.5s"}}/>
              </div>
              <div style={{fontSize:11,color:"#475569",marginBottom:10}}>{results.length} / {TOTAL} {t.controlsAssessed}</div>
              <div style={{display:"flex",gap:6}}>
                {[["Compliant","#22c55e","OK"],["Partial","#eab308","~"],["Non-Compliant","#ef4444","X"]].map(([v,c,icon])=>{
                  const n=results.filter(r=>r.verdict===v).length;
                  return (
                    <div key={v} style={{flex:1,textAlign:"center",padding:"6px 4px",background:c+"12",borderRadius:7,border:"1px solid "+c+"25"}}>
                      <div style={{fontSize:18,fontWeight:800,color:c}}>{n}</div>
                      <div style={{fontSize:9,color:"#475569",fontWeight:600}}>{icon}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {CONTROLS.map((d,i)=>(
                <button key={i} onClick={()=>setActiveDomain(i)}
                  style={{padding:"4px 8px",background:activeDomain===i?d.color+"20":"transparent",border:"1px solid "+(activeDomain===i?d.color:"#1a2744"),borderRadius:6,color:activeDomain===i?d.color:"#475569",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  {d.domain.split(" ")[0]} {d.domain.split(" ")[1]}
                </button>
              ))}
            </div>

            <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:"10px 12px"}}>
              <div style={{fontSize:10,fontWeight:700,color:CONTROLS[activeDomain].color,marginBottom:8,textTransform:"uppercase"}}>
                {CONTROLS[activeDomain].domain} — {CONTROLS[activeDomain].items.filter(i=>results.find(r=>r.id===i.id)).length}/{CONTROLS[activeDomain].items.length}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:3,maxHeight:300,overflowY:"auto"}}>
                {CONTROLS[activeDomain].items.map(item=>{
                  const r=results.find(x=>x.id===item.id);
                  const isCurrent=ctrl&&item.id===ctrl.id&&phase==="questioning";
                  const col=r?(VC[r.verdict]||"#475569"):isCurrent?"#0ea5e9":"#334155";
                  return (
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 5px",borderRadius:5,background:isCurrent?"#0ea5e910":"transparent",border:isCurrent?"1px solid #0ea5e930":"1px solid transparent"}}>
                      <span style={{fontFamily:"monospace",fontSize:9,color:col,fontWeight:700,flexShrink:0,width:38}}>{item.id}</span>
                      <span style={{fontSize:10,color:col,flex:1,lineHeight:1.2}}>{item.name}</span>
                      {r&&<span style={{fontSize:10,color:VC[r.verdict],flexShrink:0}}>{r.verdict==="Compliant"?"OK":r.verdict==="Partial"?"~":"X"}</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Domain Progress</div>
              {CONTROLS.map(d=>{
                const assessed=d.items.filter(i=>results.find(r=>r.id===i.id)).length;
                return (
                  <div key={d.domain} style={{marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:10,color:"#64748b"}}>{d.domain.replace("Controls","").trim()}</span>
                      <span style={{fontSize:10,color:d.color,fontWeight:700}}>{assessed}/{d.items.length}</span>
                    </div>
                    <div style={{height:3,background:"#1e293b",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:(d.items.length?(assessed/d.items.length*100):0)+"%",background:d.color,borderRadius:2,transition:"width 0.5s"}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Session info */}
            <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:"12px 14px"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>
                {isRTL?"معلومات الجلسة":"Session"}
              </div>
              <div style={{fontSize:10,color:"#475569",fontFamily:"monospace",marginBottom:6,wordBreak:"break-all"}}>{sid}</div>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:9,color:"#22c55e"}}>●</span>
                <span style={{fontSize:10,color:"#475569"}}>Cloudflare D1</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
