import { useState } from "react";

const FRAMEWORKS = {
  "ISO 27001:2022":{ color:"#0ea5e9",badge:"ISO",  controls:["A.5 Organizational Controls","A.6 People Controls","A.7 Physical Controls","A.8 Technological Controls"] },
  "NIST CSF 2.0":  { color:"#8b5cf6",badge:"NIST", controls:["GV.OC — Organizational Context","ID.AM — Asset Management","PR.AA — Identity & Access","DE.CM — Continuous Monitoring"] },
  "PCI-DSS v4.0":  { color:"#f59e0b",badge:"PCI",  controls:["Req. 1 — Network Security","Req. 7 — Access Control","Req. 8 — Authentication","Req. 12 — Security Policy"] },
  "GDPR":          { color:"#10b981",badge:"GDPR", controls:["Art. 5 — Processing Principles","Art. 24 — Controller Responsibility","Art. 32 — Security Measures","Art. 37 — DPO Designation"] },
  "SOC 2":         { color:"#ef4444",badge:"SOC2", controls:["CC1 — Control Environment","CC6 — Logical Access","CC7 — System Operations","CC9 — Risk Mitigation"] }
};
const SEV_COLOR = { Critical:"#dc2626",High:"#ea580c",Medium:"#d97706",Low:"#65a30d" };
const MAT_COLOR = { Initial:"#ef4444",Developing:"#f59e0b",Defined:"#3b82f6",Managed:"#8b5cf6",Optimising:"#10b981" };
const STAT_STYLE = {
  "Fully Compliant":  {bg:"#dcfce7",color:"#166534",dot:"#22c55e"},
  "Partial Coverage": {bg:"#fef9c3",color:"#854d0e",dot:"#eab308"},
  "Gap Identified":   {bg:"#fee2e2",color:"#991b1b",dot:"#ef4444"},
  "Not Applicable":   {bg:"#f3f4f6",color:"#374151",dot:"#9ca3af"}
};

function safeJSON(raw){
  try{let t=raw.trim().replace(/^```(?:json)?[\r\n]*/i,"").replace(/[\r\n]*```\s*$/i,"").trim();const s=t.indexOf("{"),e=t.lastIndexOf("}");if(s<0||e<0)return null;return JSON.parse(t.slice(s,e+1));}catch{return null;}
}

function makePrompt(f, lang) {
  const langInstr = lang==="ar"
    ? "IMPORTANT: Generate ALL text content (titles, summaries, sections, findings, recommendations) in ARABIC language. Keep control IDs and framework names in English."
    : "Generate all content in English.";
  return `You are AutoAudit, an expert cybersecurity GRC AI agent.
${langInstr}
Task: Generate a ${f.policyType} for ${f.orgName} (${f.industry}, ${f.size}), aligned to ${f.framework}.
CRITICAL: Respond with ONLY a raw JSON object. No markdown. No backticks. Start { end }.
Schema: {"policyTitle":"string","version":"1.0","effectiveDate":"2025-03-01","reviewDate":"2026-03-01","classification":"${lang==="ar"?"داخلي / سري":"Internal / Confidential"}","executiveSummary":"2 sentences","frameworkAlignment":[{"controlId":"ID","controlName":"name","status":"Fully Compliant","notes":"1 sentence"},{"controlId":"ID","controlName":"name","status":"Partial Coverage","notes":"1 sentence"},{"controlId":"ID","controlName":"name","status":"Gap Identified","notes":"1 sentence"},{"controlId":"ID","controlName":"name","status":"Fully Compliant","notes":"1 sentence"},{"controlId":"ID","controlName":"name","status":"Fully Compliant","notes":"1 sentence"}],"policySections":[{"title":"1. Purpose","content":"2 sentences"},{"title":"2. Scope","content":"2 sentences"},{"title":"3. Policy Statement","content":"3 sentences"},{"title":"4. Roles and Responsibilities","content":"3 sentences"},{"title":"5. ${f.framework} Requirements","content":"3 sentences"},{"title":"6. Compliance and Enforcement","content":"2 sentences"}],"riskFindings":[{"id":"F-001","finding":"1 sentence","severity":"High","recommendation":"1 sentence"},{"id":"F-002","finding":"1 sentence","severity":"Medium","recommendation":"1 sentence"},{"id":"F-003","finding":"1 sentence","severity":"Low","recommendation":"1 sentence"}],"complianceScore":72,"maturityLevel":"Developing","nextSteps":["action 1","action 2","action 3"]}
status:"Fully Compliant"|"Partial Coverage"|"Gap Identified"|"Not Applicable" | severity:"Critical"|"High"|"Medium"|"Low" | maturityLevel:"Initial"|"Developing"|"Defined"|"Managed"|"Optimising"
Make content specific to ${f.orgName} and ${f.industry}. Output ONLY JSON.`;
}

function Badge({status}){
  const s=STAT_STYLE[status]||STAT_STYLE["Not Applicable"];
  return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:s.bg,color:s.color,fontSize:11,fontWeight:700}}><span style={{width:6,height:6,borderRadius:"50%",background:s.dot}}/>{status}</span>;
}

const PRINT_STYLE=`@media print{body *{visibility:hidden!important}#print-zone,#print-zone *{visibility:visible!important}#print-zone{position:fixed;top:0;left:0;width:100%;background:#fff;padding:24px;color:#000}.no-print{display:none!important}@page{margin:15mm}}`;

export default function PolicyModule({ t, isRTL, lang }) {
  const [step,setStep]=useState("form");
  const [form,setForm]=useState({orgName:"",industry:"",size:"",framework:"",policyType:""});
  const [report,setReport]=useState(null);
  const [error,setError]=useState("");
  const fw=FRAMEWORKS[form.framework]||{color:"#0ea5e9",controls:[]};

  async function run(){
    if(!form.orgName||!form.industry||!form.size||!form.framework||!form.policyType){setError(t.fillAllFields);return;}
    setError("");setStep("loading");
    try{
      const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:makePrompt(form,lang)}]})});
      if(!res.ok)throw new Error("API "+res.status);
      const data=await res.json();
      const raw=(data.content||[]).map(b=>b.text||"").join("");
      const parsed=safeJSON(raw);
      if(!parsed)throw new Error(t.parseError);
      setReport(parsed);setStep("result");
    }catch(e){setError("Error: "+e.message);setStep("form");}
  }

  const sc=report?.complianceScore>=75?"#10b981":report?.complianceScore>=50?"#f59e0b":"#ef4444";
  const matLevels=["Initial","Developing","Defined","Managed","Optimising"];

  function FLabel({children}){return <label style={{display:"block",fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.07em"}}>{children} *</label>;}
  function FSelect({label,value,onChange,options,placeholder}){
    return <div><FLabel>{label}</FLabel>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",padding:"10px 13px",border:"1.5px solid #1e293b",borderRadius:9,fontSize:13,background:"#0f172a",color:value?"#e2e8f0":"#475569",fontFamily:"inherit",cursor:"pointer",textAlign:isRTL?"right":"left"}}>
        <option value="">{placeholder}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}
      </select></div>;
  }

  if(step==="form"||step==="loading") return (
    <div style={{maxWidth:700,animation:"fadeUp 0.3s ease"}} dir={isRTL?"rtl":"ltr"}>
      <style>{PRINT_STYLE}</style>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:22,fontWeight:900,color:"#f1f5f9",marginBottom:6}}>{t.policyTitle}</h2>
        <p style={{color:"#475569",fontSize:13,lineHeight:1.7}}>{t.policySubtitle}</p>
      </div>
      <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:14,padding:24,marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:800,color:"#334155",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:20,display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:3,height:13,background:"#0ea5e9",borderRadius:2,display:"inline-block"}}/>{t.orgDetails}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <div style={{gridColumn:"1/-1"}}>
            <FLabel>{t.orgName}</FLabel>
            <input value={form.orgName} onChange={e=>setForm(f=>({...f,orgName:e.target.value}))} placeholder={t.orgNamePlaceholder}
              style={{width:"100%",padding:"10px 13px",border:"1.5px solid #1e293b",borderRadius:9,fontSize:13,background:"#0f172a",color:"#e2e8f0",fontFamily:"inherit",textAlign:isRTL?"right":"left"}}/>
          </div>
          <FSelect label={t.industry}           value={form.industry}   onChange={v=>setForm(f=>({...f,industry:v}))}   options={t.industries}              placeholder={t.industryPlaceholder}/>
          <FSelect label={t.orgSize}            value={form.size}       onChange={v=>setForm(f=>({...f,size:v}))}       options={t.orgSizes}                placeholder={t.orgSizePlaceholder}/>
          <FSelect label={t.complianceFramework} value={form.framework} onChange={v=>setForm(f=>({...f,framework:v}))} options={Object.keys(FRAMEWORKS)}   placeholder={t.frameworkPlaceholder}/>
          <FSelect label={t.policyType}          value={form.policyType} onChange={v=>setForm(f=>({...f,policyType:v}))} options={t.policyTypes}            placeholder={t.policyTypePlaceholder}/>
        </div>
        {form.framework&&<div style={{marginTop:16,padding:"12px 14px",background:fw.color+"0a",border:`1px solid ${fw.color}20`,borderRadius:10}}>
          <div style={{fontSize:10,fontWeight:800,color:fw.color,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>{t.controlsToAssess}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{fw.controls.map(c=><span key={c} style={{padding:"3px 10px",background:fw.color+"15",color:fw.color,borderRadius:4,fontSize:11,fontWeight:600}}>{c}</span>)}</div>
        </div>}
        {error&&<div style={{marginTop:14,padding:"10px 13px",background:"#7f1d1d20",border:"1px solid #ef444440",borderRadius:8,color:"#fca5a5",fontSize:12}}>{error}</div>}
      </div>
      {step==="loading"
        ?<div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:14,padding:"48px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
           <div style={{position:"relative",width:52,height:52}}>
             <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid #1e293b"}}/>
             <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"3px solid transparent",borderTopColor:"#0ea5e9",animation:"sp 0.9s linear infinite"}}/>
             <div style={{position:"absolute",inset:8,borderRadius:"50%",border:"2px solid transparent",borderTopColor:"#8b5cf6",animation:"sp 0.7s linear infinite reverse"}}/>
           </div>
           <div style={{textAlign:"center"}}><div style={{fontWeight:700,color:"#e2e8f0"}}>{t.generating}</div><div style={{fontSize:12,color:"#475569",marginTop:4}}>{t.analysingControls}</div></div>
         </div>
        :<button onClick={run} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#0ea5e9,#0284c7)",border:"none",borderRadius:11,color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px #0ea5e930"}}>
           ▶ {t.generateBtn}
         </button>}
    </div>
  );

  return (
    <div style={{maxWidth:800,animation:"fadeUp 0.3s ease"}} dir={isRTL?"rtl":"ltr"}>
      <style>{PRINT_STYLE}</style>
      <div className="no-print" style={{display:"flex",gap:10,marginBottom:22,alignItems:"center"}}>
        <button onClick={()=>{setStep("form");setReport(null);}} style={{padding:"8px 14px",background:"#0f172a",border:"1px solid #1e293b",borderRadius:9,fontSize:12,fontWeight:700,color:"#94a3b8",cursor:"pointer"}}>{t.newPolicy}</button>
        <div style={{flex:1}}/>
        <button onClick={()=>window.print()} style={{padding:"8px 18px",background:"linear-gradient(135deg,#0f172a,#1e1b4b)",border:"1px solid #334155",borderRadius:9,fontSize:12,fontWeight:700,color:"#e2e8f0",cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>{t.downloadPDF}</button>
      </div>
      <div id="print-zone">
        <div style={{background:"linear-gradient(135deg,#0f172a,#1e1b4b)",borderRadius:14,padding:"28px 26px",marginBottom:14,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-50,right:-50,width:200,height:200,background:fw.color+"0e",borderRadius:"50%"}}/>
          <div style={{position:"relative"}}>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
              {[form.framework,"v"+report.version,report.classification].map(t2=><span key={t2} style={{padding:"3px 10px",background:"#ffffff10",color:"#94a3b8",borderRadius:5,fontSize:11,fontWeight:700}}>{t2}</span>)}
            </div>
            <div style={{fontSize:20,fontWeight:800,color:"#fff",marginBottom:5,lineHeight:1.2}}>{report.policyTitle}</div>
            <div style={{fontSize:12,color:"#475569",marginBottom:14,fontWeight:600}}>{form.orgName} · {form.industry} · {form.size}</div>
            <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.7,maxWidth:580,borderLeft:isRTL?"none":"3px solid "+fw.color,borderRight:isRTL?"3px solid "+fw.color:"none",paddingLeft:isRTL?0:14,paddingRight:isRTL?14:0}}>{report.executiveSummary}</div>
            <div style={{display:"flex",gap:24,marginTop:18}}>
              {[[t.effective,report.effectiveDate],[t.review,report.reviewDate]].map(([l,v])=>(
                <div key={l}><div style={{color:"#334155",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>{l}</div><div style={{color:"#e2e8f0",fontSize:12,fontWeight:700,marginTop:3}}>{v}</div></div>
              ))}
            </div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
          <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:18,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${sc},${sc}66)`}}/>
            <div style={{fontSize:10,fontWeight:700,color:"#475569",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>{t.complianceScore}</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:3,marginBottom:10}}><span style={{fontSize:40,fontWeight:900,color:sc,lineHeight:1}}>{report.complianceScore}</span><span style={{fontSize:14,color:"#475569",marginBottom:4}}>/100</span></div>
            <div style={{height:4,background:"#1e293b",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:report.complianceScore+"%",background:sc,borderRadius:2}}/></div>
          </div>
          <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:18,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${MAT_COLOR[report.maturityLevel]||"#3b82f6"},transparent)`}}/>
            <div style={{fontSize:10,fontWeight:700,color:"#475569",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>{t.maturityLevel}</div>
            <div style={{fontSize:22,fontWeight:800,color:MAT_COLOR[report.maturityLevel]||"#3b82f6",marginBottom:8}}>{report.maturityLevel}</div>
            <div style={{display:"flex",gap:3}}>{matLevels.map((l,i)=><div key={l} style={{flex:1,height:3,borderRadius:2,background:i<=matLevels.indexOf(report.maturityLevel)?(MAT_COLOR[report.maturityLevel]||"#3b82f6"):"#1e293b"}}/>)}</div>
            <div style={{fontSize:10,color:"#334155",marginTop:5}}>{t.maturityOf}</div>
          </div>
          <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:18,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#ef4444,#f59e0b)"}}/>
            <div style={{fontSize:10,fontWeight:700,color:"#475569",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.08em"}}>{t.riskFindings}</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4}}>
              {["Critical","High","Medium","Low"].map(sv=>{const n=(report.riskFindings||[]).filter(x=>x.severity===sv).length;return n>0?<div key={sv} style={{textAlign:"center",padding:"5px 10px",background:SEV_COLOR[sv]+"12",borderRadius:7,border:`1px solid ${SEV_COLOR[sv]}20`}}><div style={{fontSize:20,fontWeight:800,color:SEV_COLOR[sv]}}>{n}</div><div style={{fontSize:9,color:"#475569",fontWeight:600}}>{sv}</div></div>:null;})}
            </div>
          </div>
        </div>

        <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:20,marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:"#475569",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
            <span style={{width:3,height:13,background:fw.color,borderRadius:2,display:"inline-block"}}/> {t.frameworkAlignment} — {form.framework}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {(report.frameworkAlignment||[]).map((item,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:11,padding:"10px 12px",background:"#0d1424",borderRadius:9,border:"1px solid #1a2744"}}>
                <span style={{padding:"2px 8px",background:fw.color+"15",color:fw.color,borderRadius:4,fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0,fontFamily:"monospace"}}>{item.controlId}</span>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:"#e2e8f0",marginBottom:2}}>{item.controlName}</div><div style={{fontSize:11,color:"#475569"}}>{item.notes}</div></div>
                <div style={{flexShrink:0}}><Badge status={item.status}/></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:22,marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:"#475569",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:18,display:"flex",alignItems:"center",gap:7}}>
            <span style={{width:3,height:13,background:"#8b5cf6",borderRadius:2,display:"inline-block"}}/> {t.generatedPolicy}
          </div>
          {(report.policySections||[]).map((sec,i)=>(
            <div key={i} style={{borderTop:i>0?"1px solid #1a2744":"none",paddingTop:i>0?16:0,marginTop:i>0?16:0}}>
              <div style={{fontSize:13,fontWeight:800,color:"#f1f5f9",marginBottom:7,display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:20,height:20,borderRadius:5,background:"#1e293b",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#64748b",flexShrink:0}}>{i+1}</span>
                {sec.title.replace(/^\d+\.\s*/,"")}
              </div>
              <div style={{fontSize:12,color:"#64748b",lineHeight:1.75,paddingLeft:isRTL?0:28,paddingRight:isRTL?28:0}}>{sec.content}</div>
            </div>
          ))}
        </div>

        <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:20,marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:"#475569",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
            <span style={{width:3,height:13,background:"#ef4444",borderRadius:2,display:"inline-block"}}/> {t.auditFindings}
          </div>
          {(report.riskFindings||[]).map((f,i)=>(
            <div key={i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${SEV_COLOR[f.severity]}25`,background:SEV_COLOR[f.severity]+"08",marginBottom:i<(report.riskFindings.length-1)?10:0,position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",[isRTL?"right":"left"]:0,top:0,bottom:0,width:3,background:SEV_COLOR[f.severity]}}/>
              <div style={{[isRTL?"paddingRight":"paddingLeft"]:10}}>
                <div style={{display:"flex",gap:8,marginBottom:5,alignItems:"center"}}>
                  <span style={{fontFamily:"monospace",fontSize:11,color:"#475569",fontWeight:700}}>{f.id}</span>
                  <span style={{padding:"2px 8px",background:SEV_COLOR[f.severity]+"20",color:SEV_COLOR[f.severity],borderRadius:4,fontSize:11,fontWeight:700}}>{f.severity}</span>
                </div>
                <div style={{fontSize:12,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>{f.finding}</div>
                <div style={{fontSize:11,color:"#64748b",display:"flex",gap:5}}><span style={{color:SEV_COLOR[f.severity],fontWeight:700,flexShrink:0}}>→</span>{f.recommendation}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{background:"linear-gradient(135deg,#0f172a,#1e1b4b)",border:"1px solid #334155",borderRadius:12,padding:22}}>
          <div style={{fontSize:10,fontWeight:700,color:"#334155",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:16}}>{t.nextSteps}</div>
          {(report.nextSteps||[]).map((step,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:i<(report.nextSteps.length-1)?12:0}}>
              <span style={{width:24,height:24,borderRadius:"50%",background:fw.color+"20",color:fw.color,fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1px solid ${fw.color}35`}}>{i+1}</span>
              <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.65,paddingTop:3}}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
