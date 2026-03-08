import { useState, useRef, useEffect } from "react";

const SYS = {
  en:`You are AutoAudit GRC Consultant — a senior cybersecurity and compliance expert with 15+ years experience in ISO 27001, NIST CSF, PCI-DSS, GDPR, and SOC 2. Give clear, practical, expert-level GRC advice like a trusted advisor. Be specific and actionable. Keep responses concise (3-5 sentences) unless asked for detail. Never invent standards or control numbers. User question:`,
  ar:`أنت مستشار AutoAudit GRC — خبير أمن سيبراني وامتثال بخبرة تزيد عن 15 عاماً في ISO 27001 وNIST CSF وPCI-DSS وGDPR وSOC 2. قدّم مشورة GRC واضحة وعملية كمستشار موثوق. كن محدداً وقابلاً للتنفيذ. اجعل الردود موجزة (3-5 جمل) ما لم يُطلب التفصيل. لا تخترع معايير أو أرقام ضوابط. أجب دائماً باللغة العربية. سؤال المستخدم:`
};

export default function ConsultantModule({ t, isRTL, lang }) {
  const [messages, setMessages] = useState([{ role:"assistant", text:t.consultantGreeting }]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [org, setOrg]         = useState("");
  const [industry, setIndustry] = useState("");
  const bottomRef = useRef(null);

  useEffect(()=>{ setMessages([{ role:"assistant", text:t.consultantGreeting }]); }, [lang]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  async function send(text) {
    const q = (text||input).trim();
    if (!q||loading) return;
    setInput("");
    setMessages(m=>[...m,{role:"user",text:q}]);
    setLoading(true);
    const ctx = org?`\n${lang==="ar"?"السياق":"Context"}: ${org}${industry?" ("+industry+")":""}`:""
    const prompt = SYS[lang] + ctx + `\n\n"${q}"`;
    try {
      const res  = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt}]})});
      const data = await res.json();
      const reply= (data.content||[]).map(b=>b.text||"").join("")||"...";
      setMessages(m=>[...m,{role:"assistant",text:reply}]);
    } catch { setMessages(m=>[...m,{role:"assistant",text:lang==="ar"?"خطأ في الاتصال.":"Connection error."}]); }
    setLoading(false);
  }

  function fmt(text){
    return text.split("\n").map((line,i,arr)=>{
      const parts=line.split(/(\*\*[^*]+\*\*)/g);
      return <span key={i}>{parts.map((p,j)=>p.startsWith("**")&&p.endsWith("**")?<strong key={j}>{p.slice(2,-2)}</strong>:p)}{i<arr.length-1&&<br/>}</span>;
    });
  }

  return (
    <div style={{maxWidth:900,animation:"fadeUp 0.3s ease"}} dir={isRTL?"rtl":"ltr"}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:22,fontWeight:900,color:"#f1f5f9",marginBottom:6}}>{t.consultantTitle}</h2>
        <p style={{color:"#475569",fontSize:13,lineHeight:1.7}}>{t.consultantSubtitle}</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:16,alignItems:"flex-start"}}>
        {/* Chat */}
        <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:16,overflow:"hidden"}}>
          <div style={{background:"linear-gradient(135deg,#0f172a,#1e1b4b)",padding:"14px 18px",display:"flex",alignItems:"center",gap:10,borderBottom:"1px solid #1a2744"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>🤖</div>
            <div style={{flex:1}}>
              <div style={{color:"#f1f5f9",fontWeight:700,fontSize:14}}>{t.aiConsultant}</div>
              <div style={{color:"#475569",fontSize:11}}>{t.consultantFrameworks}</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{color:"#334155",fontSize:11}}>{t.online}</span>
            </div>
          </div>

          <div style={{height:460,overflowY:"auto",padding:16,background:"#080e1c",display:"flex",flexDirection:"column",gap:10}}>
            {messages.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",alignItems:"flex-end",gap:8}}>
                {m.role==="assistant"&&<div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🤖</div>}
                <div style={{maxWidth:"78%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"linear-gradient(135deg,#8b5cf6,#7c3aed)":"#0f172a",color:"#e2e8f0",fontSize:13,lineHeight:1.7,border:m.role==="assistant"?"1px solid #1a2744":"none",whiteSpace:"pre-wrap",textAlign:isRTL?"right":"left",direction:"auto"}}>
                  {fmt(m.text)}
                </div>
              </div>
            ))}
            {loading&&(
              <div style={{display:"flex",alignItems:"flex-end",gap:8}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>🤖</div>
                <div style={{padding:"11px 14px",background:"#0f172a",borderRadius:16,border:"1px solid #1a2744"}}>
                  <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:"#475569",animation:`bounce 1s ${i*0.2}s infinite`}}/>)}</div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div style={{padding:"12px 16px",background:"#0f172a",borderTop:"1px solid #1a2744",display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
              placeholder={t.askPlaceholder} dir="auto"
              style={{flex:1,padding:"10px 13px",border:"1.5px solid #1e293b",borderRadius:9,fontSize:13,background:"#080e1c",color:"#e2e8f0",fontFamily:"inherit"}}/>
            <button onClick={()=>send()} disabled={loading||!input.trim()}
              style={{padding:"10px 18px",background:loading||!input.trim()?"#1e293b":"linear-gradient(135deg,#8b5cf6,#7c3aed)",border:"none",borderRadius:9,color:loading||!input.trim()?"#475569":"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
              {t.send}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:16}}>
            <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>{t.yourContext} <span style={{color:"#1e293b",textTransform:"none"}}>{t.optional}</span></div>
            {[[t.organization,org,setOrg,t.orgPlaceholder],[t.industryLabel,industry,setIndustry,t.industryPlaceholder2]].map(([label,val,setter,ph])=>(
              <div key={label} style={{marginBottom:10}}>
                <label style={{fontSize:11,color:"#475569",fontWeight:600,display:"block",marginBottom:5}}>{label}</label>
                <input value={val} onChange={e=>setter(e.target.value)} placeholder={ph} dir="auto"
                  style={{width:"100%",padding:"8px 10px",border:"1px solid #1e293b",borderRadius:7,fontSize:12,background:"#080e1c",color:"#e2e8f0",fontFamily:"inherit"}}/>
              </div>
            ))}
            <div style={{fontSize:10,color:"#334155",lineHeight:1.5}}>{t.contextHint}</div>
          </div>

          <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:12,padding:16}}>
            <div style={{fontSize:10,fontWeight:700,color:"#334155",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:12}}>{t.quickQuestions}</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {t.quickQ.map(q=>(
                <button key={q} onClick={()=>send(q)}
                  style={{padding:"7px 10px",background:"transparent",border:"1px solid #1a2744",borderRadius:7,fontSize:11,color:"#64748b",cursor:"pointer",fontFamily:"inherit",textAlign:isRTL?"right":"left",lineHeight:1.4,direction:"auto"}}
                  onMouseOver={e=>e.currentTarget.style.color="#8b5cf6"}
                  onMouseOut={e=>e.currentTarget.style.color="#64748b"}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
