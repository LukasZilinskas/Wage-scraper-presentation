// Bandomasis puslapis: visa įstaiga arba viena apylinkė – visi rodikliai vienoje vietoje.
// Duomenys – tas pats įstaigos JSON kaip ataskaitoje (<script id="data">).
const D=JSON.parse(document.getElementById("data").textContent);
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const fmt=(v,d=2)=>v==null?"–":Number(v).toLocaleString("lt-LT",{minimumFractionDigits:Number.isInteger(v)?0:d,maximumFractionDigits:d});
const nf=v=>v==null?"–":Number(v).toLocaleString("lt-LT",{maximumFractionDigits:0});
const textW=(s,font)=>{try{const c=textW.c||(textW.c=document.createElement("canvas").getContext("2d"));c.font=`${font} ${getComputedStyle(document.body).fontFamily}`;return c.measureText(s).width}catch(e){return s.length*7}};
const niceStep=r=>{const e=Math.pow(10,Math.floor(Math.log10(r))),f=r/e;return(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e};
function ticks(max,cnt){if(!(max>0))max=1;const s=niceStep(max/cnt),a=[];for(let v=0;v<=max+s*.999;v+=s)a.push(+v.toFixed(6));return a}
const better=(a,b,low)=>low?a<b:a>b;
const reached=(v,t,low)=>t!=null&&v!=null&&(low?v<=t:v>=t);
const status=(v,t27,t29,low)=>{
  if(v==null||t27==null)return{c:"na",t:"Nėra duomenų"};
  if(reached(v,t29,low))return{c:"top",t:"Pasiektas 2029 m. tikslas"};
  if(reached(v,t27,low))return{c:"ok",t:"Pasiektas 2027 m. tikslas"};
  return{c:"bad",t:"Nepasiektas 2027 m. tikslas"};
};
const badge=s=>`<span class="badge ${s.c}">${s.t}</span>`;

// tooltip (tas pats principas kaip ataskaitoje)
const tp=(head,rows,c,note)=>`data-tip="${esc(`<b>${head}</b>`+rows.map(r=>`<div class="r"><span>${r[0]}</span><em>${r[1]}</em></div>`).join("")+(note?`<div class="n">${note}</div>`:""))}" data-c="${c||""}"`;
const tipEl=document.createElement("div");tipEl.className="tip";document.body.appendChild(tipEl);
document.addEventListener("mouseover",e=>{const t=e.target.closest&&e.target.closest("[data-tip]");if(!t){tipEl.classList.remove("on");return}
  tipEl.innerHTML=t.dataset.tip;tipEl.style.borderLeftColor=t.dataset.c||"";tipEl.classList.add("on")});
document.addEventListener("mousemove",e=>{if(!tipEl.classList.contains("on"))return;const w=tipEl.offsetWidth,h=tipEl.offsetHeight;
  let x=e.clientX+16,y=e.clientY+16;if(x+w>innerWidth-8)x=e.clientX-w-16;if(y+h>innerHeight-8)y=e.clientY-h-16;
  tipEl.style.left=Math.max(8,x)+"px";tipEl.style.top=Math.max(8,y)+"px"});

$("title").textContent=D.name;
$("period").textContent=D.period;
const instQ=(()=>{for(const i of D.indicators){let k=i.vals.length-1;while(k>=0&&i.vals[k]==null)k--;if(k>=0)return D.quarters[k]}return""})();

// apylinkių sąrašas (raktas – apylinkė + prisirašymo įstaigos kodas)
const key=r=>r.a+"|"+(r.pc??"–");
const all=new Map();
Object.values(D.apyl).forEach(rows=>rows.forEach(r=>{if(!all.has(key(r)))all.set(key(r),{a:r.a,pc:r.pc??"–"})}));
const list=[...all.entries()].sort((p,q)=>String(p[1].pc).localeCompare(String(q[1].pc),"lt",{numeric:true})||String(p[1].a).localeCompare(String(q[1].a),"lt",{numeric:true}));
const pcs=[...new Set(list.map(([,v])=>v.pc))],multiPc=pcs.length>1;
const sel=$("selA");
sel.add(new Option("Visos apylinkės (visa įstaiga)",""));
list.forEach(([k,v])=>sel.add(new Option(`Apylinkė ${v.a}`+(multiPc?` (prisirašymo įstaiga ${v.pc})`:""),k)));

// rodiklių duomenys (apylinkės su tuščia tiksline grupe (0) neturi prasmingos reikšmės – nelyginamos)
const IND=D.indicators.map(i=>{
  let li=i.vals.length-1;while(li>=0&&i.vals[li]==null)li--;
  return {i,rows:(D.apyl[i.nr]||[]).filter(r=>r.val!=null&&r.tg>0),inst:li>=0?i.vals[li]:null};
});
const rankOf=(it,r)=>[...it.rows].sort((p,q)=>it.i.lower?p.val-q.val:q.val-p.val).findIndex(x=>key(x)===key(r))+1;

// lentelės filtrai
IND.forEach((it,k)=>$("fI").add(new Option(it.i.name,k)));
[["top","Pasiektas 2029 m. tikslas"],["ok","Pasiektas 2027 m. tikslas"],["bad","Nepasiektas 2027 m. tikslas"]].forEach(([v,t])=>$("fS").add(new Option(t,v)));
pcs.sort((a,b)=>String(a).localeCompare(String(b),"lt",{numeric:true})).forEach(c=>$("fP").add(new Option(c==="–"?"Nenurodytas":c,c)));
["fI","fS","fP"].forEach(id=>$(id).onchange=renderTable);

const h=decodeURIComponent(location.hash.slice(1));if(all.has(h))sel.value=h;
sel.onchange=()=>{history.replaceState(null,"",sel.value?"#"+encodeURIComponent(sel.value):location.pathname+location.search);render()};
$("prev").onclick=()=>step(-1);$("next").onclick=()=>step(1);
function step(d){const i=sel.selectedIndex+d;if(i>=0&&i<sel.options.length){sel.selectedIndex=i;sel.onchange()}}

// taško paspaudimas grafike – pasirenkama ta apylinkė
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-k]");if(!t)return;
  e.preventDefault();sel.value=t.dataset.k;sel.onchange();
  if(t.tagName==="A")$("pick").scrollIntoView({behavior:"smooth"})});  // iš lentelės – grįžtama prie grafikų
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&zoomK!=null)closeZoom()});

function render(){
  const k=sel.value;
  $("prev").disabled=sel.selectedIndex<=0;$("next").disabled=sel.selectedIndex>=sel.options.length-1;
  if(!k){
    $("note").textContent=list.length?`Rodoma visa įstaiga. Pasirinkite apylinkę arba spustelėkite jos tašką grafike. Apylinkių reikšmės – ${D.apylPeriod}, įstaigos – ${instQ}.`:"Šiai įstaigai apylinkių duomenų nėra.";
    const w=IND.filter(x=>x.inst!=null&&x.i.t27!=null),n=w.length,cnt=f=>w.filter(f).length;
    const pairs=IND.flatMap(x=>x.rows.filter(r=>r.t27!=null).map(r=>reached(r.val,r.t27,x.i.lower)));
    $("cards").innerHTML=cards([
      ["Pasiekti 2027 m. tikslai",`${cnt(x=>reached(x.inst,x.i.t27,x.i.lower))} iš ${n}`,1],
      ["Pasiekti 2029 m. tikslai",`${cnt(x=>reached(x.inst,x.i.t29,x.i.lower))} iš ${n}`],
      ["Geriau už šalies reikšmę",`${cnt(x=>x.i.country!=null&&better(x.inst,x.i.country,x.i.lower))} iš ${n}`],
      ["Apylinkių reikšmės, pasiekusios 2027 m. tikslą",`${pairs.filter(Boolean).length} iš ${pairs.length}`],
    ]);
  }else{
    $("note").textContent=`Apylinkių reikšmės – ${D.apylPeriod}, įstaigos reikšmė – paskutinio turimo ketvirčio (${instQ}).`;
    const w=IND.map(x=>({...x,r:x.rows.find(o=>key(o)===k)})).filter(x=>x.r),n=w.length,cnt=f=>w.filter(f).length;
    $("cards").innerHTML=cards([
      ["Pasiekti 2027 m. tikslai",`${cnt(x=>reached(x.r.val,x.r.t27,x.i.lower))} iš ${n}`,1],
      ["Pasiekti 2029 m. tikslai",`${cnt(x=>reached(x.r.val,x.r.t29,x.i.lower))} iš ${n}`],
      ["Geriau už įstaigos reikšmę",`${cnt(x=>x.inst!=null&&better(x.r.val,x.inst,x.i.lower))} iš ${n}`],
      ["Geriau už šalies reikšmę",`${cnt(x=>x.i.country!=null&&better(x.r.val,x.i.country,x.i.lower))} iš ${n}`],
    ]);
  }
  $("out").innerHTML=IND.map((it,n)=>card(it,n,false)).join("");
  document.querySelectorAll("#out .zb").forEach(b=>b.onclick=()=>openZoom(+b.dataset.n));
  if(zoomK!=null)fillZoom();
  // prisirašymo įstaigos filtras – tik visos įstaigos vaizde ir tik kai kodų keli
  $("fP").parentElement.hidden=!(multiPc&&!k);
  renderTable();
}
const cards=a=>a.map(c=>`<div class="card${c[2]?" main":""}"><div class="l">${c[0]}</div><div class="v">${c[1]}</div></div>`).join("");

const ZOOM_IN=`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 3h5v5M8 17H3v-5M17 3l-6 6M3 17l6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ZOOM_OUT=`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;

function zero(i){return (D.apyl[i.nr]||[]).some(x=>key(x)===sel.value&&!(x.tg>0))}
function card(it,n,big){
  const {i,rows,inst}=it,k=sel.value,r=k?rows.find(x=>key(x)===k):null;
  const btn=big?`<button type="button" class="zb x" id="zx" aria-label="Sumažinti ir grįžti">${ZOOM_OUT}</button>`
    :rows.length&&(!k||r)?`<button type="button" class="zb" data-n="${n}" aria-label="Padidinti grafiką" title="Padidinti">${ZOOM_IN}</button>`:"";
  if(!k){
    const s=status(inst,i.t27,i.t29,i.lower),ok=rows.filter(x=>reached(x.val,x.t27,i.lower)).length;
    const head=`<div class="ph"><b>${i.name}</b>${badge(s)}</div>${btn}
      <div class="vr"><span class="v">${fmt(inst)}</span><span class="m">Įstaigos reikšmė · ${instQ}`+(rows.length?`<br>Apylinkių, pasiekusių 2027 m. tikslą: <b>${ok}</b> iš ${rows.length}`:"")+`</span></div>`;
    return `<div class="ac${big?" big":""}">${head}${rows.length?chart(i,rows,null,inst,i,big):`<div class="empty sm">Šiam rodikliui apylinkių duomenų nėra.</div>`}</div>`;
  }
  if(!r)return `<div class="ac"><div class="ph"><b>${i.name}</b><span class="badge na">Nėra duomenų</span></div>
    <div class="empty sm">${zero(i)?"Apylinkės tikslinė grupė šiam rodikliui lygi 0, todėl reikšmė nevertinama.":"Šiam rodikliui apylinkės duomenų nėra."} Įstaigos reikšmė (${instQ}): <b>${fmt(inst)}</b>.</div></div>`;
  const s=status(r.val,r.t27,r.t29,i.lower);
  return `<div class="ac${big?" big":""}"><div class="ph"><b>${i.name}</b>${badge(s)}</div>${btn}
    <div class="vr"><span class="v">${fmt(r.val)}</span><span class="m">Apylinkė ${esc(r.a)} · ${D.apylPeriod}<br>Tikslinė grupė <b>${nf(r.tg)}</b> · vieta tarp įstaigos apylinkių <b>${rankOf(it,r)}</b> iš ${rows.length}</span></div>
    ${chart(i,rows,r,inst,r,big)}</div>`;
}

// Padidintas rodiklis – atskirame sluoksnyje virš puslapio; uždaroma ×, Esc arba paspaudus šalia
let zoomK=null,zoomFrom=null;
function openZoom(n){zoomK=n;zoomFrom=document.activeElement;fillZoom();$("zm").hidden=false;document.body.classList.add("noscroll");$("zx").focus()}
function fillZoom(){
  $("zc").innerHTML=card(IND[zoomK],zoomK,true);
  if(!$("zx")){closeZoom();return}
  $("zx").onclick=closeZoom;
}
function closeZoom(){zoomK=null;$("zm").hidden=true;$("zc").innerHTML="";document.body.classList.remove("noscroll");if(zoomFrom&&document.contains(zoomFrom))zoomFrom.focus()}
$("zbg").onclick=closeZoom;

// Grafikas: Y – rodiklio reikšmė, X – tikslinė grupė (kaip „Apylinkių palyginime“);
// horizontalios linijos – tikslai, įstaigos ir šalies reikšmės; linija nueina iki savo etiketės dešinėje.
// r – pasirinkta apylinkė (null – visos įstaigos vaizdas), T – tikslų šaltinis.
function chart(i,rows,r,inst,T,big){
  big=big&&innerWidth>=760;
  const W=big?1000:560,H=big?520:440,P=big?{l:64,r:150,t:16,b:54}:{l:58,r:142,t:16,b:54};
  const L=[[T.t27,"2027 m.","",2,1,"#645DC0","#220083"],[T.t28,"2028 m.","6 5",1.5,0,"#645DC0","#220083"],[T.t29,"2029 m.","6 5",1.5,0,"#645DC0","#220083"],
           [i.country,"Šalis","2 4",1.5,0,"#8A87A8","#6B6890"],[inst,"Įstaiga","2 4",r?1.5:2,r?0:1,"#220083","#220083"]].filter(x=>x[0]!=null);
  const vs=rows.map(x=>x.val).sort((a,b)=>a-b),q90=vs[Math.floor((vs.length-1)*.9)];
  const need=Math.max(r?r.val:0,...L.map(x=>x[0]));
  const yt=ticks(Math.max(need,Math.min(vs[vs.length-1],Math.max(q90,need)*1.5))*1.08,6),ym=yt[yt.length-1];
  const xt=ticks(Math.max(...rows.map(o=>o.tg))*1.05,big?8:4),xm=xt[xt.length-1];
  const x=v=>P.l+Math.min(v,xm)/xm*(W-P.l-P.r),y=v=>H-P.b-Math.min(v,ym)/ym*(H-P.t-P.b),R=W-P.r,top=P.t,bot=H-P.b;
  let zone="";
  if(T.t27!=null){const yt27=y(T.t27),zy=i.lower?yt27:top,zh=i.lower?bot-yt27:yt27-top;
    zone=`<rect x="${P.l}" y="${zy}" width="${R-P.l}" height="${Math.max(0,zh)}" fill="#009870" fill-opacity=".05"/>`}
  // „0“ ašių susikirtime nerašomas
  const grid=xt.map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="${top}" y2="${bot}" stroke="#E6E4F5"/>`+(v?`<text x="${x(v)}" y="${bot+20}" font-size="14" text-anchor="middle" fill="#220083">${nf(v)}</text>`:"")).join("")
    +yt.map(v=>`<line x1="${P.l}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="#E6E4F5"/>`+(v?`<text x="${P.l-8}" y="${y(v)+4}" font-size="14" text-anchor="end" fill="#220083">${fmt(v)}</text>`:"")).join("");
  // etiketės be persidengimo: rūšiuojamos pagal aukštį, stumiamos per 17 px
  const ry=L.map(f=>y(f[0])),ord=L.map((f,k)=>k).sort((a,b)=>ry[a]-ry[b]),ly={},G=17;
  ord.forEach((k,j)=>{ly[k]=j?Math.max(ry[k],ly[ord[j-1]]+G):ry[k]});
  for(let j=ord.length-1;j>=0;j--){const lim=j===ord.length-1?bot+6:ly[ord[j+1]]-G;if(ly[ord[j]]>lim)ly[ord[j]]=lim}
  const lines=L.map((f,k)=>{const st=`stroke="${f[5]}" stroke-width="${f[3]}" ${f[2]?`stroke-dasharray="${f[2]}"`:""}`;
    return `<line x1="${P.l}" x2="${R}" y1="${ry[k]}" y2="${ry[k]}" ${st}/><polyline points="${R},${ry[k]} ${R+8},${ly[k]} ${R+24},${ly[k]}" fill="none" ${st}/>`
      +`<text x="${R+30}" y="${ly[k]+4}" font-size="14" fill="${f[6]}" ${f[4]?'font-weight="700"':""}>${f[1]}: ${fmt(f[0])}</text>`}).join("");
  // kitos apylinkės: visos įstaigos vaizde – ryškesni taškai; spustelėjus pasirenkama apylinkė
  const oc=r?"#C4A8F5":"#8F7FE0";
  let nY=0;
  const others=rows.filter(o=>!r||key(o)!==key(r)).map(o=>{const t=tp(`Apylinkė ${esc(o.a)}`,[["Rodiklio reikšmė",fmt(o.val)],["Tikslinė grupė",nf(o.tg)]],oc,"Spustelėkite – rodyti šią apylinkę");
    const dk=`data-k="${esc(key(o))}" class="pt"`;
    if(o.val>ym){nY++;const tx=x(o.tg),ty=top+2;return `<path d="M${tx-6},${ty+10}L${tx+6},${ty+10}L${tx},${ty}Z" fill="${oc}" ${dk} ${t}/>`}
    return `<circle cx="${x(o.tg)}" cy="${y(o.val)}" r="${big?7:6}" fill="${oc}" fill-opacity=".8" stroke="#fff" stroke-width="1" ${dk} ${t}/>`}).join("");
  let me="";
  if(r){const sx=x(r.tg),sy=y(r.val),lt=fmt(r.val),lw=textW(lt,"700 16px"),right=sx+16+lw<R;
    me=`<circle cx="${sx}" cy="${sy}" r="10" fill="#220083" stroke="#fff" stroke-width="2.5" ${tp(`Apylinkė ${esc(r.a)}`,[["Rodiklio reikšmė",fmt(r.val)],["Tikslinė grupė",nf(r.tg)]],"#220083")}/>`
    +`<text x="${right?sx+16:sx-16}" y="${sy-10}" font-size="16" font-weight="700" text-anchor="${right?"start":"end"}" fill="#220083" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${lt}</text>`}
  const axes=`<line x1="${P.l}" x2="${P.l}" y1="${top}" y2="${bot}" stroke="#220083"/><line x1="${P.l}" x2="${R}" y1="${bot}" y2="${bot}" stroke="#220083"/>`
    +`<text x="${(P.l+R)/2}" y="${H-8}" font-size="14" text-anchor="middle" fill="#220083">Tikslinės grupės asmenų skaičius</text>`
    +`<text transform="translate(14 ${(top+bot)/2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#220083">Rodiklio reikšmė</text>`;
  const note=nY?`<div class="hint">${nY%10===1&&nY%100!==11?`${nY} apylinkės reikšmė viršija skalę (▲ viršuje).`:`${nY} apylinkių reikšmės viršija skalę (▲ viršuje).`}</div>`:"";
  return `<svg class="ch" viewBox="0 0 ${W} ${H}">${zone}${grid}${axes}${lines}${others}${me}</svg>${note}`;
}

// Duomenų lentelė: visos įstaigos vaizde – visų rodiklių apylinkės (grupuota pagal rodiklį),
// pasirinkus apylinkę – tik tos apylinkės eilutės (po vieną kiekvienam rodikliui)
function renderTable(){
  const k=sel.value,fi=$("fI").value,fs=$("fS").value,fp=k?"*":$("fP").value;
  const pass=(v,t27,t29,low)=>fs==="*"||status(v,t27,t29,low).c===fs;
  const its=IND.map((it,n)=>({...it,n})).filter(it=>fi==="*"||String(it.n)===fi);
  let body="",cnt=0;
  if(!k){
    $("th").textContent="Apylinkių duomenys";
    const pcCol=multiPc;
    const hd=`<tr><th>Apylinkė</th>${pcCol?"<th>Prisirašymo įstaigos kodas</th>":""}<th>Tikslinė grupė</th><th>Rodiklio reikšmė</th><th>Būsena</th></tr>`;
    its.forEach(({i,rows,inst})=>{
      const rs=rows.filter(r=>(fp==="*"||String(r.pc??"–")===fp)&&pass(r.val,r.t27,r.t29,i.lower)).sort((p,q)=>i.lower?p.val-q.val:q.val-p.val);
      if(!rs.length)return;
      cnt+=rs.length;
      body+=`<tr class="grp"><td colspan="${pcCol?5:4}">${i.name}</td></tr>`+hd
        +`<tr class="tot"><td>Visa įstaiga <small>(${instQ})</small></td>${pcCol?`<td class="pi">–</td>`:""}<td class="g">${nf(i.tg)}</td><td>${fmt(inst)}</td><td>${badge(status(inst,i.t27,i.t29,i.lower))}</td></tr>`
        +rs.map(r=>`<tr><td><a href="#${esc(encodeURIComponent(key(r)))}" data-k="${esc(key(r))}">Apylinkė ${esc(r.a)}</a></td>${pcCol?`<td class="pi">${esc(r.pc??"–")}</td>`:""}<td class="g">${nf(r.tg)}</td><td class="k">${fmt(r.val)}</td><td>${badge(status(r.val,r.t27,r.t29,i.lower))}</td></tr>`).join("");
    });
  }else{
    $("th").textContent=sel.options[sel.selectedIndex].text+" – duomenys";
    const rs=its.map(it=>({...it,r:it.rows.find(o=>key(o)===k)})).filter(x=>x.r&&pass(x.r.val,x.r.t27,x.r.t29,x.i.lower));
    cnt=rs.length;
    if(cnt)body=`<tr><th>Rodiklis</th><th>Tikslinė grupė</th><th>Apylinkės reikšmė</th><th>Įstaigos reikšmė</th><th>Šalies reikšmė</th><th>Vieta</th><th>Būsena</th></tr>`
      +rs.map(x=>`<tr><td>${x.i.name}</td><td class="g">${nf(x.r.tg)}</td><td class="k">${fmt(x.r.val)}</td><td>${fmt(x.inst)}</td><td>${fmt(x.i.country)}</td><td class="g">${rankOf(x,x.r)} iš ${x.rows.length}</td><td>${badge(status(x.r.val,x.r.t27,x.r.t29,x.i.lower))}</td></tr>`).join("");
  }
  $("tc").textContent=cnt?`${cnt} ${cnt%10===1&&cnt%100!==11?"eilutė":(cnt%10>=2&&cnt%10<=9&&!(cnt%100>=12&&cnt%100<=19))?"eilutės":"eilučių"}`:"";
  $("tt").innerHTML=body||`<tr><td class="none">Pagal pasirinktus filtrus duomenų nėra.</td></tr>`;
}

render();
