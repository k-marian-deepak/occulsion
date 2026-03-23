// ═══════════════ CANVAS STATE ═══════════════
let cvNodes=[
  {id:'n1',x:290,y:55,title:'Integration Trigger',sub:'Email Gateway · On phishing report',type:'trigger',icon:'fa-solid fa-bolt',ib:'rgba(79,110,247,0.12)',ic:'var(--accent2)'},
  {id:'n2',x:290,y:175,title:'Get IP Information',sub:'VirusTotal · Enrich sender IP',type:'default',icon:'fa-solid fa-shield-virus',ib:'rgba(232,64,64,0.08)',ic:'#e06c75'},
  {id:'n3',x:290,y:295,title:'AI Task',sub:'Assess phishing severity from context',type:'ai-node',icon:'fa-solid fa-microchip-ai',ib:'rgba(24,196,196,0.1)',ic:'var(--teal)'},
  {id:'n4',x:290,y:415,title:'If Condition',sub:'Severity ≥ 7 → Critical path',type:'operator',icon:'fa-solid fa-code-branch',ib:'rgba(144,96,240,0.12)',ic:'var(--purple)'},
  {id:'n5',x:290,y:535,title:'Create Case',sub:'Auto-assign to Tier 2 analyst',type:'default',icon:'fa-solid fa-shield-plus',ib:'var(--bg5)',ic:'var(--text2)'},
  {id:'n6',x:290,y:655,title:'Send Message',sub:'Slack · #soc-critical channel',type:'default',icon:'fa-brands fa-slack',ib:'rgba(79,185,184,0.1)',ic:'#4fc3f7'},
];
let cvEdges=[{f:'n1',t:'n2'},{f:'n2',t:'n3'},{f:'n3',t:'n4'},{f:'n4',t:'n5'},{f:'n5',t:'n6'}];
let selNode=null,dragStep=null,zoom=1,ctxNode=null,annoVis=false;
let currentIntTab='all',currentIntType='all',currentIntCat='all';

// ═══════════════ NAV ═══════════════
function navTo(v){
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('on'));
  const el=document.getElementById('view-'+v);
  if(el)el.classList.add('on');
  document.querySelectorAll('.sni').forEach(n=>n.classList.remove('on'));
  document.querySelectorAll(`.sni[data-view="${v}"]`).forEach(n=>n.classList.add('on'));
  if(v==='canvas')setTimeout(()=>renderCV(),30);
}
function tabSwitch(el){el.closest('.tb-tabs').querySelectorAll('.tt').forEach(t=>t.classList.remove('on'));el.classList.add('on');}
function toggleSection(name){
  const sec=document.getElementById('sec-'+name);
  if(sec)sec.classList.toggle('collapsed');
}
function setSettingsPage(pg){
  document.querySelectorAll('.s-page').forEach(p=>p.classList.remove('on'));
  const el=document.getElementById('sp-'+pg);
  if(el)el.classList.add('on');
  document.querySelectorAll('.sn-item').forEach(i=>i.classList.remove('on'));
  document.querySelectorAll(`.sn-item[onclick*="${pg}"]`).forEach(i=>i.classList.add('on'));
}

// ═══════════════ THEME ═══════════════
let isDark=true;
function toggleTheme(){
  isDark=!isDark;
  document.documentElement.setAttribute('data-theme',isDark?'dark':'light');
  const ic=document.getElementById('themeIcon');
  if(ic){ic.className=isDark?'fa-solid fa-moon':'fa-solid fa-sun';}
}

// ═══════════════ WORKFLOW RENDER ═══════════════
function renderWF(list){
  const g=document.getElementById('wfGrid');if(!g)return;
  g.innerHTML=list.map(w=>{
    const sc={published:'wfc-pub',testing:'wfc-test',draft:'wfc-draft'}[w.state];
    const pc={published:'sp-pub',testing:'sp-test',draft:'sp-draft'}[w.state];
    const pl={published:'● Published',testing:'◐ Testing',draft:'○ Draft'}[w.state];
    return`<div class="wfc ${sc}" onclick="openWF(${w.id})" data-cat="${w.cat}">
      <div class="wfc-h">
        <div class="wfc-ico" style="background:${w.ib};"><i class="${w.icon}" style="color:${w.ic};font-size:14px;"></i></div>
        <button class="wfc-more" onclick="event.stopPropagation();showCtx(event,null)"><i class="fa-solid fa-ellipsis"></i></button>
      </div>
      <div class="wfc-name">${w.name}</div>
      <div class="wfc-desc">${w.desc}</div>
      <div class="wfc-tags">${w.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <div class="wfc-foot">
        <span class="spill ${pc}">${pl}</span>
        <span class="wfc-meta"><i class="fa-regular fa-clock" style="font-size:9px;"></i> ${w.updated} · <i class="fa-solid fa-play" style="font-size:9px;"></i>${w.runs.toLocaleString()}</span>
      </div></div>`;
  }).join('');
}
function filterWF(q){renderWF(WF_DATA.filter(w=>w.name.toLowerCase().includes(q.toLowerCase())||w.tags.some(t=>t.toLowerCase().includes(q.toLowerCase()))));}
function chipWF(el,cat){document.querySelectorAll('.f-row .fchip').forEach(c=>c.classList.remove('on'));el.classList.add('on');renderWF(cat==='all'?WF_DATA:WF_DATA.filter(w=>w.cat===cat));}
function openWF(id){const w=WF_DATA.find(x=>x.id===id);if(w){const inp=document.getElementById('cwName');if(inp)inp.value=w.name;}navTo('canvas');}

// ═══════════════ STEP FINDER ═══════════════
function renderSF(data,filter=''){
  const fl=filter.toLowerCase();
  const list=document.getElementById('sfList');if(!list)return;
  list.innerHTML=data.map(cat=>{
    const items=cat.items.filter(i=>!fl||i.name.toLowerCase().includes(fl)||i.desc.toLowerCase().includes(fl));
    if(!items.length)return'';
    return`<div class="sf-cat"><div class="sf-cat-lbl">${cat.cat}</div>${items.map(item=>`
      <div class="sf-item" draggable="true" data-id="${item.id}" data-name="${item.name}" data-icon="${item.icon}" data-ib="${item.ib}" data-ic="${item.ic}" data-type="${item.type}" data-desc="${item.desc}" ondragstart="sfDragStart(event,this)" ondragend="sfDragEnd()">
        <div class="sf-iico" style="background:${item.ib};"><i class="${item.icon}" style="color:${item.ic};font-size:11px;"></i></div>
        <div><div class="sf-iname">${item.name}</div><div class="sf-idesc">${item.desc}</div></div>
      </div>`).join('')}</div>`;
  }).join('');
}
function filterSteps(q){renderSF(STEPS,q);}

// ═══════════════ INTEGRATIONS ═══════════════
function buildIntCatStrip(){
  const cats=['All',...new Set(INTEGRATIONS_DATA.map(i=>i.cat))];
  const strip=document.getElementById('intCatStrip');if(!strip)return;
  strip.innerHTML=cats.map((c,idx)=>`<span class="int-cat-pill${idx===0?' on':''}" onclick="setIntCat(this,'${c}')" data-cat="${c}">
    ${idx===0?'<i class="fa-solid fa-layer-group"></i>':''}${c}<span class="icp-cnt">${c==='All'?INTEGRATIONS_DATA.length:INTEGRATIONS_DATA.filter(i=>i.cat===c).length}</span>
  </span>`).join('');
}
function setIntCat(el,cat){
  document.querySelectorAll('.int-cat-pill').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');currentIntCat=cat;renderFullInts();
}
function setIntTab(el,tab){
  el.closest('.tb-tabs').querySelectorAll('.tt').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');currentIntTab=tab;renderFullInts();
}
function setIntType(el,type){
  document.querySelectorAll('#intTypeRow .fchip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');currentIntType=type;renderFullInts();
}
function doIntSearch(){renderFullInts();}
function renderFullInts(){
  const grid=document.getElementById('intFullGrid');if(!grid)return;
  const q=(document.getElementById('intSearchInp')?.value||'').toLowerCase();
  let data=INTEGRATIONS_DATA;
  if(q)data=data.filter(i=>i.n.toLowerCase().includes(q)||i.cat.toLowerCase().includes(q)||i.d.toLowerCase().includes(q));
  if(currentIntTab==='connected')data=data.filter(i=>i.c);
  if(currentIntTab==='steps')data=data.filter(i=>i.t==='step'||i.t==='both');
  if(currentIntTab==='triggers')data=data.filter(i=>i.t==='trigger'||i.t==='both');
  if(currentIntCat!=='all'&&currentIntCat!=='All')data=data.filter(i=>i.cat===currentIntCat);
  if(currentIntType==='step')data=data.filter(i=>i.t==='step'||i.t==='both');
  if(currentIntType==='trigger')data=data.filter(i=>i.t==='trigger'||i.t==='both');
  const lbl=document.getElementById('intCntLabel');if(lbl)lbl.textContent=data.length;
  grid.innerHTML=data.map(i=>`<div class="icard${i.c?' connected':''}" onclick="openIntDetail('${i.n}')">
    <div class="ic-logo" style="background:${i.ib};">
      <i class="${i.fa}" style="color:${i.ic};font-size:17px;"></i>
      ${i.c?'<div class="conn-ring"></div>':''}
    </div>
    <div class="ic-name">${i.n}</div>
    <div class="ic-cat"><i class="fa-solid fa-tag"></i>${i.cat}</div>
    <div class="ic-types">
      ${(i.t==='trigger'||i.t==='both')?'<span class="type-badge tb-trigger"><i class="fa-solid fa-bolt"></i>Trigger</span>':''}
      ${(i.t==='step'||i.t==='both')?'<span class="type-badge tb-step"><i class="fa-solid fa-play"></i>Step</span>':''}
    </div>
  </div>`).join('');
}
let currentInt=null;
function openIntDetail(name){
  const i=INTEGRATIONS_DATA.find(x=>x.n===name);if(!i)return;
  currentInt=i;
  document.getElementById('idpLogo').innerHTML=`<i class="${i.fa}" style="color:${i.ic};font-size:19px;"></i>`;
  document.getElementById('idpLogo').style.background=i.ib;
  document.getElementById('idpName').textContent=i.n;
  document.getElementById('idpCat').textContent=i.cat;
  document.getElementById('idpDesc').textContent=i.d;
  const sr=document.getElementById('idpStatusRow');
  if(sr)sr.innerHTML=`<div class="dp-stat-dot ${i.c?'on':'off'}"></div><span class="dp-stat-text">${i.c?'Connected':'Not connected'}</span><span class="dp-stat-sub">${i.c?'Active · workspace':'Click to connect'}</span>`;
  const meta=document.getElementById('idpMeta');
  if(meta)meta.innerHTML=`
    <div class="dp-meta-row"><span class="dp-meta-lbl">Category</span><span class="dp-meta-val">${i.cat}</span></div>
    <div class="dp-meta-row"><span class="dp-meta-lbl">Type</span><span class="dp-meta-val">${i.t==='both'?'Trigger + Step':i.t==='step'?'Step only':'Trigger only'}</span></div>
    <div class="dp-meta-row"><span class="dp-meta-lbl">Auth required</span><span class="dp-meta-val"><i class="fa-solid fa-check check-yes"></i> Yes</span></div>`;
  const auth=document.getElementById('idpAuthFields');
  if(auth)auth.innerHTML=i.auth.map(f=>`<div class="auth-chip"><i class="fa-solid fa-key"></i>${f}</div>`).join('');
  const btn=document.getElementById('idpPrimaryBtn');
  if(btn){
    btn.className=`dp-action-btn dp-action-primary${i.c?' connected-btn':''}`;
    btn.innerHTML=i.c?'<i class="fa-solid fa-circle-check"></i> Manage Connection':'<i class="fa-solid fa-plug"></i> Connect Integration';
  }
  document.getElementById('intDetailOverlay').classList.add('open');
  document.getElementById('intDetailPanel').classList.add('open');
}
function closeIntDetail(){
  document.getElementById('intDetailOverlay').classList.remove('open');
  document.getElementById('intDetailPanel').classList.remove('open');
  currentInt=null;
}
function handleIntConnect(){
  if(!currentInt)return;
  if(currentInt.c){toast(`${currentInt.n} connection settings opened`,'info');}
  else{currentInt.c=true;renderFullInts();openIntDetail(currentInt.n);toast(`${currentInt.n} connected!`,'ok');}
}

// ═══════════════ CASES ═══════════════
function renderCases(){
  const b=document.getElementById('casesBody');if(!b)return;
  const sm={c:`<span class="sev sc"><i class="fa-solid fa-triangle-exclamation" style="font-size:10px;"></i>Critical</span>`,h:`<span class="sev sh"><i class="fa-solid fa-circle-exclamation" style="font-size:10px;"></i>High</span>`,m:`<span class="sev sm"><i class="fa-solid fa-circle-minus" style="font-size:10px;"></i>Medium</span>`,l:`<span class="sev sl"><i class="fa-solid fa-circle-check" style="font-size:10px;"></i>Low</span>`};
  const stm={open:`<span class="cstat cs-open">Open</span>`,prog:`<span class="cstat cs-prog">In Progress</span>`,res:`<span class="cstat cs-res">Resolved</span>`};
  b.innerHTML=CASES_DATA.map(c=>{
    const slaColor=c.sc==='sla-warn'?'var(--amber)':c.sc==='sla-ok'?'var(--green)':'var(--text3)';
    return`<tr onclick="toast('Opening ${c.id}','info')">
      <td><div class="ctitle">${c.title}</div><div class="cid"><i class="fa-solid fa-hashtag" style="font-size:9px;"></i>${c.id} · ${c.src}</div></td>
      <td>${sm[c.sev]}</td><td>${stm[c.stat]}</td>
      <td><div class="asgn"><div class="mav" style="background:${c.asgn.c};">${c.asgn.i}</div>${c.asgn.n}</div></td>
      <td><span style="color:${slaColor};font-weight:500;font-size:12px;">${c.sla}</span></td>
      <td style="color:var(--text3);font-size:11.5px;">${c.created}</td>
    </tr>`;
  }).join('');
}

// ═══════════════ INSIGHTS ═══════════════
function renderInsights(){
  const mg=document.getElementById('mGrid');
  if(mg){
    const m=[
      {lbl:'TIME SAVED',icon:'fa-solid fa-clock',val:'847h',sub:'↑ 23% vs last month',c:'var(--green)'},
      {lbl:'TOTAL EXECUTIONS',icon:'fa-solid fa-bolt',val:'14.2k',sub:'↑ 18% vs last month',c:'var(--accent2)'},
      {lbl:'AVG MTTR',icon:'fa-solid fa-gauge-high',val:'4.2h',sub:'↓ 31% improvement',c:'var(--teal)'},
      {lbl:'AUTOMATION RATE',icon:'fa-solid fa-robot',val:'87%',sub:'↑ 12% vs last month',c:'var(--purple)'}
    ];
    mg.innerHTML=m.map(x=>`<div class="mc"><div class="mc-lbl"><i class="${x.icon}"></i>${x.lbl}</div><div class="mc-val" style="color:${x.c};">${x.val}</div><div class="mc-sub">${x.sub}</div></div>`).join('');
  }
  const bc=document.getElementById('barChart');
  if(bc){
    const v=[40,55,45,72,60,82,65,91,75,85,70,96,88,100,83,72,65,88,92,78,85,94,88,76,90,84,95,87,100,92];
    bc.innerHTML=v.map((x,i)=>`<div class="bcol"><div class="bbar" style="height:${x}%;background:${x>85?'var(--green)':x>65?'var(--accent)':'var(--bg5)'};opacity:0.85;"></div>${i%5===0?`<span class="blbl">${i+1}</span>`:'<span class="blbl"> </span>'}</div>`).join('');
  }
}

// ═══════════════ ACTIVITY ═══════════════
function renderActivity(){
  const f=document.getElementById('actFeed');if(!f)return;
  const acts=[
    {n:'Phishing Email Triage',x:'#8472',trig:'Email Gateway',steps:3,dur:'4.2s',s:'ok',t:'2 min ago'},
    {n:'Ransomware Detection & Containment',x:'#312',trig:'CrowdStrike',steps:'4 of 8',dur:'running',s:'run',t:'5 min ago'},
    {n:'AI SOC Triage Agent',x:'#4201',trig:'Splunk SIEM',steps:6,dur:'18.3s',s:'ok',t:'9 min ago'},
    {n:'Impossible Travel Investigation',x:'#1203',trig:'Okta',steps:6,dur:'12.8s',s:'ok',t:'18 min ago'},
    {n:'Cloud Misconfiguration Sweep',x:'#48',trig:'Schedule',steps:'step 3',dur:'failed',s:'fail',t:'1h ago'},
    {n:'MFA Bypass Detection',x:'#203',trig:'Azure AD',steps:5,dur:'7.1s',s:'ok',t:'2h ago'},
  ];
  const im={ok:{i:'fa-solid fa-circle-check',bg:'var(--gbg)',c:'var(--green)'},run:{i:'fa-solid fa-circle-notch',bg:'var(--aglow)',c:'var(--accent2)',sp:true},fail:{i:'fa-solid fa-circle-xmark',bg:'var(--rbg)',c:'var(--red)'}};
  const bm={ok:`<span class="act-badge ab-ok"><i class="fa-solid fa-check"></i>Success</span>`,run:`<span class="act-badge ab-run"><i class="fa-solid fa-circle-notch spin"></i>Running</span>`,fail:`<span class="act-badge ab-fail"><i class="fa-solid fa-xmark"></i>Failed</span>`};
  f.innerHTML=acts.map(a=>{const ic=im[a.s];return`<div class="act-item"><div class="act-ico" style="background:${ic.bg};"><i class="${ic.i}${ic.sp?' spin':''}" style="color:${ic.c};"></i></div><div class="act-body"><div class="act-title">${a.n} — Execution ${a.x}</div><div class="act-meta">Triggered by ${a.trig} · ${typeof a.steps==='number'?a.steps+' steps':'Step '+a.steps} ${a.dur!=='running'&&a.dur!=='failed'?'· '+a.dur:''}</div>${bm[a.s]}</div><div class="act-time">${a.t}</div></div>`;}).join('');
}

// ═══════════════ SETTINGS ═══════════════
function renderSettings(){
  const ab=document.getElementById('apiKeyBody');
  if(ab)ab.innerHTML=API_KEYS.map(k=>`<tr><td><div class="key-name">${k.name}</div><div class="key-id">${k.id}</div></td><td><span class="key-type ${k.type==='service'?'kt-svc':'kt-priv'}">${k.type}</span></td><td><span class="key-id">${k.id.slice(-8)}…</span></td><td><span class="key-exp ${k.expClass}">${k.exp}</span></td><td style="font-size:11.5px;color:var(--text2);">${k.role}</td><td><button class="copy-btn" onclick="toast('Client ID copied','ok')"><i class="fa-regular fa-copy"></i></button><button class="copy-btn" onclick="toast('Key settings','info')"><i class="fa-solid fa-ellipsis"></i></button></td></tr>`).join('');
  const ub=document.getElementById('usersBody');
  if(ub)ub.innerHTML=USERS.map(u=>`<tr><td><div style="font-weight:500;font-size:12.5px;">${u.name}</div></td><td style="font-size:12px;color:var(--text2);">${u.email}</td><td><span class="key-type kt-priv" style="font-size:10px;">${u.role}</span></td><td>${u.tfa?`<span style="color:var(--green);font-size:11px;"><i class="fa-solid fa-check"></i> On</span>`:`<span style="color:var(--amber);font-size:11px;"><i class="fa-solid fa-xmark"></i> Off</span>`}</td><td style="font-size:11.5px;color:var(--text3);">${u.last}</td><td><button class="copy-btn" onclick="toast('User menu opened','info')"><i class="fa-solid fa-ellipsis"></i></button></td></tr>`).join('');
  const rg=document.getElementById('roleGrid');
  if(rg)rg.innerHTML=ROLES.map(r=>`<div class="role-card"><div class="role-card-head"><div class="role-icon" style="background:${r.ib};"><i class="${r.icon}" style="color:${r.ic};"></i></div><div class="role-name">${r.name}</div></div><div class="role-desc">${r.desc}</div><div class="role-scopes">${r.scopes.map(s=>`<span class="scope-tag hi">${s}</span>`).join('')}<span class="scope-tag">+more</span></div><div class="users-count"><i class="fa-solid fa-user" style="font-size:10px;"></i>${r.users} user${r.users!==1?'s':''} assigned</div></div>`).join('');
  const om=document.getElementById('orgMetrics');
  if(om)om.innerHTML=[{lbl:'Total Workspaces',icon:'fa-solid fa-building',val:'4',sub:'Across org'},{lbl:'Total Workflows',icon:'fa-solid fa-diagram-project',val:'60',sub:'Published'},{lbl:'Workflow Editors',icon:'fa-solid fa-pen',val:'14',sub:'Across workspaces'},{lbl:'Monthly AI Credits',icon:'fa-solid fa-microchip-ai',val:'20,500',sub:'Used this month'}].map(x=>`<div class="om"><div class="om-lbl"><i class="${x.icon}"></i>${x.lbl}</div><div class="om-val">${x.val}</div><div class="om-sub">${x.sub}</div></div>`).join('');
  const wtb=document.getElementById('wsTableBody');
  if(wtb)wtb.innerHTML=WS_TABLE.map(w=>{const pct=Math.round(w.credUsed/w.credTotal*100);const pc={Elite:'pp-elite',Pro:'pp-pro',Dev:'pp-dev'}[w.plan]||'pp-dev';return`<tr><td style="font-weight:500;">${w.name}</td><td><span class="plan-pill ${pc}">${w.plan}</span></td><td>${w.wf}</td><td>${w.editors}</td><td><div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;"><div class="credit-bar"><div class="credit-fill" style="width:${pct}%;background:${pct>80?'var(--red)':pct>60?'var(--amber)':'var(--accent)'};"></div></div></div><span style="font-size:11px;font-family:'JetBrains Mono',monospace;color:var(--text3);">${w.credUsed.toLocaleString()}/${w.credTotal.toLocaleString()}</span></div></td><td style="color:var(--text2);">${w.owners}</td></tr>`;}).join('');
  const ct=document.getElementById('creditTiers');
  if(ct)ct.innerHTML=CREDIT_TIERS.map(t=>`<div class="ct ${t.active?'active':''}"><div class="ct-name">${t.name}</div><div class="ct-val">${t.val}</div><div class="ct-lbl">credits/mo</div></div>`).join('');
  const cur=document.getElementById('creditUsageRows');
  if(cur)cur.innerHTML=CREDIT_USAGE.map(c=>`<div class="credit-usage-row"><div class="cu-left"><div class="cu-icon" style="background:${c.ib};"><i class="${c.icon}" style="color:${c.ic};font-size:11px;"></i></div><div><div class="cu-name">${c.name}</div><div class="cu-desc">${c.desc}</div></div></div><div class="cu-credits">${c.credits}<span>credits</span></div></div>`).join('');
}

// ═══════════════ CANVAS ═══════════════
function renderCV(){
  const layer=document.getElementById('cv-nodes'),svg=document.getElementById('cv-svg');
  if(!layer||!svg)return;
  layer.innerHTML='';
  const paths=cvEdges.map(e=>{
    const f=cvNodes.find(n=>n.id===e.f),t=cvNodes.find(n=>n.id===e.t);
    if(!f||!t)return'';
    const x1=f.x+110,y1=f.y+72,x2=t.x+110,y2=t.y,cy=y1+(y2-y1)*0.5;
    return`<path d="M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="1.5" marker-end="url(#arr)"/>`;
  }).join('');
  svg.innerHTML=`<defs><marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="rgba(255,255,255,0.14)"/></marker></defs>${paths}`;
  cvNodes.forEach(n=>{
    const el=document.createElement('div');
    el.className=`cnode ${n.type}${selNode===n.id?' sel':''}`;
    el.id='cn-'+n.id;
    el.style.left=n.x+'px';el.style.top=n.y+'px';
    el.innerHTML=`<div class="n-port-t"><i class="fa-solid fa-circle-dot" style="font-size:7px;color:var(--text3);"></i></div>
      <div class="cnh"><div class="cnico" style="background:${n.ib};"><i class="${n.icon}" style="color:${n.ic};font-size:11px;"></i></div><span class="cn-title">${n.title}</span></div>
      <div class="cn-sub">${n.sub}</div>
      <div class="n-port" onclick="event.stopPropagation();addChild('${n.id}')"><i class="fa-solid fa-plus"></i></div>`;
    el.addEventListener('click',ev=>{ev.stopPropagation();selectNode(n.id);});
    el.addEventListener('contextmenu',ev=>{ev.preventDefault();ctxNode=n.id;showCtx(ev,n.id);});
    el.addEventListener('mousedown',ev=>{if(ev.button===0)startNodeDrag(ev,n);});
    layer.appendChild(el);
  });
  updateMM();
}
function startNodeDrag(e,node){
  const sx=e.clientX,sy=e.clientY,ox=node.x,oy=node.y;
  const mv=ev=>{node.x=ox+(ev.clientX-sx)/zoom;node.y=oy+(ev.clientY-sy)/zoom;const el=document.getElementById('cn-'+node.id);if(el){el.style.left=node.x+'px';el.style.top=node.y+'px';}redrawEdges();};
  const up=()=>{document.removeEventListener('mousemove',mv);document.removeEventListener('mouseup',up);};
  document.addEventListener('mousemove',mv);document.addEventListener('mouseup',up);
}
function redrawEdges(){
  const svg=document.getElementById('cv-svg');if(!svg)return;
  const paths=cvEdges.map(e=>{const f=cvNodes.find(n=>n.id===e.f),t=cvNodes.find(n=>n.id===e.t);if(!f||!t)return'';const x1=f.x+110,y1=f.y+72,x2=t.x+110,y2=t.y,cy=y1+(y2-y1)*0.5;return`<path d="M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="1.5" marker-end="url(#arr)"/>`;}).join('');
  svg.innerHTML=`<defs><marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="rgba(255,255,255,0.14)"/></marker></defs>${paths}`;
}
function selectNode(id){
  selNode=id;document.querySelectorAll('.cnode').forEach(n=>n.classList.remove('sel'));
  const el=document.getElementById('cn-'+id);if(el)el.classList.add('sel');
  const n=cvNodes.find(x=>x.id===id);if(n)showProps(n);updateMM();
}
function deselect(){
  selNode=null;document.querySelectorAll('.cnode').forEach(n=>n.classList.remove('sel'));
  document.getElementById('ppTitle').textContent='Select a node';
  document.getElementById('ppBody').innerHTML='<div class="pp-sec" style="text-align:center;padding:28px 15px;"><i class="fa-solid fa-computer-mouse" style="font-size:22px;color:var(--text3);display:block;margin-bottom:10px;"></i><div style="font-size:12px;color:var(--text2);">Click a canvas node<br>to configure it</div></div>';
}
function showProps(n){
  document.getElementById('ppIco').innerHTML=`<i class="${n.icon}" style="color:${n.ic};font-size:10px;"></i>`;
  document.getElementById('ppIco').style.background=n.ib;
  document.getElementById('ppTitle').textContent=n.title;
  const isTrig=n.type==='trigger',isOp=n.type==='operator',isAI=n.type==='ai-node';
  document.getElementById('ppBody').innerHTML=`
    <div class="pp-sec"><div class="pp-stitle">Configuration</div>
      <div class="pp-field"><div class="pp-lbl"><i class="fa-solid fa-tag"></i> Step name</div><input class="pp-inp" value="${n.title}" oninput="renameNode('${n.id}',this.value)" style="font-family:inherit;font-size:12px;"></div>
      ${isTrig?`<div class="pp-field"><div class="pp-lbl"><i class="fa-solid fa-plug"></i> Integration</div><select class="pp-sel"><option>Email Security Gateway</option><option>CrowdStrike</option><option>Splunk</option><option>Okta</option></select></div>
      <div class="pp-field"><div class="pp-lbl"><i class="fa-solid fa-filter"></i> Filter</div><input class="pp-inp" placeholder='$.severity == "high"'><div class="pp-hint">Type $. to reference trigger event fields</div></div>`:''}
      ${isOp?`<div class="pp-field"><div class="pp-lbl"><i class="fa-solid fa-code"></i> Condition</div><input class="pp-inp" value="$.ai_task.severity >= 7"><div class="pp-hint">Reference prior step outputs with $.</div></div>
      <div class="pp-field"><div class="pp-lbl"><i class="fa-solid fa-check"></i> True branch label</div><input class="pp-inp" value="Critical path" style="font-family:inherit;font-size:12px;"></div>`:''}
      ${isAI?`<div class="pp-field"><div class="pp-lbl"><i class="fa-solid fa-microchip"></i> AI model</div><select class="pp-sel"><option>Torq Managed (GPT-4o) — 1 credit/exec</option><option>BYOS — OpenAI</option><option>BYOS — Anthropic Claude</option><option>BYOS — Gemini</option></select></div>
      <div class="pp-field"><div class="pp-lbl"><i class="fa-solid fa-message"></i> Prompt</div><textarea class="pp-inp" rows="4" style="resize:vertical;font-family:inherit;font-size:12px;">Analyze and assign severity 1-10.\n\nEmail: $.trigger.email\nVT Score: $.virustotal.score</textarea><div class="pp-hint">1 credit consumed per execution.</div></div>`:''}
      <div class="pp-field"><div class="pp-lbl"><i class="fa-solid fa-rotate-right"></i> Retry on failure</div><select class="pp-sel"><option>3 retries — 30s delay</option><option>No retry</option><option>5 retries — 1min delay</option></select></div>
    </div>
    <div class="pp-sec"><div class="pp-stitle">Output fields</div>
      <div class="out-row"><span class="out-k">$.${n.id}.result</span><span class="out-t">object</span></div>
      <div class="out-row"><span class="out-k">$.${n.id}.status</span><span class="out-t">string</span></div>
      <div class="out-row"><span class="out-k">$.${n.id}.timestamp</span><span class="out-t">datetime</span></div>
    </div>
    <div class="pp-sec"><div class="pp-stitle">Run info</div>
      <div class="out-row"><span style="font-size:11.5px;color:var(--text2);">Last executed</span><span style="font-size:11px;color:var(--text3);">2 min ago</span></div>
      <div class="out-row"><span style="font-size:11.5px;color:var(--text2);">Avg duration</span><span style="font-size:11px;color:var(--text3);">340ms</span></div>
      <div class="out-row"><span style="font-size:11.5px;color:var(--text2);">Success rate</span><span style="font-size:11px;color:var(--green);">99.8%</span></div>
    </div>`;
}
function renameNode(id,v){const n=cvNodes.find(x=>x.id===id);if(!n)return;n.title=v;const el=document.getElementById('cn-'+id);if(el)el.querySelector('.cn-title').textContent=v;}
function addChild(pid){
  const p=cvNodes.find(n=>n.id===pid);if(!p)return;
  const nn={id:'n'+Date.now(),x:p.x,y:p.y+130,title:'HTTP Request',sub:'Configure endpoint and method',type:'default',icon:'fa-solid fa-globe',ib:'var(--bg5)',ic:'var(--text2)'};
  cvNodes.push(nn);cvEdges.push({f:pid,t:nn.id});renderCV();selectNode(nn.id);toast('Step added','ok');
}
function cvZoom(d){zoom=Math.min(2,Math.max(0.3,zoom+d));const l=document.getElementById('zoomLbl');if(l)l.textContent=Math.round(zoom*100)+'%';}
function cvFit(){zoom=1;const l=document.getElementById('zoomLbl');if(l)l.textContent='100%';}
function updateMM(){
  const mm=document.getElementById('minimap');if(!mm)return;
  mm.innerHTML=cvNodes.map(n=>`<div style="position:absolute;left:${n.x*0.17}px;top:${n.y*0.1}px;width:${220*0.17}px;height:${72*0.1}px;background:${selNode===n.id?'rgba(79,110,247,0.5)':'rgba(255,255,255,0.07)'};border-radius:2px;border:1px solid ${selNode===n.id?'rgba(79,110,247,0.7)':'rgba(255,255,255,0.08)'};"></div>`).join('');
}
function toggleAnno(){
  annoVis=!annoVis;let a=document.getElementById('cv-anno');
  if(annoVis){if(!a){a=document.createElement('div');a.className='anno';a.id='cv-anno';a.style.left='530px';a.style.top='275px';a.innerHTML='<i class="fa-regular fa-note-sticky" style="margin-right:5px;"></i>VirusTotal score > 5 escalates to Tier 2 automatically';document.getElementById('cv-nodes').appendChild(a);}a.style.display='block';}
  else if(a)a.style.display='none';
  toast(annoVis?'Annotation added':'Annotation hidden','info');
}

// ═══════════════ DRAG FROM FINDER ═══════════════
function sfDragStart(e,el){
  dragStep={id:el.dataset.id,name:el.dataset.name,icon:el.dataset.icon,ib:el.dataset.ib,ic:el.dataset.ic,type:el.dataset.type,desc:el.dataset.desc};
  el.classList.add('drag-src');
  const gi=document.getElementById('gIcon'),gl=document.getElementById('gLabel');
  if(gi){gi.className=el.dataset.icon;gi.style.color=el.dataset.ic;}
  if(gl)gl.textContent=el.dataset.name;
  e.dataTransfer.effectAllowed='copy';e.dataTransfer.setDragImage(document.createElement('div'),0,0);
}
function sfDragEnd(){document.querySelectorAll('.sf-item').forEach(i=>i.classList.remove('drag-src'));const g=document.getElementById('dGhost');if(g)g.classList.remove('vis');const dz=document.getElementById('dropZone');if(dz)dz.classList.remove('on');dragStep=null;}
document.addEventListener('dragover',e=>{if(!dragStep)return;const g=document.getElementById('dGhost');if(g){g.style.left=(e.clientX+12)+'px';g.style.top=(e.clientY-16)+'px';g.classList.add('vis');}});
function cvDragOver(e){if(!dragStep)return;e.preventDefault();e.dataTransfer.dropEffect='copy';const dz=document.getElementById('dropZone');if(dz)dz.classList.add('on');}
function cvDragLeave(e){if(e.target===document.getElementById('carea')){const dz=document.getElementById('dropZone');if(dz)dz.classList.remove('on');}}
function cvDrop(e){
  e.preventDefault();const dz=document.getElementById('dropZone');if(dz)dz.classList.remove('on');
  if(!dragStep)return;
  const r=document.getElementById('carea').getBoundingClientRect();
  const x=(e.clientX-r.left)/zoom-110,y=(e.clientY-r.top)/zoom-36;
  const nn={id:'n'+Date.now(),x:Math.max(20,x),y:Math.max(20,y),title:dragStep.name,sub:dragStep.desc,type:dragStep.type,icon:dragStep.icon,ib:dragStep.ib,ic:dragStep.ic};
  const last=cvNodes[cvNodes.length-1];cvNodes.push(nn);if(last)cvEdges.push({f:last.id,t:nn.id});
  renderCV();selectNode(nn.id);toast(`${dragStep.name} added`,'ok');dragStep=null;
}

// ═══════════════ CTX MENU ═══════════════
function showCtx(e,nid){e.stopPropagation();ctxNode=nid;const m=document.getElementById('ctxMenu');m.style.left=e.clientX+'px';m.style.top=e.clientY+'px';m.classList.add('on');}
function closeCtx(){const m=document.getElementById('ctxMenu');if(m)m.classList.remove('on');}
function ctxAct(a){closeCtx();if(a==='delete'&&ctxNode){cvNodes=cvNodes.filter(n=>n.id!==ctxNode);cvEdges=cvEdges.filter(e=>e.f!==ctxNode&&e.t!==ctxNode);if(selNode===ctxNode)deselect();renderCV();toast('Step deleted','warn');}else if(a==='duplicate'&&ctxNode){const o=cvNodes.find(n=>n.id===ctxNode);if(o){const d={...o,id:'n'+Date.now(),x:o.x+20,y:o.y+20};cvNodes.push(d);renderCV();toast('Step duplicated','ok');}}else if(a==='note'){toggleAnno();}else toast(`${a}`,'info');}
document.addEventListener('click',closeCtx);

// ═══════════════ API KEY MODALS ═══════════════
function openCreateKeyModal(){document.getElementById('createKeyModal').classList.add('on');const k=document.getElementById('keyName');if(k)k.focus();}
function closeModal(id){const m=document.getElementById(id);if(m)m.classList.remove('on');}
function selectKeyType(t){document.getElementById('ri-priv').classList.toggle('sel',t==='private');document.getElementById('ri-svc').classList.toggle('sel',t==='service');document.getElementById('svcRoleGroup').style.display=t==='service'?'block':'none';}
function generateKey(){
  const name=document.getElementById('keyName')?.value||'new-key';
  closeModal('createKeyModal');
  const cid='occ_cid_'+Math.random().toString(36).slice(2,10);
  const sec='occ_sec_'+Math.random().toString(36).slice(2,18);
  document.getElementById('showClientId').innerHTML=`${cid}<button class="copy-btn" onclick="copyText2('${cid}')"><i class="fa-regular fa-copy"></i></button>`;
  document.getElementById('showSecret').innerHTML=`${sec}<button class="copy-btn" onclick="copyText2('${sec}')"><i class="fa-regular fa-copy"></i></button>`;
  document.getElementById('showKeyModal').classList.add('on');
  API_KEYS.unshift({name,type:'private',id:cid,exp:'90 days',expClass:'exp-ok',role:'Creator'});
  renderSettings();
}
function copyText2(v){navigator.clipboard?.writeText(v);toast('Copied to clipboard','ok');}
function copyText(id){const el=document.getElementById(id);const v=el?.textContent?.replace(/\s/g,'');if(v)navigator.clipboard?.writeText(v);toast('Copied','ok');}

// ═══════════════ TOAST ═══════════════
function toast(msg,type='ok'){
  const wrap=document.getElementById('toastWrap');if(!wrap)return;
  const t=document.createElement('div');
  const icons={ok:'fa-solid fa-circle-check',info:'fa-solid fa-circle-info',warn:'fa-solid fa-triangle-exclamation'};
  t.className=`toast t-${type}`;t.innerHTML=`<i class="${icons[type]||icons.ok}"></i><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(16px)';t.style.transition='all .2s';setTimeout(()=>t.remove(),200);},2800);
}

// ═══════════════ SIDEBAR NAV ═══════════════
function bindSidebarNav(){
  document.querySelectorAll('.sni[data-view]').forEach(el=>{
    el.addEventListener('click',()=>navTo(el.dataset.view));
  });
}

// ═══════════════ INIT ═══════════════
document.addEventListener('DOMContentLoaded',()=>{
  renderWF(WF_DATA);
  renderSF(STEPS);
  buildIntCatStrip();
  renderFullInts();
  bindSidebarNav();
  renderCases();
  renderInsights();
  renderActivity();
  renderSettings();
  document.getElementById('carea')?.addEventListener('click',e=>{
    if(e.target===e.currentTarget||e.target.id==='cv-svg'||e.target.id==='cv-nodes')deselect();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      deselect();closeCtx();closeIntDetail();
      document.querySelectorAll('.modal-bg').forEach(m=>m.classList.remove('on'));
    }
  });
});
