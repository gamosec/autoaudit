import { useState, createContext, useContext } from "react";
import { T } from "./i18n.js";
import PolicyModule     from "./modules/PolicyModule.jsx";
import ConsultantModule from "./modules/ConsultantModule.jsx";
import GapModule        from "./modules/GapModule.jsx";

export const LangContext = createContext({ lang:"en", t: T.en, setLang:()=>{} });
export function useLang() { return useContext(LangContext); }

export default function App() {
  const [active, setActive] = useState(null);
  const [lang, setLang]     = useState("en");
  const t = T[lang];
  const isRTL = lang === "ar";

  const MODULES = [
    { id:"policy",     icon:"📄", label:t.policyGenerator,  color:"#0ea5e9", gradient:"linear-gradient(135deg,#0ea5e9,#0284c7)", desc:t.policyDesc,     stats:t.policyStats },
    { id:"consultant", icon:"🤖", label:t.aiConsultant,     color:"#8b5cf6", gradient:"linear-gradient(135deg,#8b5cf6,#7c3aed)", desc:t.consultantDesc, stats:t.consultantStats },
    { id:"gap",        icon:"🔍", label:t.gapAnalysis,      color:"#10b981", gradient:"linear-gradient(135deg,#10b981,#059669)", desc:t.gapDesc,        stats:t.gapStats },
  ];
  const mod = MODULES.find(m => m.id === active);

  return (
    <LangContext.Provider value={{ lang, t, setLang }}>
      <div dir={t.dir} style={{display:"flex",minHeight:"100vh",background:"#080e1c",fontFamily:isRTL?"'Segoe UI',Tahoma,Arial,sans-serif":"'Segoe UI',system-ui,sans-serif",color:"#e2e8f0"}}>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0d1424}::-webkit-scrollbar-thumb{background:#334155;border-radius:2px}
          @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
          @keyframes sp{to{transform:rotate(360deg)}}
          @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
          .nav-btn:hover{background:#1e293b!important}
          .mod-card{transition:all 0.2s!important}
          .mod-card:hover{transform:translateY(-3px)!important;border-color:var(--c)!important;box-shadow:0 12px 40px rgba(0,0,0,0.5)!important}
          input:focus,select:focus,textarea:focus{outline:none!important;border-color:#0ea5e9!important;box-shadow:0 0 0 3px #0ea5e915!important}
          button:active{transform:scale(0.98)}
          select option{background:#1e293b;color:#e2e8f0}
        `}</style>

        {/* Sidebar */}
        <div style={{width:220,background:"#0d1424",borderRight:isRTL?"none":"1px solid #1a2744",borderLeft:isRTL?"1px solid #1a2744":"none",display:"flex",flexDirection:"column",position:"fixed",top:0,[isRTL?"right":"left"]:0,bottom:0,zIndex:50}}>
          <div style={{padding:"18px 16px 14px",borderBottom:"1px solid #1a2744"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#0ea5e9,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 18px #0ea5e940",fontSize:17}}>🛡️</div>
              <div>
                <div style={{fontWeight:900,fontSize:15,color:"#f1f5f9",letterSpacing:isRTL?0:"-0.02em"}}>AutoAudit</div>
                <div style={{fontSize:9,color:"#334155",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>{t.platform}</div>
              </div>
            </div>
          </div>

          <nav style={{padding:"14px 10px",flex:1,overflowY:"auto"}}>
            <div style={{fontSize:9,fontWeight:700,color:"#334155",letterSpacing:"0.12em",textTransform:"uppercase",padding:"0 8px 8px"}}>{t.modules}</div>
            {MODULES.map(m=>(
              <button key={m.id} className="nav-btn" onClick={()=>setActive(m.id)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:9,border:"none",background:active===m.id?"#1e293b":"transparent",cursor:"pointer",fontFamily:"inherit",marginBottom:2,textAlign:isRTL?"right":"left",transition:"all 0.15s",borderRight:isRTL&&active===m.id?`2px solid ${m.color}`:"none",borderLeft:!isRTL&&active===m.id?`2px solid ${m.color}`:"none"}}>
                <span style={{fontSize:17,width:24,textAlign:"center",flexShrink:0}}>{m.icon}</span>
                <div style={{fontSize:12,fontWeight:700,color:active===m.id?m.color:"#94a3b8"}}>{m.label}</div>
              </button>
            ))}
            <div style={{fontSize:9,fontWeight:700,color:"#334155",letterSpacing:"0.12em",textTransform:"uppercase",padding:"16px 8px 8px"}}>{t.modules === "الوحدات" ? "عام" : "General"}</div>
            <button className="nav-btn" onClick={()=>setActive(null)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:9,border:"none",background:!active?"#1e293b":"transparent",cursor:"pointer",fontFamily:"inherit",textAlign:isRTL?"right":"left",transition:"all 0.15s",borderRight:isRTL&&!active?"2px solid #64748b":"none",borderLeft:!isRTL&&!active?"2px solid #64748b":"none"}}>
              <span style={{fontSize:17,width:24,textAlign:"center",flexShrink:0}}>🏠</span>
              <div style={{fontSize:12,fontWeight:700,color:!active?"#94a3b8":"#475569"}}>{t.dashboard}</div>
            </button>
          </nav>

          <div style={{padding:"12px 14px",borderTop:"1px solid #1a2744"}}>
            {/* Language Toggle */}
            <button onClick={()=>setLang(l=>l==="en"?"ar":"en")}
              style={{width:"100%",padding:"7px",background:"#1e293b",border:"1px solid #334155",borderRadius:8,color:"#94a3b8",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              🌐 {t.langToggle}
            </button>
            <div style={{fontSize:9,fontWeight:700,color:"#334155",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>{t.frameworks}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {[["ISO","#0ea5e9"],["NIST","#8b5cf6"],["PCI","#f59e0b"],["GDPR","#10b981"],["SOC2","#ef4444"]].map(([b,c])=>(
                <span key={b} style={{padding:"2px 7px",borderRadius:4,background:c+"15",color:c,fontSize:9,fontWeight:800,border:`1px solid ${c}28`}}>{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{[isRTL?"marginRight":"marginLeft"]:220,flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{height:50,background:"#0d1424",borderBottom:"1px solid #1a2744",display:"flex",alignItems:"center",padding:"0 24px",gap:12,position:"sticky",top:0,zIndex:40}}>
            <span style={{fontSize:12,color:"#334155"}}>AutoAudit</span>
            {mod&&<><span style={{color:"#1a2744",fontSize:12}}>›</span><span style={{fontSize:12,color:mod.color,fontWeight:700}}>{mod.label}</span></>}
            <div style={{flex:1}}/>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",animation:"pulse 2s infinite"}}/>
              <span style={{fontSize:11,color:"#334155"}}>{t.aiActive}</span>
            </div>
          </div>

          <div style={{flex:1,padding:"28px",overflowY:"auto",animation:"fadeUp 0.3s ease"}}>
            {!active     && <Dashboard onSelect={setActive} modules={MODULES} t={t} isRTL={isRTL}/>}
            {active==="policy"     && <PolicyModule t={t} isRTL={isRTL} lang={lang}/>}
            {active==="consultant" && <ConsultantModule t={t} isRTL={isRTL} lang={lang}/>}
            {active==="gap"        && <GapModule t={t} isRTL={isRTL} lang={lang}/>}
          </div>
        </div>
      </div>
    </LangContext.Provider>
  );
}

function Dashboard({ onSelect, modules, t, isRTL }) {
  return (
    <div>
      <div style={{marginBottom:32,animation:"fadeUp 0.4s ease"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#0ea5e9",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>{t.heroTag}</div>
        <h1 style={{fontSize:32,fontWeight:900,color:"#f1f5f9",letterSpacing:isRTL?0:"-0.025em",lineHeight:1.2,marginBottom:12}}>
          {t.heroTitle}<br/>
          <span style={{background:"linear-gradient(90deg,#0ea5e9,#8b5cf6,#10b981)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{t.heroGradient}</span>
        </h1>
        <p style={{fontSize:14,color:"#475569",maxWidth:500,lineHeight:1.75}}>{t.heroDesc}</p>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
        {modules.map((m,i)=>(
          <div key={m.id} className="mod-card" style={{"--c":m.color,background:"#0f172a",border:"1px solid #1a2744",borderRadius:16,padding:24,cursor:"pointer",position:"relative",overflow:"hidden",animation:`fadeUp 0.4s ease ${i*0.08}s both`}} onClick={()=>onSelect(m.id)}>
            <div style={{position:"absolute",top:-40,right:-40,width:120,height:120,background:m.color+"0a",borderRadius:"50%"}}/>
            <div style={{position:"relative"}}>
              <div style={{width:50,height:50,borderRadius:13,background:m.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:18,boxShadow:`0 6px 18px ${m.color}35`}}>{m.icon}</div>
              <div style={{fontSize:16,fontWeight:800,color:"#f1f5f9",marginBottom:6}}>{m.label}</div>
              <div style={{fontSize:12,color:"#475569",marginBottom:16,lineHeight:1.6}}>{m.desc}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:16}}>
                {m.stats.map(s=><span key={s} style={{padding:"3px 8px",background:m.color+"12",color:m.color,borderRadius:4,fontSize:10,fontWeight:700}}>{s}</span>)}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5,color:m.color,fontSize:12,fontWeight:700}}>{t.openModule} {isRTL?"←":"→"}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{background:"#0f172a",border:"1px solid #1a2744",borderRadius:14,padding:"18px 24px",display:"flex",gap:32,flexWrap:"wrap",animation:"fadeUp 0.5s ease 0.25s both"}}>
        {[["5",t.statFrameworks],["93",t.statControls],["6",t.statPolicies],["100%",t.statFree]].map(([n,l])=>(
          <div key={l}><div style={{fontSize:26,fontWeight:900,color:"#f1f5f9"}}>{n}</div><div style={{fontSize:11,color:"#334155",marginTop:2}}>{l}</div></div>
        ))}
      </div>
    </div>
  );
}
