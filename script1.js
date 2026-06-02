import { useState, useEffect, useCallback, memo } from "react";
import {
  CSS, EMOTIONS, MEMBERS, DAYS, DLONG, MONTHS, ROOMS,
  SDOMS, ACATS, RCATS, WCATS, AICATS, AIICO, NAV, IS,
} from "./constants.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const isToday = (d) => fmt(d) === fmt(new Date());

// ─── SHARED UI ATOMS ──────────────────────────────────────────────────────────
// Defined outside App so they never get recreated
const Chksq = ({ on, fn }) => (
  <div className={`chksq${on?" on":""}`} onClick={fn}>{on?"✓":""}</div>
);

// ─── OVERLAY WRAPPER ──────────────────────────────────────────────────────────
const OV = ({ id, modal, cm, title, children }) => (
  <div className={`ov${modal===id?" open":""}`}
    onClick={e => { if(e.target.className==="ov open") cm(); }}>
    <div className="sheet">
      <div className="handle"/>
      <div className="mt2">{title}</div>
      {children}
    </div>
  </div>
);

// ─── CLOCK (isolated so only it re-renders every second) ──────────────────────
const Clock = memo(function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <div className="lbl">{DAYS[now.getDay()]} {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()}</div>
      <div className="h1" style={{marginTop:2}}>
        {String(now.getHours()).padStart(2,"0")}:{String(now.getMinutes()).padStart(2,"0")}
        <span style={{fontSize:".95rem",color:"var(--ts)",marginLeft:6,fontFamily:"Manrope",fontWeight:400}}>
          {String(now.getSeconds()).padStart(2,"0")}
        </span>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN COMPONENTS — all defined at module level (outside App)
// This is the KEY fix: React won't remount them on every parent render
// ─────────────────────────────────────────────────────────────────────────────

function Dashboard({ S, mut, om, go, calMon, setCalMon }) {
  const now = new Date();
  const todayMeal = S.menu[now.getDay().toString()];

  const calDays = () => {
    const y = calMon.getFullYear(), m = calMon.getMonth();
    const firstDay = new Date(y,m,1).getDay();
    const offset = firstDay===0 ? 6 : firstDay-1;
    const last = new Date(y,m+1,0).getDate();
    const days = [];
    for(let i=0;i<offset;i++){const d=new Date(y,m,1-offset+i);days.push({d,oth:true});}
    for(let i=1;i<=last;i++) days.push({d:new Date(y,m,i),oth:false});
    return days;
  };
  const evOn = (d) => S.events.filter(e => e.date===fmt(d));

  return (
    <div className="scr pt">
      {/* Header with clock */}
      <div className="row sb mb fu">
        <Clock />
        <button className="btn-g" onClick={()=>om("add-event")}>+ Événement</button>
      </div>

      {/* Météo */}
      <div className="g fu fu1" style={{padding:"14px 18px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"3rem",fontWeight:300,color:"var(--td)",lineHeight:1}}>{S.wx.tmp}°</div>
          <div style={{fontSize:".76rem",color:"var(--tm)",marginTop:2}}>{S.wx.desc}</div>
          <div style={{display:"flex",gap:10,marginTop:5,flexWrap:"wrap"}}>
            <span style={{fontSize:".68rem",color:"var(--ts)",fontWeight:500}}>💧 {S.wx.hum}%</span>
            <span style={{fontSize:".68rem",color:"var(--ts)",fontWeight:500}}>🌬 {S.wx.wind} km/h</span>
            <span style={{fontSize:".68rem",color:"var(--ts)",fontWeight:500}}>🌡 ressenti {S.wx.feel}°</span>
          </div>
        </div>
        <div style={{fontSize:"3.5rem"}}>{S.wx.ico}</div>
      </div>

      {/* Menu du jour */}
      {todayMeal && (
        <div className="fu fu1" style={{marginBottom:10}}>
          <div className="sec"><span>🍽️</span> Dîner ce soir</div>
          <div className="gsm" style={{padding:"11px 13px",display:"flex",alignItems:"center",gap:11}}>
            <span style={{fontSize:"1.3rem"}}>🥘</span>
            <div style={{flex:1}}>
              <div style={{fontSize:".85rem",fontWeight:700,color:"var(--td)"}}>{todayMeal}</div>
              <div style={{fontSize:".68rem",color:"var(--ts)"}}>Menu planifié</div>
            </div>
            <button className="btn-sm" onClick={()=>go("cuisine","menus")}>Voir →</button>
          </div>
        </div>
      )}

      {/* Todos */}
      <div className="fu fu2">
        <div className="row sb">
          <div className="sec"><span>✅</span> Todo du jour</div>
          <button className="btn-sm" onClick={()=>om("add-todo")}>+</button>
        </div>
        <div className="g card">
          {S.todos.length===0 && (
            <div style={{textAlign:"center",padding:"10px 0",fontSize:".8rem",color:"var(--ts)"}}>Tout est fait ✓</div>
          )}
          {[...S.todos.filter(t=>!t.d),...S.todos.filter(t=>t.d)].map(todo => (
            <div key={todo.id} className={`tdi${todo.d?" done":""}`}>
              <Chksq on={todo.d} fn={()=>mut(s=>{const t=s.todos.find(x=>x.id===todo.id);if(t)t.d=!t.d;})}/>
              <span className="tt">{todo.t}</span>
              {todo.p==="high" && !todo.d && <div className="udot"/>}
              <div onClick={()=>mut(s=>{s.todos=s.todos.filter(x=>x.id!==todo.id);})}
                style={{color:"var(--tl)",cursor:"pointer",padding:"0 4px",fontSize:".85rem"}}>✕</div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendrier */}
      <div className="fu fu3">
        <div className="row sb">
          <div className="sec"><span>📅</span> {MONTHS[calMon.getMonth()]} {calMon.getFullYear()}</div>
          <div className="row gap">
            <button className="btn-sm" onClick={()=>setCalMon(m=>new Date(m.getFullYear(),m.getMonth()-1))}>‹</button>
            <button className="btn-sm" onClick={()=>setCalMon(m=>new Date(m.getFullYear(),m.getMonth()+1))}>›</button>
          </div>
        </div>
        <div className="g" style={{padding:"11px 9px"}}>
          <div className="cg" style={{marginBottom:4}}>
            {["L","M","M","J","V","S","D"].map((d,i)=><div key={i} className="chd">{d}</div>)}
          </div>
          <div className="cg">
            {calDays().map(({d,oth},i)=>{
              const evs = evOn(d);
              return (
                <div key={i} className={`cd${oth?" oth":""}${isToday(d)?" tod":""}`}
                  onClick={()=>om("add-event",{date:fmt(d)})}>
                  <div className="cdn">{d.getDate()}</div>
                  {evs.slice(0,2).map((e,j)=><div key={j} className="cdot" style={{background:e.c||"var(--vio)"}}/>)}
                </div>
              );
            })}
          </div>
          {/* Events list for current month */}
          {S.events.filter(e=>e.date.startsWith(
            `${calMon.getFullYear()}-${String(calMon.getMonth()+1).padStart(2,"0")}`
          )).length > 0 && (
            <div style={{marginTop:9,paddingTop:9,borderTop:"1px solid rgba(180,160,220,.1)"}}>
              {S.events.filter(e=>e.date.startsWith(
                `${calMon.getFullYear()}-${String(calMon.getMonth()+1).padStart(2,"0")}`
              )).map(e=>(
                <div key={e.id} className="row gap" style={{padding:"3px 0",fontSize:".75rem",fontWeight:600,color:"var(--tm)"}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:e.c,flexShrink:0,marginTop:4}}/>
                  <span style={{color:"var(--ts)",flexShrink:0}}>{e.date.slice(8)}.</span>
                  <span>{e.t}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Menu semaine */}
      <div className="fu fu4">
        <div className="row sb">
          <div className="sec"><span>🍽️</span> Menu semaine</div>
          <button className="btn-sm" onClick={()=>go("cuisine","menus")}>Modifier →</button>
        </div>
        <div className="g" style={{padding:"11px 9px"}}>
          <div className="mw">
            {["L","M","M","J","V","S","D"].map((d,i)=>(
              <div key={i} className="md">
                <div className="mdhd"><div className="mdn">{d}</div></div>
                <div className={`mdm${S.menu[i.toString()]?" fi2":""}`}
                  onClick={()=>om("set-menu",{day:i,dn:DLONG[i]})}>
                  {S.menu[i.toString()] || <span style={{color:"var(--tl)",fontSize:"1rem"}}>+</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activités enfants */}
      <div className="fu fu5">
        <div className="row sb">
          <div className="sec"><span>🌟</span> Activités enfants</div>
          <button className="btn-sm" onClick={()=>go("enfants","activites")}>Voir →</button>
        </div>
        <div className="g card">
          {S.acts.filter(a=>a.st!=="réalisé").slice(0,3).map(a=>(
            <div key={a.id} className="ri">
              <div className="ri-i">🎨</div>
              <div style={{flex:1}}>
                <div className="ri-m">{a.n}</div>
                <div className="ri-s">{a.dur} · {a.cat}</div>
              </div>
              <button className="btn-sm" onClick={()=>mut(s=>{const ac=s.acts.find(x=>x.id===a.id);if(ac)ac.st="réalisé";})}>✓</button>
            </div>
          ))}
          {S.acts.filter(a=>a.st!=="réalisé").length===0 && (
            <div style={{textAlign:"center",padding:"8px 0",fontSize:".78rem",color:"var(--ts)"}}>Toutes les activités réalisées 🎉</div>
          )}
        </div>
      </div>

      {/* Tracker émotionnel */}
      <div className="fu fu5">
        <div className="sec"><span>💜</span> Comment va la famille ?</div>
        <div className="eg">
          {MEMBERS.map(m=>(
            <div key={m.k} className="gsm ec" onClick={()=>om("emotion",{tgt:m.k})}>
              <div className="eav">{m.av}</div>
              <div>
                <div className="en">{m.n}</div>
                <div className="ee">{S.emo[m.k]?.e||"✨"}</div>
                <div className="el">{S.emo[m.k]?.l||"Appuyer"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CUISINE ────────────────────────────────────────────────────────────────────
function Aliments({ S, mut, om, toast2 }) {
  const groups = {};
  S.aliments.forEach(a=>{if(!groups[a.cat])groups[a.cat]=[];groups[a.cat].push(a);});
  return (
    <div className="scr pt">
      <div className="row sb mb fu">
        <div><div className="h1">Aliments</div><div className="lbl" style={{marginTop:2}}>Base de données</div></div>
        <button className="btn-g" onClick={()=>om("add-aliment")}>+ Produit</button>
      </div>
      {Object.entries(groups).map(([cat,items])=>(
        <div key={cat} style={{marginBottom:13}}>
          <div className="sec"><span>{AIICO[cat]||"📦"}</span> {cat}</div>
          {items.map(a=>(
            <div key={a.id} className="gsm" style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",marginBottom:6}}>
              <div style={{flex:1}}>
                <div style={{fontSize:".84rem",fontWeight:600,color:"var(--td)"}}>{a.n}</div>
                <div style={{fontSize:".68rem",color:"var(--ts)"}}>{a.qty}</div>
              </div>
              <button
                className={`btn-sm${a.inL?" on":""}`}
                style={a.inL?{background:"rgba(155,139,191,.32)"}:{}}
                onClick={()=>{
                  mut(s=>{
                    const al=s.aliments.find(x=>x.id===a.id);
                    if(al){
                      al.inL=!al.inL;
                      if(al.inL && !s.shopping.find(si=>si.n.toLowerCase()===al.n.toLowerCase()))
                        s.shopping.push({id:s.nid++,n:al.n,qty:al.qty,cat:al.cat,urg:false,d:false});
                    }
                  });
                  toast2(a.inL?"Retiré des courses":"→ Courses 🛒");
                }}>
                {a.inL?"✓ En liste":"+ Courses"}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Courses({ S, mut, om, go, toast2 }) {
  const urg = S.shopping.filter(i=>i.urg && !i.d);
  const grp = {};
  S.shopping.forEach(i=>{if(!grp[i.cat])grp[i.cat]=[];grp[i.cat].push(i);});
  return (
    <div className="scr pt">
      <div className="row sb mb fu">
        <div><div className="h1">Courses</div><div className="lbl" style={{marginTop:2}}>{S.shopping.filter(i=>!i.d).length} articles</div></div>
        <button className="btn-g" onClick={()=>om("add-shop")}>+ Article</button>
      </div>
      {urg.length>0 && (
        <div style={{marginBottom:13}}>
          <div className="sec">⚠️ Urgent</div>
          {urg.map(item=>(
            <div key={item.id} className={`gsm si${item.d?" done":""}`}>
              <div className="udot"/>
              <Chksq on={item.d} fn={()=>mut(s=>{const i=s.shopping.find(x=>x.id===item.id);if(i)i.d=!i.d;})}/>
              <span className="sn">{item.n}</span>
              <span className="sq">{item.qty}</span>
              <div onClick={()=>mut(s=>{s.shopping=s.shopping.filter(x=>x.id!==item.id);})}
                style={{color:"var(--tl)",cursor:"pointer",padding:"0 4px"}}>✕</div>
            </div>
          ))}
        </div>
      )}
      {Object.entries(grp).map(([cat,items])=>{
        const ni=items.filter(i=>!i.urg);
        if(!ni.length) return null;
        return (
          <div key={cat} style={{marginBottom:13}}>
            <div className="sec"><span>{AIICO[cat]||"📦"}</span> {cat}</div>
            {ni.map(item=>(
              <div key={item.id} className={`gsm si${item.d?" done":""}`}>
                <Chksq on={item.d} fn={()=>mut(s=>{const i=s.shopping.find(x=>x.id===item.id);if(i)i.d=!i.d;})}/>
                <span className="sn">{item.n}</span>
                <span className="sq">{item.qty}</span>
                <div onClick={()=>mut(s=>{s.shopping=s.shopping.filter(x=>x.id!==item.id);})}
                  style={{color:"var(--tl)",cursor:"pointer",padding:"0 4px"}}>✕</div>
              </div>
            ))}
          </div>
        );
      })}
      <button className="btn-mint" onClick={()=>{
        mut(s=>{s.shopping=s.shopping.filter(i=>!i.d);s.aliments.forEach(a=>{a.inL=false;});});
        toast2("Courses terminées ! ✓");
      }}>✓ Courses terminées</button>
      <button className="btn-g" style={{width:"100%",marginTop:7}} onClick={()=>{
        mut(s=>{s.shopping=[];s.aliments.forEach(a=>{a.inL=false;});});
        toast2("Liste vidée");
      }}>🗑 Vider la liste</button>
    </div>
  );
}

function Recettes({ S, mut, om }) {
  const [rFilt, setRFilt] = useState("");
  return (
    <div className="scr pt">
      <div className="row sb mb fu">
        <div><div className="h1">Recettes</div><div className="lbl" style={{marginTop:2}}>{S.recipes.length} recettes</div></div>
        <button className="btn-g" onClick={()=>om("add-recipe")}>+ Recette</button>
      </div>
      <div className="tr">
        {["","Plats","Salades","Soupes","Pizzas","Tartes","Desserts","Boissons"].map(c=>(
          <span key={c} className={`tag${rFilt===c?" on":""}`} onClick={()=>setRFilt(c)}>{c||"Tout"}</span>
        ))}
      </div>
      <div className="rg">
        {S.recipes.filter(r=>!rFilt||r.cat===rFilt).map(r=>(
          <div key={r.id} className="gsm rc" onClick={()=>om("recipe",r)}>
            <div className="rth">{r.e||"🍽️"}</div>
            <div className="rbdg">{r.cat}</div>
            <div className="rfav" onClick={e=>{e.stopPropagation();mut(s=>{const rc=s.recipes.find(x=>x.id===r.id);if(rc)rc.fav=!rc.fav;});}}>
              {r.fav?"❤️":"🤍"}
            </div>
            <div className="rbd">
              <div className="rnm">{r.n}</div>
              <div className="rmt"><span>⏱ {r.prep}</span><span>👤 {r.p}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Menus({ S, mut, om, go, toast2 }) {
  return (
    <div className="scr pt">
      <div className="row sb mb fu">
        <div><div className="h1">Menus</div><div className="lbl" style={{marginTop:2}}>Semaine actuelle</div></div>
      </div>
      <div className="g card" style={{marginBottom:12}}>
        {DLONG.map((d,i)=>(
          <div key={d} className="ri">
            <div style={{width:70,flexShrink:0,fontSize:".76rem",fontWeight:700,color:"var(--ts)"}}>{d}</div>
            <div style={{flex:1,fontSize:".84rem",fontWeight:500,color:"var(--td)"}}>
              {S.menu[i.toString()] || <span style={{color:"var(--tl)"}}>—</span>}
            </div>
            <button className="btn-sm" onClick={()=>om("set-menu",{day:i,dn:d})}>✏</button>
          </div>
        ))}
      </div>
      <div className="sec">🛒 Ingrédients nécessaires</div>
      <div className="g card">
        {S.recipes.filter(r=>Object.values(S.menu).includes(r.n))
          .flatMap(r=>r.ings||[])
          .filter((v,i,a)=>a.indexOf(v)===i)
          .map((ing,j)=>(
            <div key={j} className="ri">
              <span style={{fontSize:".82rem",color:"var(--tm)",flex:1}}>• {ing}</span>
            </div>
          ))}
        {!S.recipes.some(r=>Object.values(S.menu).includes(r.n)) && (
          <div style={{textAlign:"center",padding:"10px 0",fontSize:".78rem",color:"var(--ts)"}}>
            Planifiez des repas pour générer la liste
          </div>
        )}
        <button className="btn-p" style={{marginTop:9}} onClick={()=>{
          S.recipes.filter(r=>Object.values(S.menu).includes(r.n)).forEach(r=>{
            (r.ings||[]).forEach(ing=>{
              mut(s=>{
                if(!s.shopping.find(i=>i.n.toLowerCase()===ing.toLowerCase()))
                  s.shopping.push({id:s.nid++,n:ing,qty:"",cat:"Épicerie",urg:false,d:false});
              });
            });
          });
          go("cuisine","courses");
          toast2("Ingrédients ajoutés aux courses ✓");
        }}>→ Tout ajouter aux courses</button>
      </div>
    </div>
  );
}

// ── ENFANTS ────────────────────────────────────────────────────────────────────
function EnfantsOV({ S, mut, om, go }) {
  const [tab, setTab] = useState("manel");
  return (
    <div className="scr pt">
      <div className="h1 fu" style={{marginBottom:13}}>Enfants</div>
      <div className="tabs">
        <button className={`tb${tab==="manel"?" on":""}`} onClick={()=>setTab("manel")}>Manel</button>
        <button className={`tb${tab==="nawfel"?" on":""}`} onClick={()=>setTab("nawfel")}>Nawfel</button>
      </div>
      <div className="sec">🎯 Compétences prioritaires</div>
      {(S.skills[tab]||[]).filter(s=>s.st!=="done").slice(0,3).map(s=>(
        <div key={s.id} className="gsm skc">
          <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,var(--lavl),var(--rosel))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".72rem",fontWeight:700,color:"var(--viod)",flexShrink:0}}>⭐</div>
          <div className="sk-i">
            <div className="sk-n">{s.n}</div>
            <div className="sk-d">{s.dom}</div>
          </div>
          <span className={`badge ${s.st==="prog"?"b-prog":"b-todo"}`}>{s.st==="prog"?"En cours":"À travailler"}</span>
        </div>
      ))}
      <button className="btn-g" style={{width:"100%",marginTop:6}} onClick={()=>go("enfants","competences")}>Toutes les compétences →</button>
      <div className="sec" style={{marginTop:12}}>🎨 Activités à venir</div>
      {S.acts.filter(a=>a.st!=="réalisé").slice(0,3).map(a=>(
        <div key={a.id} className="g ac">
          <div className="act">
            <div className="an">{a.n}</div>
            <span className="badge b-todo">{a.fav?"⭐ Favori":"À faire"}</span>
          </div>
          <div style={{fontSize:".72rem",color:"var(--tm)",marginBottom:4}}>🎯 {a.obj}</div>
          <div className="am2"><span>👶 {a.age}</span><span>⏱ {a.dur}</span><span>📚 {a.cat}</span></div>
        </div>
      ))}
      <button className="btn-g" style={{width:"100%",marginTop:6}} onClick={()=>go("enfants","activites")}>Bibliothèque d'activités →</button>
    </div>
  );
}

function Religion({ S, mut }) {
  const [tab, setTab] = useState("invocs");
  return (
    <div className="scr pt">
      <div className="h1 fu" style={{marginBottom:13}}>Religion</div>
      <div className="tabs">
        <button className={`tb${tab==="invocs"?" on":""}`} onClick={()=>setTab("invocs")}>Invocations</button>
        <button className={`tb${tab==="sourates"?" on":""}`} onClick={()=>setTab("sourates")}>Sourates</button>
        <button className={`tb${tab==="prophets"?" on":""}`} onClick={()=>setTab("prophets")}>Prophètes</button>
      </div>

      {tab==="invocs" && S.invocs.map(inv=>(
        <div key={inv.id} className="g card" style={{marginBottom:10}}>
          <div className="row sb" style={{marginBottom:7}}>
            <span className={`badge ${inv.st==="done"?"b-done":inv.st==="prog"?"b-prog":"b-todo"}`}>
              {inv.st==="done"?"Acquis":inv.st==="prog"?"En cours":"À apprendre"}
            </span>
            <div className="row gap">
              {["todo","prog","done"].map(s=>(
                <button key={s} className="btn-sm"
                  style={inv.st===s?{background:"rgba(124,107,160,.3)"}:{}}
                  onClick={()=>mut(ss=>{const i=ss.invocs.find(x=>x.id===inv.id);if(i)i.st=s;})}>
                  {s==="todo"?"📌":s==="prog"?"🔄":"✓"}
                </button>
              ))}
            </div>
          </div>
          <div className="arab">{inv.ar}</div>
          <div className="trf">{inv.tr}</div>
        </div>
      ))}

      {tab==="sourates" && S.sourates.map(s=>(
        <div key={s.id} className="gsm" style={{display:"flex",alignItems:"center",gap:10,padding:"12px",marginBottom:7}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,var(--lavl),var(--peach))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".76rem",fontWeight:700,color:"var(--viod)",flexShrink:0}}>{s.v}v</div>
          <div style={{flex:1}}>
            <div style={{fontSize:".88rem",fontWeight:700,color:"var(--td)"}}>{s.n}</div>
            <div style={{fontSize:".98rem",color:"var(--tm)",direction:"rtl"}}>{s.ar}</div>
          </div>
          <select className="fi" style={{width:"auto",padding:"4px 8px",fontSize:".7rem"}}
            value={s.st}
            onChange={e=>mut(ss=>{const so=ss.sourates.find(x=>x.id===s.id);if(so)so.st=e.target.value;})}>
            <option value="todo">À apprendre</option>
            <option value="prog">En cours</option>
            <option value="done">Mémorisée</option>
          </select>
        </div>
      ))}

      {tab==="prophets" && S.prophets.map(p=>(
        <div key={p.id} className="g card" style={{marginBottom:10}}>
          <div className="row gap" style={{marginBottom:9}}>
            <div className="phav">{p.ico}</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.15rem",fontWeight:400,color:"var(--td)"}}>{p.n}</div>
              <div style={{fontSize:".7rem",color:"var(--tm)",marginTop:1}}>💡 {p.val}</div>
            </div>
            <span className={`badge ${p.st==="mémorisé"?"b-done":p.st==="étudié"?"b-prog":"b-todo"}`}>
              {p.st==="mémorisé"?"Mémorisé":p.st==="étudié"?"Étudié":"À raconter"}
            </span>
          </div>
          <div style={{fontSize:".74rem",color:"var(--tm)",marginBottom:5}}>🎯 {p.obj}</div>
          <div className="row gap" style={{marginBottom:8,flexWrap:"wrap"}}>
            <span className="chip">🎨 {p.act}</span>
            <span className="chip" style={{cursor:"pointer"}}>❓ {p.quiz}</span>
          </div>
          <div className="row gap">
            {["todo","étudié","mémorisé"].map(s=>(
              <button key={s} className="btn-sm" style={{flex:1,...(p.st===s?{background:"rgba(124,107,160,.3)"}:{})}}
                onClick={()=>mut(ss=>{const pr=ss.prophets.find(x=>x.id===p.id);if(pr)pr.st=s;})}>
                {s==="todo"?"À raconter":s==="étudié"?"Étudié":"Mémorisé"}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Activites({ S, mut, om, toast2 }) {
  const [aFilt, setAFilt] = useState("");
  return (
    <div className="scr pt">
      <div className="row sb mb fu">
        <div><div className="h1">Activités</div><div className="lbl" style={{marginTop:2}}>{S.acts.length} activités</div></div>
        <button className="btn-g" onClick={()=>om("add-act")}>+ Activité</button>
      </div>
      <div className="tr">
        {["","Lecture","Art","Vie pratique","Sensoriel","Sciences","Langage","Mathématiques"].map(c=>(
          <span key={c} className={`tag${aFilt===c?" on":""}`} onClick={()=>setAFilt(c)}>{c||"Tout"}</span>
        ))}
      </div>
      {S.acts.filter(a=>!aFilt||a.cat===aFilt).map(a=>(
        <div key={a.id} className="g ac">
          <div className="act">
            <div className="an">{a.n}</div>
            <span className={`badge ${a.st==="réalisé"?"b-done":"b-todo"}`}>{a.st==="réalisé"?"✓ Réalisé":"À faire"}</span>
          </div>
          <div style={{fontSize:".72rem",color:"var(--tm)",marginBottom:5}}>🎯 {a.obj}</div>
          <div style={{fontSize:".72rem",color:"var(--ts)",marginBottom:6}}>🔧 {a.mat}</div>
          <div className="am2"><span>👶 {a.age}</span><span>⏱ {a.dur}</span><span>📚 {a.cat}</span><span>⚡ {a.dif}</span></div>
          <div className="row gap" style={{marginTop:7}}>
            <button className="btn-sm" onClick={()=>{mut(s=>{const ac=s.acts.find(x=>x.id===a.id);if(ac)ac.st="réalisé";});toast2("Réalisé ✓");}}>✓ Réalisé</button>
            <button className="btn-sm" onClick={()=>mut(s=>{const ac=s.acts.find(x=>x.id===a.id);if(ac)ac.fav=!ac.fav;})}>{a.fav?"❤️":"🤍"}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Competences({ S, mut, om }) {
  const [cTab, setCTab] = useState("manel");
  const [cDom, setCDom] = useState("");
  const skills = (S.skills[cTab]||[]).filter(s=>!cDom||s.dom===cDom);
  const recActs = cDom ? S.acts.filter(a=>a.cat===cDom||a.obj?.toLowerCase().includes(cDom.toLowerCase())).slice(0,3) : [];
  return (
    <div className="scr pt">
      <div className="row sb mb fu">
        <div><div className="h1">Compétences</div></div>
        <button className="btn-g" onClick={()=>om("add-skill",{child:cTab})}>+ Compétence</button>
      </div>
      <div className="tabs">
        <button className={`tb${cTab==="manel"?" on":""}`} onClick={()=>setCTab("manel")}>Manel</button>
        <button className={`tb${cTab==="nawfel"?" on":""}`} onClick={()=>setCTab("nawfel")}>Nawfel</button>
      </div>
      <div className="tr">
        {["","Langage","Pré-écriture","Mathématiques","Motricité","Religion","Social & émotionnel"].map(d=>(
          <span key={d} className={`tag${cDom===d?" on":""}`} onClick={()=>setCDom(d)}>{d||"Tout"}</span>
        ))}
      </div>
      {skills.map(s=>(
        <div key={s.id} className="gsm skc">
          <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,var(--lavl),var(--rosel))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".62rem",fontWeight:700,color:"var(--viod)",flexShrink:0,textAlign:"center",lineHeight:1.1}}>
            {s.dom.slice(0,4)}
          </div>
          <div className="sk-i">
            <div className="sk-n">{s.n}</div>
            <div className="sk-d">{s.dom}{s.notes?` · ${s.notes}`:""}</div>
          </div>
          <select className="fi" style={{width:"auto",padding:"4px 8px",fontSize:".7rem"}}
            value={s.st}
            onChange={e=>mut(ss=>{const sk=(ss.skills[cTab]||[]).find(x=>x.id===s.id);if(sk)sk.st=e.target.value;})}>
            <option value="todo">À travailler</option>
            <option value="prog">En cours</option>
            <option value="done">Acquis</option>
          </select>
        </div>
      ))}
      {skills.length===0 && <div style={{textAlign:"center",padding:22,color:"var(--ts)",fontSize:".8rem"}}>Aucune compétence dans ce domaine</div>}
      {recActs.length>0 && (
        <>
          <div className="sec"><span>💡</span> Activités recommandées</div>
          {recActs.map(a=>(
            <div key={a.id} className="gsm" style={{padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:9}}>
              <span>🎨</span>
              <div style={{flex:1}}>
                <div style={{fontSize:".82rem",fontWeight:600,color:"var(--td)"}}>{a.n}</div>
                <div style={{fontSize:".68rem",color:"var(--ts)"}}>{a.dur} · {a.mat}</div>
              </div>
              <button className="btn-sm">Planifier</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── MYSELF ─────────────────────────────────────────────────────────────────────
function Habitudes({ S, mut, om, toast2 }) {
  return (
    <div className="scr pt">
      <div className="row sb mb fu">
        <div><div className="h1">Habitudes</div></div>
        <button className="btn-g" onClick={()=>om("add-habit")}>+ Habitude</button>
      </div>
      {S.habits.map(h=>(
        <div key={h.id} className="gsm hc" onClick={()=>{
          mut(s=>{const ha=s.habits.find(x=>x.id===h.id);if(ha){ha.p=Math.min(ha.p+20,100);if(ha.p>=100)ha.str++;}});
          toast2(`${h.n} mis à jour ✓`);
        }}>
          <div className="ht">
            <div className="row gap"><span style={{fontSize:"1.25rem"}}>{h.i}</span><span className="hn">{h.n}</span></div>
            <span className="hst">{h.str}🔥</span>
          </div>
          <div className="hg">{h.g}</div>
          <div className="pbar"><div className="pf" style={{width:`${h.p}%`}}/></div>
        </div>
      ))}
    </div>
  );
}

function SelfCare({ S, mut, om }) {
  return (
    <div className="scr pt">
      <div className="h1 fu" style={{marginBottom:13}}>Self Care</div>
      {[["am","🌸 Routine Matin"],["pm","🌙 Routine Soir"],["sup","💊 Compléments"]].map(([k,title])=>(
        <div key={k}>
          <div className="sec">{title}</div>
          <div className="g" style={{padding:"9px 13px",marginBottom:11}}>
            {S.skin[k].map((item,i)=>(
              <div key={i} className="sci" onClick={()=>mut(s=>{s.skin[k][i].d=!s.skin[k][i].d;})}>
                <div className={`chksq${item.d?" on":""}`}>{item.d?"✓":""}</div>
                <div style={{fontSize:".82rem",fontWeight:500,color:item.d?"var(--tl)":"var(--td)",textDecoration:item.d?"line-through":"none"}}>{item.n}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button className="btn-g" style={{width:"100%"}} onClick={()=>om("add-routine")}>+ Ajouter un soin</button>
      <button className="btn-g" style={{width:"100%",marginTop:7}} onClick={()=>mut(s=>{Object.values(s.skin).forEach(arr=>arr.forEach(i=>{i.d=false;}));})}>
        🔄 Réinitialiser les routines
      </button>
    </div>
  );
}

function Wishlist({ S, mut, om }) {
  const [wCat, setWCat] = useState("");
  return (
    <div className="scr pt">
      <div className="row sb mb fu">
        <div><div className="h1">Wishlist</div></div>
        <button className="btn-g" onClick={()=>om("add-wish")}>+ Produit</button>
      </div>
      <div className="tr">
        {["","Beauty","Skincare","Hair Care","Body Care","Compléments","Vêtements"].map(c=>(
          <span key={c} className={`tag${wCat===c?" on":""}`} onClick={()=>setWCat(c)}>{c||"Tout"}</span>
        ))}
      </div>
      <div className="wg">
        {S.wl.filter(w=>!wCat||w.cat===wCat).map(w=>(
          <div key={w.id} className="gsm wc">
            <div className="wi">{w.e}</div>
            <div className="wb">
              <div className="wn">{w.n}</div>
              <div className="wp">{w.p}</div>
              <div style={{fontSize:".6rem",fontWeight:700,padding:"2px 7px",borderRadius:20,display:"inline-block",marginTop:3,
                background:w.pr==="Haute"?"rgba(232,128,128,.18)":w.pr==="Moyenne"?"rgba(232,190,100,.18)":"rgba(184,212,200,.28)",
                color:w.pr==="Haute"?"#b05858":w.pr==="Moyenne"?"#906818":"#387858"}}>{w.pr}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAISON ─────────────────────────────────────────────────────────────────────
function Pieces({ S, om }) {
  return (
    <div className="scr pt">
      <div className="h1 fu" style={{marginBottom:13}}>Pièces</div>
      <div className="rmg">
        {ROOMS.map(r=>{
          const cls = r.s>=80?"sp-h":r.s>=60?"sp-m":"sp-l";
          return (
            <div key={r.k} className="gsm rm" onClick={()=>om("room",r)}>
              <div className="rm-i">{r.i}</div>
              <div className="rm-n">{r.n}</div>
              <div className="rm-s"><span className={`badge ${cls}`}>{r.s}%</span></div>
              <div className="pbar">
                <div className={`pf ${r.s>=80?"gr":r.s<60?"ro":""}`} style={{width:`${r.s}%`}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Menage({ S, mut, om, toast2 }) {
  const next = S.missions.find(m=>!m.d);
  return (
    <div className="scr pt">
      <div className="row sb mb fu">
        <div><div className="h1">Ménage</div></div>
        <button className="btn-g" onClick={()=>om("add-mission")}>+ Mission</button>
      </div>
      {next && (
        <div>
          <div className="sec">⚡ Mission suggérée</div>
          <div className="g card" style={{marginBottom:12}}>
            <div style={{fontSize:".98rem",fontWeight:700,color:"var(--viod)",marginBottom:3}}>🎯 {next.n}</div>
            <div style={{fontSize:".72rem",color:"var(--ts)",marginBottom:9}}>{next.room} · {next.dur}</div>
            <button className="btn-mint" onClick={()=>{
              mut(s=>{const m=s.missions.find(x=>x.id===next.id);if(m)m.d=true;});
              toast2("Mission accomplie 🎉");
            }}>✓ C'est fait !</button>
          </div>
        </div>
      )}
      {["Quotidien","Hebdomadaire","Mensuel","Trimestriel"].map(freq=>{
        const items = S.missions.filter(m=>m.freq===freq);
        if(!items.length) return null;
        return (
          <div key={freq} style={{marginBottom:13}}>
            <div className="sec">📅 {freq}</div>
            {items.map(m=>(
              <div key={m.id} className="gsm" style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",marginBottom:6}}>
                <Chksq on={m.d} fn={()=>mut(s=>{const mi=s.missions.find(x=>x.id===m.id);if(mi)mi.d=!mi.d;})}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:".82rem",fontWeight:600,color:m.d?"var(--tl)":"var(--td)",textDecoration:m.d?"line-through":"none"}}>{m.n}</div>
                  <div style={{fontSize:".68rem",color:"var(--ts)"}}>{m.room} · {m.dur}</div>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function Projets({ S, mut, om }) {
  return (
    <div className="scr pt">
      <div className="row sb mb fu">
        <div><div className="h1">Projets</div></div>
        <button className="btn-g" onClick={()=>om("add-project")}>+ Projet</button>
      </div>
      {S.projects.map(p=>(
        <div key={p.id} className="g card" style={{marginBottom:11}}>
          <div className="row sb" style={{marginBottom:5}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.1rem",fontWeight:400,color:"var(--td)"}}>{p.n}</div>
            <span className={`badge ${p.st==="done"?"b-done":p.st==="prog"?"b-prog":"b-todo"}`}>
              {p.st==="done"?"Terminé":p.st==="prog"?"En cours":"À faire"}
            </span>
          </div>
          <div style={{fontSize:".73rem",color:"var(--tm)",marginBottom:7}}>{p.desc}</div>
          <div className="row gap" style={{marginBottom:7}}>
            <span className="chip">{p.room}</span>
            <span style={{fontSize:".7rem",color:"var(--ts)",marginLeft:"auto"}}>{p.prog}%</span>
          </div>
          <div className="pbar"><div className="pf" style={{width:`${p.prog}%`}}/></div>
          <div style={{marginTop:9}}>
            {p.cl.map((c,i)=>(
              <div key={i} className="row gap" style={{padding:"4px 0",fontSize:".78rem",color:c.d?"var(--tl)":"var(--td)",textDecoration:c.d?"line-through":"none",cursor:"pointer"}}
                onClick={()=>mut(s=>{const pj=s.projects.find(x=>x.id===p.id);if(pj){pj.cl[i].d=!pj.cl[i].d;pj.prog=Math.round(pj.cl.filter(x=>x.d).length/pj.cl.length*100);}})}>
                <div className={`chksq${c.d?" on":""}`} style={{width:16,height:16,fontSize:".56rem"}}>{c.d?"✓":""}</div>
                {c.t}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WLMaison({ S, mut, om }) {
  return (
    <div className="scr pt">
      <div className="row sb mb fu">
        <div><div className="h1">Wishlist Maison</div></div>
        <button className="btn-g" onClick={()=>om("add-wlm")}>+ Envie</button>
      </div>
      {S.wlm.map(w=>(
        <div key={w.id} className="gsm" style={{display:"flex",alignItems:"center",gap:11,padding:"12px",marginBottom:7}}>
          <span style={{fontSize:"1.7rem"}}>{w.e}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:".86rem",fontWeight:700,color:"var(--td)"}}>{w.n}</div>
            <div style={{fontSize:".7rem",color:"var(--ts)"}}>{w.room}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:".82rem",fontWeight:700,color:"var(--viod)"}}>{w.p}</div>
            <div style={{fontSize:".6rem",fontWeight:700,padding:"2px 7px",borderRadius:20,marginTop:2,
              background:w.t==="besoin"?"rgba(170,200,224,.28)":"rgba(200,185,240,.2)",
              color:w.t==="besoin"?"#487898":"var(--viod)"}}>{w.t==="besoin"?"Besoin":"Envie"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Params({ toast2 }) {
  return (
    <div className="scr pt">
      <div className="h1 fu" style={{marginBottom:13}}>Paramètres</div>
      {[
        ["🏠","Pièces & Ménage","Gérer les pièces et missions"],
        ["👨‍👩‍👧","Membres famille","Profils et avatars"],
        ["🌙","Thème","Couleurs et apparence"],
        ["📦","Import / Export","Import Notion, export données"],
        ["🔔","Notifications","Rappels et alertes"],
        ["ℹ️","À propos","Family OS v2.0"],
      ].map(([ico,lbl,desc])=>(
        <div key={lbl} className="gsm" style={{display:"flex",alignItems:"center",gap:11,padding:"12px",marginBottom:7,cursor:"pointer"}}
          onClick={()=>toast2(`${lbl} — bientôt disponible`)}>
          <span style={{fontSize:"1.15rem",width:26,textAlign:"center"}}>{ico}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:".84rem",fontWeight:600,color:"var(--td)"}}>{lbl}</div>
            <div style={{fontSize:".7rem",color:"var(--ts)"}}>{desc}</div>
          </div>
          <span style={{color:"var(--tl)"}}>›</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODALS — also defined at module level
// ─────────────────────────────────────────────────────────────────────────────
function Modals({ S, mut, modal, mdata, form, sf, FI, FT, cm, om, go, toast2, emoTgt, selEmo, setSelEmo, setEmoTgt }) {

  const sharedOV = (id, title, children) => (
    <OV id={id} modal={modal} cm={cm} title={title}>{children}</OV>
  );

  return (
    <>
      {/* Emotion */}
      {sharedOV("emotion", `Comment se sent ${MEMBERS.find(m=>m.k===emoTgt)?.n||""} ?`,
        <>
          <div className="epk">
            {EMOTIONS.map(e=>(
              <div key={e.e} className={`epb${selEmo===e.e?" sel":""}`} onClick={()=>setSelEmo(e.e)}>
                <span className="epbig">{e.e}</span><span className="eplbl">{e.l}</span>
              </div>
            ))}
          </div>
          <button className="btn-p" onClick={()=>{
            if(!selEmo){toast2("Sélectionne une émotion");return;}
            const em=EMOTIONS.find(x=>x.e===selEmo);
            mut(s=>{s.emo[emoTgt]={e:em.e,l:em.l};s.emoH.push({m:emoTgt,e:em.e,l:em.l,d:new Date().toISOString()});});
            cm();toast2("Humeur enregistrée 💜");
          }}>Enregistrer</button>
        </>
      )}

      {/* Add Todo */}
      {sharedOV("add-todo","✅ Nouvelle tâche",
        <>
          <div className="fg"><label className="fl">Tâche</label>{FI("t","Que faut-il faire ?")}</div>
          <div className="fg"><label className="fl">Priorité</label>
            <select className="fi" value={form.p||"mid"} onChange={e=>sf("p",e.target.value)}>
              <option value="high">Haute ⚠️</option><option value="mid">Moyenne</option><option value="low">Basse</option>
            </select>
          </div>
          <button className="btn-p" onClick={()=>{
            if(!form.t){toast2("Ajoute une tâche");return;}
            mut(s=>{s.todos.push({id:s.nid++,t:form.t,d:false,p:form.p||"mid"});});
            cm();toast2("Tâche ajoutée ✓");
          }}>Ajouter</button>
        </>
      )}

      {/* Add Event */}
      {sharedOV("add-event","📅 Nouvel événement",
        <>
          <div className="fg"><label className="fl">Titre</label>{FI("t","Ex: Anniversaire Manel")}</div>
          <div className="r2">
            <div className="fg"><label className="fl">Date</label>
              <input className="fi" type="date" value={form.date||fmt(new Date())} onChange={e=>sf("date",e.target.value)}/>
            </div>
            <div className="fg"><label className="fl">Type</label>
              <select className="fi" value={form.type||"rdv"} onChange={e=>sf("type",e.target.value)}>
                <option value="rdv">Rendez-vous</option><option value="birthday">Anniversaire</option>
                <option value="outing">Sortie</option><option value="task">Tâche</option>
              </select>
            </div>
          </div>
          <button className="btn-p" onClick={()=>{
            if(!form.t){toast2("Ajoute un titre");return;}
            const cols={rdv:"#9b8bbf",birthday:"#e88080",outing:"#6aaf8a",task:"#aac8e0"};
            mut(s=>{s.events.push({id:s.nid++,t:form.t,date:form.date||fmt(new Date()),c:cols[form.type||"rdv"]});});
            cm();toast2("Événement ajouté 📅");
          }}>Ajouter</button>
        </>
      )}

      {/* Recipe detail */}
      {sharedOV("recipe",`${mdata.e||"🍽️"} ${mdata.n||""}`,
        <>
          <div className="row gap" style={{marginBottom:11,flexWrap:"wrap"}}>
            <span className="chip">⏱ Prép: {mdata.prep}</span>
            <span className="chip">🍳 Cuisson: {mdata.cook}</span>
            <span className="chip">👤 {mdata.p} portions</span>
          </div>
          {(mdata.tags||[]).length>0 && (
            <div className="row gap" style={{marginBottom:9,flexWrap:"wrap"}}>
              {(mdata.tags||[]).map(t=><span key={t} className="chip">{t}</span>)}
            </div>
          )}
          {(mdata.ings||[]).length>0 && (
            <>
              <div className="sec">🥕 Ingrédients</div>
              {(mdata.ings||[]).map((ing,i)=><div key={i} style={{fontSize:".8rem",color:"var(--tm)",padding:"2px 0"}}>• {ing}</div>)}
            </>
          )}
          <div className="row gap" style={{marginTop:13}}>
            <button className="btn-p" style={{flex:2}} onClick={()=>{
              mut(s=>{s.menu[new Date().getDay().toString()]=mdata.n;});
              cm();toast2(`${mdata.n} → menu du jour 🍽️`);
            }}>+ Au menu du jour</button>
            <button className="btn-g" style={{flex:1}} onClick={()=>{
              mut(s=>{(mdata.ings||[]).forEach(ing=>{if(!s.shopping.find(i=>i.n.toLowerCase()===ing.toLowerCase()))s.shopping.push({id:s.nid++,n:ing,qty:"",cat:"Épicerie",urg:false,d:false});});});
              cm();go("cuisine","courses");toast2("→ Courses 🛒");
            }}>→ Courses</button>
          </div>
        </>
      )}

      {/* Add Recipe */}
      {sharedOV("add-recipe","🍽️ Nouvelle recette",
        <>
          <div className="fg"><label className="fl">Nom</label>{FI("n","Ex: Tajine de légumes")}</div>
          <div className="r2">
            <div className="fg"><label className="fl">Émoji</label>{FI("e","🥘")}</div>
            <div className="fg"><label className="fl">Catégorie</label>
              <select className="fi" value={form.cat||"Plats"} onChange={e=>sf("cat",e.target.value)}>
                {RCATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="r2">
            <div className="fg"><label className="fl">Préparation</label>{FI("prep","15 min")}</div>
            <div className="fg"><label className="fl">Cuisson</label>{FI("cook","30 min")}</div>
          </div>
          <div className="fg"><label className="fl">Ingrédients (un par ligne)</label>{FT("ingsRaw","tomates\noignons\nhuile d'olive")}</div>
          <button className="btn-p" onClick={()=>{
            if(!form.n){toast2("Ajoute un nom");return;}
            mut(s=>{s.recipes.unshift({id:s.nid++,n:form.n,e:form.e||"🍽️",cat:form.cat||"Plats",prep:form.prep||"?",cook:form.cook||"?",p:4,fav:false,tags:[],ings:(form.ingsRaw||"").split("\n").filter(l=>l.trim())});});
            cm();toast2(`${form.n} ajouté 🍽️`);
          }}>Enregistrer</button>
        </>
      )}

      {/* Set Menu */}
      {sharedOV("set-menu",`Menu — ${mdata.dn||""}`,
        <>
          <div className="fg"><label className="fl">Recette enregistrée</label>
            <select className="fi" value={form.recipe||""} onChange={e=>sf("recipe",e.target.value)}>
              <option value="">— Sélectionner —</option>
              {S.recipes.map(r=><option key={r.id} value={r.n}>{r.e} {r.n}</option>)}
            </select>
          </div>
          <div className="fg"><label className="fl">Ou saisir manuellement</label>{FI("manual","Ex: Couscous maison")}</div>
          <button className="btn-p" onClick={()=>{
            const meal=form.recipe||form.manual;
            if(!meal){toast2("Choisir un repas");return;}
            mut(s=>{s.menu[mdata.day?.toString()]=meal;});
            cm();toast2("Menu mis à jour 🍽️");
          }}>Enregistrer</button>
        </>
      )}

      {/* Add Shopping */}
      {sharedOV("add-shop","🛒 Ajouter un article",
        <>
          <div className="fg"><label className="fl">Article</label>{FI("n","Nom du produit")}</div>
          <div className="r2">
            <div className="fg"><label className="fl">Quantité</label>{FI("qty","500g")}</div>
            <div className="fg"><label className="fl">Catégorie</label>
              <select className="fi" value={form.cat||"Épicerie"} onChange={e=>sf("cat",e.target.value)}>
                {AICATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="fg"><label className="fl">Urgent ?</label>
            <div className="row gap">
              {[false,true].map(v=>(
                <button key={String(v)} className={`tag${(form.urg===v||(form.urg===undefined&&!v))?" on":""}`}
                  style={{flex:1,padding:"8px",fontFamily:"'Manrope',sans-serif"}} onClick={()=>sf("urg",v)}>
                  {v?"Oui ⚠️":"Non"}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-p" onClick={()=>{
            if(!form.n){toast2("Ajoute un nom");return;}
            mut(s=>{
              s.shopping.push({id:s.nid++,n:form.n,qty:form.qty||"",cat:form.cat||"Épicerie",urg:!!form.urg,d:false});
              if(!s.aliments.find(a=>a.n.toLowerCase()===form.n.toLowerCase()))
                s.aliments.push({id:s.nid++,n:form.n,cat:form.cat||"Épicerie",qty:form.qty||"",inL:true});
            });
            cm();toast2(`${form.n} ajouté 🛒`);
          }}>Ajouter</button>
        </>
      )}

      {/* Add Aliment */}
      {sharedOV("add-aliment","📦 Nouveau produit",
        <>
          <div className="fg"><label className="fl">Nom</label>{FI("n","Ex: Farine")}</div>
          <div className="r2">
            <div className="fg"><label className="fl">Quantité</label>{FI("qty","500g")}</div>
            <div className="fg"><label className="fl">Catégorie</label>
              <select className="fi" value={form.cat||"Épicerie"} onChange={e=>sf("cat",e.target.value)}>
                {AICATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-p" onClick={()=>{
            if(!form.n){toast2("Ajoute un nom");return;}
            mut(s=>{s.aliments.push({id:s.nid++,n:form.n,cat:form.cat||"Épicerie",qty:form.qty||"",inL:false});});
            cm();toast2(`${form.n} ajouté ✓`);
          }}>Ajouter</button>
        </>
      )}

      {/* Add Skill */}
      {sharedOV("add-skill","⭐ Nouvelle compétence",
        <>
          <div className="fg"><label className="fl">Compétence</label>{FI("n","Ex: Reconnaît les voyelles")}</div>
          <div className="fg"><label className="fl">Domaine</label>
            <select className="fi" value={form.dom||"Langage"} onChange={e=>sf("dom",e.target.value)}>
              {SDOMS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="fg"><label className="fl">Enfant</label>
            <select className="fi" value={form.child||mdata.child||"manel"} onChange={e=>sf("child",e.target.value)}>
              <option value="manel">Manel</option><option value="nawfel">Nawfel</option>
            </select>
          </div>
          <button className="btn-p" onClick={()=>{
            if(!form.n){toast2("Ajoute un nom");return;}
            const child=form.child||mdata.child||"manel";
            mut(s=>{if(!s.skills[child])s.skills[child]=[];s.skills[child].push({id:s.nid++,n:form.n,dom:form.dom||"Langage",st:"todo",notes:""});});
            cm();toast2("Compétence ajoutée ⭐");
          }}>Ajouter</button>
        </>
      )}

      {/* Add Activity */}
      {sharedOV("add-act","🎨 Nouvelle activité",
        <>
          <div className="fg"><label className="fl">Nom</label>{FI("n","Ex: Loto des voyelles")}</div>
          <div className="r2">
            <div className="fg"><label className="fl">Âge</label>{FI("age","3-5 ans")}</div>
            <div className="fg"><label className="fl">Durée</label>{FI("dur","20 min")}</div>
          </div>
          <div className="fg"><label className="fl">Catégorie</label>
            <select className="fi" value={form.cat||"Lecture"} onChange={e=>sf("cat",e.target.value)}>
              {ACATS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="fg"><label className="fl">Matériel</label>{FI("mat","Cartes, ciseaux...")}</div>
          <div className="fg"><label className="fl">Objectif pédagogique</label>{FI("obj","Reconnaître les lettres...")}</div>
          <button className="btn-p" onClick={()=>{
            if(!form.n){toast2("Ajoute un nom");return;}
            mut(s=>{s.acts.push({id:s.nid++,...form,st:"todo",fav:false,dif:"Facile"});});
            cm();toast2(`${form.n} ajoutée 🎨`);
          }}>Ajouter l'activité</button>
        </>
      )}

      {/* Add Habit */}
      {sharedOV("add-habit","🌱 Nouvelle habitude",
        <>
          <div className="fg"><label className="fl">Habitude</label>{FI("n","Ex: Méditation")}</div>
          <div className="r2">
            <div className="fg"><label className="fl">Icône</label>{FI("i","🧘")}</div>
            <div className="fg"><label className="fl">Objectif</label>{FI("g","10 min / jour")}</div>
          </div>
          <button className="btn-p" onClick={()=>{
            if(!form.n){toast2("Ajoute un nom");return;}
            mut(s=>{s.habits.push({id:s.nid++,n:form.n,i:form.i||"✅",g:form.g||"",str:0,p:0});});
            cm();toast2(`${form.n} créée 🌱`);
          }}>Créer</button>
        </>
      )}

      {/* Add Routine */}
      {sharedOV("add-routine","🌸 Ajouter un soin",
        <>
          <div className="fg"><label className="fl">Soin / Produit</label>{FI("n","Ex: Sérum vitamine C")}</div>
          <div className="fg"><label className="fl">Routine</label>
            <select className="fi" value={form.r||"am"} onChange={e=>sf("r",e.target.value)}>
              <option value="am">Visage Matin</option>
              <option value="pm">Visage Soir</option>
              <option value="sup">Compléments</option>
            </select>
          </div>
          <button className="btn-p" onClick={()=>{
            if(!form.n){toast2("Ajoute un nom");return;}
            mut(s=>{s.skin[form.r||"am"].push({n:form.n,d:false});});
            cm();toast2(`${form.n} ajouté 🌸`);
          }}>Ajouter</button>
        </>
      )}

      {/* Add Wish */}
      {sharedOV("add-wish","💝 Wishlist",
        <>
          <div className="fg"><label className="fl">Produit</label>{FI("n","Nom du produit")}</div>
          <div className="r2">
            <div className="fg"><label className="fl">Prix</label>{FI("p","45€")}</div>
            <div className="fg"><label className="fl">Catégorie</label>
              <select className="fi" value={form.cat||"Skincare"} onChange={e=>sf("cat",e.target.value)}>
                {WCATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="r2">
            <div className="fg"><label className="fl">Émoji</label>{FI("e","✨")}</div>
            <div className="fg"><label className="fl">Priorité</label>
              <select className="fi" value={form.pr||"Haute"} onChange={e=>sf("pr",e.target.value)}>
                <option>Haute</option><option>Moyenne</option><option>Basse</option>
              </select>
            </div>
          </div>
          <button className="btn-p" onClick={()=>{
            if(!form.n){toast2("Ajoute un nom");return;}
            mut(s=>{s.wl.push({id:s.nid++,...form,e:form.e||"✨"});});
            cm();toast2("Ajouté 💝");
          }}>Ajouter</button>
        </>
      )}

      {/* Add Mission */}
      {sharedOV("add-mission","🧹 Nouvelle mission",
        <>
          <div className="fg"><label className="fl">Mission</label>{FI("n","Ex: Nettoyer la cuisine")}</div>
          <div className="r2">
            <div className="fg"><label className="fl">Pièce</label>
              <select className="fi" value={form.room||"Cuisine"} onChange={e=>sf("room",e.target.value)}>
                {ROOMS.map(r=><option key={r.k}>{r.n}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Durée</label>{FI("dur","20 min")}</div>
          </div>
          <div className="fg"><label className="fl">Fréquence</label>
            <select className="fi" value={form.freq||"Hebdomadaire"} onChange={e=>sf("freq",e.target.value)}>
              <option>Quotidien</option><option>Hebdomadaire</option><option>Mensuel</option><option>Trimestriel</option>
            </select>
          </div>
          <button className="btn-p" onClick={()=>{
            if(!form.n){toast2("Ajoute un nom");return;}
            mut(s=>{s.missions.push({id:s.nid++,...form,d:false});});
            cm();toast2("Mission ajoutée 🧹");
          }}>Ajouter</button>
        </>
      )}

      {/* Add Project */}
      {sharedOV("add-project","📋 Nouveau projet",
        <>
          <div className="fg"><label className="fl">Nom</label>{FI("n","Ex: Réorganisation épices")}</div>
          <div className="fg"><label className="fl">Description</label>{FT("desc","Décris le projet...")}</div>
          <div className="fg"><label className="fl">Pièce</label>
            <select className="fi" value={form.room||"Cuisine"} onChange={e=>sf("room",e.target.value)}>
              {ROOMS.map(r=><option key={r.k}>{r.n}</option>)}
            </select>
          </div>
          <button className="btn-p" onClick={()=>{
            if(!form.n){toast2("Ajoute un nom");return;}
            mut(s=>{s.projects.push({id:s.nid++,...form,prog:0,st:"todo",cl:[]});});
            cm();toast2(`"${form.n}" créé 📋`);
          }}>Créer</button>
        </>
      )}

      {/* Add WLM */}
      {sharedOV("add-wlm","🏠 Wishlist Maison",
        <>
          <div className="fg"><label className="fl">Article</label>{FI("n","Ex: Étagères")}</div>
          <div className="r2">
            <div className="fg"><label className="fl">Prix</label>{FI("p","120€")}</div>
            <div className="fg"><label className="fl">Pièce</label>
              <select className="fi" value={form.room||"Salon"} onChange={e=>sf("room",e.target.value)}>
                {ROOMS.map(r=><option key={r.k}>{r.n}</option>)}
              </select>
            </div>
          </div>
          <div className="r2">
            <div className="fg"><label className="fl">Émoji</label>{FI("e","🛋️")}</div>
            <div className="fg"><label className="fl">Type</label>
              <select className="fi" value={form.t||"envie"} onChange={e=>sf("t",e.target.value)}>
                <option value="envie">Envie</option><option value="besoin">Besoin</option>
              </select>
            </div>
          </div>
          <button className="btn-p" onClick={()=>{
            if(!form.n){toast2("Ajoute un nom");return;}
            mut(s=>{s.wlm.push({id:s.nid++,...form,e:form.e||"🏠"});});
            cm();toast2("Ajouté 🏠");
          }}>Ajouter</button>
        </>
      )}

      {/* Room detail */}
      {sharedOV("room",`${mdata.i||"🏠"} ${mdata.n||""}`,
        <>
          <div style={{textAlign:"center",padding:"10px 0 14px"}}>
            <div style={{fontSize:"2.8rem"}}>{mdata.i}</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"1.7rem",fontWeight:300,color:"var(--td)",margin:"5px 0"}}>Score : {mdata.s}%</div>
            <div className="pbar" style={{margin:"0 24px"}}>
              <div className={`pf ${(mdata.s||0)>=80?"gr":(mdata.s||0)<60?"ro":""}`} style={{width:`${mdata.s||0}%`}}/>
            </div>
          </div>
          <div className="sec">🧹 Missions</div>
          {S.missions.filter(m=>m.room===mdata.n).map(m=>(
            <div key={m.id} className="gsm" style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",marginBottom:6}}>
              <Chksq on={m.d} fn={()=>mut(s=>{const mi=s.missions.find(x=>x.id===m.id);if(mi)mi.d=!mi.d;})}/>
              <div style={{flex:1}}>
                <div style={{fontSize:".82rem",fontWeight:600,color:m.d?"var(--tl)":"var(--td)"}}>{m.n}</div>
                <div style={{fontSize:".68rem",color:"var(--ts)"}}>{m.dur} · {m.freq}</div>
              </div>
            </div>
          ))}
          {!S.missions.filter(m=>m.room===mdata.n).length && (
            <div style={{textAlign:"center",padding:"10px 0",color:"var(--ts)",fontSize:".78rem"}}>Aucune mission pour cette pièce</div>
          )}
        </>
      )}

      {/* FAB quick actions */}
      {sharedOV("fab","⚡ Action rapide",
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:4}}>
          {[
            {ico:"✅",lbl:"Tâche",fn:()=>{cm();om("add-todo");}},
            {ico:"📅",lbl:"Événement",fn:()=>{cm();om("add-event");}},
            {ico:"🍽️",lbl:"Recette",fn:()=>{cm();om("add-recipe");}},
            {ico:"🛒",lbl:"Article",fn:()=>{cm();om("add-shop");}},
            {ico:"🎨",lbl:"Activité",fn:()=>{cm();om("add-act");}},
            {ico:"⭐",lbl:"Compétence",fn:()=>{cm();om("add-skill",{child:"manel"});}},
            {ico:"🧹",lbl:"Mission",fn:()=>{cm();om("add-mission");}},
            {ico:"💝",lbl:"Wishlist",fn:()=>{cm();om("add-wish");}},
            {ico:"📋",lbl:"Projet",fn:()=>{cm();om("add-project");}},
          ].map(item=>(
            <div key={item.lbl} className="gsm"
              style={{padding:"13px 6px",textAlign:"center",cursor:"pointer",borderRadius:14,transition:"transform .13s"}}
              onClick={item.fn}>
              <div style={{fontSize:"1.5rem",marginBottom:4}}>{item.ico}</div>
              <div style={{fontSize:".62rem",fontWeight:700,letterSpacing:".04em",textTransform:"uppercase",color:"var(--tm)"}}>{item.lbl}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP — only handles state, routing, sidebar. NO screen components defined here.
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [S, setS]           = useState(IS);
  const [scr, setScr]       = useState("dashboard");
  const [sub, setSub]       = useState(null);
  const [sideOpen, setSideOpen] = useState(true);
  const [modal, setModal]   = useState(null);
  const [mdata, setMdata]   = useState({});
  const [toast, setToast]   = useState({m:"",s:false});
  const [emoTgt, setEmoTgt] = useState("");
  const [selEmo, setSelEmo] = useState(null);
  const [calMon, setCalMon] = useState(new Date());
  const [form, setForm]     = useState({});
  const [exp, setExp]       = useState({cuisine:true,enfants:false,myself:false,maison:false});

  const isMob = typeof window!=="undefined" && window.innerWidth < 640;
  useEffect(()=>{ if(isMob) setSideOpen(false); },[]);

  const toast2 = useCallback((m) => {
    setToast({m,s:true});
    setTimeout(()=>setToast(t=>({...t,s:false})), 2400);
  },[]);

  const mut = (fn) => setS(s => { const ns=JSON.parse(JSON.stringify(s)); fn(ns); return ns; });
  const om  = (m, d={}) => { setModal(m); setMdata(d); setForm(d); };
  const cm  = () => { setModal(null); setForm({}); };
  const sf  = (k,v) => setForm(f=>({...f,[k]:v}));

  // Inline form helpers — stable because they don't recreate components
  const FI = (k,ph,type="text") => (
    <input className="fi" type={type} placeholder={ph} value={form[k]||""} onChange={e=>sf(k,e.target.value)}/>
  );
  const FT = (k,ph) => (
    <textarea className="fi" placeholder={ph} value={form[k]||""} onChange={e=>sf(k,e.target.value)}/>
  );

  const go = (s, sb=null) => {
    setScr(s); setSub(sb);
    if(isMob) setSideOpen(false);
  };

  // Open emotion modal with correct target
  const omEmotion = (tgt) => {
    setEmoTgt(tgt);
    setSelEmo(S.emo[tgt]?.e || null);
    setModal("emotion");
    setMdata({tgt});
    setForm({tgt});
  };

  // ── ROUTER ─────────────────────────────────────────────────────────────────
  const commonProps = { S, mut, om, go, toast2 };

  const renderScreen = () => {
    const s = sub || scr;
    // override om for emotion to handle emoTgt properly
    const omWithEmo = (m, d={}) => {
      if(m==="emotion" && d.tgt) { omEmotion(d.tgt); return; }
      om(m,d);
    };

    if(scr==="dashboard") return <Dashboard {...commonProps} om={omWithEmo} calMon={calMon} setCalMon={setCalMon}/>;
    if(s==="aliments")    return <Aliments {...commonProps}/>;
    if(s==="courses")     return <Courses {...commonProps}/>;
    if(s==="recettes")    return <Recettes {...commonProps}/>;
    if(s==="menus")       return <Menus {...commonProps}/>;
    if(s==="ov"||scr==="enfants") return <EnfantsOV {...commonProps}/>;
    if(s==="religion")    return <Religion {...commonProps}/>;
    if(s==="activites")   return <Activites {...commonProps}/>;
    if(s==="competences") return <Competences {...commonProps}/>;
    if(s==="habitudes"||scr==="myself") return <Habitudes {...commonProps}/>;
    if(s==="selfcare")    return <SelfCare {...commonProps}/>;
    if(s==="wishlist")    return <Wishlist {...commonProps}/>;
    if(s==="pieces"||scr==="maison") return <Pieces {...commonProps}/>;
    if(s==="menage")      return <Menage {...commonProps}/>;
    if(s==="projets")     return <Projets {...commonProps}/>;
    if(s==="wlm")         return <WLMaison {...commonProps}/>;
    if(s==="parametres")  return <Params toast2={toast2}/>;
    if(scr==="cuisine")   return <Aliments {...commonProps}/>;
    return <Dashboard {...commonProps} om={omWithEmo} calMon={calMon} setCalMon={setCalMon}/>;
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="bg"/>
      <div className="app">

        {/* BURGER */}
        <div className="burger" onClick={()=>setSideOpen(o=>!o)}>
          <div className="bl" style={sideOpen?{transform:"translateY(5.4px) rotate(45deg)"}:{}}/>
          <div className="bl" style={sideOpen?{opacity:0}:{}}/>
          <div className="bl" style={sideOpen?{transform:"translateY(-5.4px) rotate(-45deg)"}:{}}/>
        </div>

        {isMob && <div className={`sb-ov${sideOpen?" on":""}`} onClick={()=>setSideOpen(false)}/>}

        {/* SIDEBAR */}
        <div className={`sidebar${sideOpen?"":" closed"}`}>
          <div className="sbh">
            <div className="logo">Family <span>OS</span></div>
            <div className="logo-s">Home Command Center</div>
          </div>
          <div className="nl">
            {NAV.map(item=>(
              <div key={item.k}>
                <button
                  className={`ni${scr===item.k&&!sub?" on":""}`}
                  onClick={()=>{
                    if(item.s){
                      setExp(e=>({...e,[item.k]:!e[item.k]}));
                      if(!exp[item.k]) go(item.k,item.s[0].k);
                    } else {
                      go(item.k);
                    }
                  }}>
                  <span className="ni-i">{item.i}</span>
                  <span className="ni-l">{item.l}</span>
                  {item.s && <span className={`na${exp[item.k]?" op":""}`}>›</span>}
                </button>
                {item.s && exp[item.k] && (
                  <div className="ns">
                    {item.s.map(sb2=>(
                      <button key={sb2.k} className={`nsi${sub===sb2.k?" on":""}`}
                        onClick={()=>go(item.k,sb2.k)}>{sb2.l}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="sbf"><div className="lbl">Family OS · v2.0</div></div>
        </div>

        {/* MAIN */}
        <div className="main">{renderScreen()}</div>

        {/* FAB */}
        <button className="fab" onClick={()=>om("fab")}>＋</button>

        {/* ALL MODALS */}
        <Modals
          S={S} mut={mut} modal={modal} mdata={mdata}
          form={form} sf={sf} FI={FI} FT={FT}
          cm={cm} om={om} go={go} toast2={toast2}
          emoTgt={emoTgt} selEmo={selEmo}
          setSelEmo={setSelEmo} setEmoTgt={setEmoTgt}
        />

        {/* TOAST */}
        <div className={`toast${toast.s?" show":""}`}>{toast.m}</div>
      </div>
    </>
  );
}