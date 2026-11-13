// Bandomasis puslapis: vienos apylinkės visi rodikliai vienoje vietoje.
// Duomenys – tas pats įstaigos JSON kaip ataskaitoje (<script id="data">).
const D=JSON.parse(document.getElementById("data").textContent);
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
const fmt=(v,d=2)=>v==null?"–":Number(v).toLocaleString("lt-LT",{minimumFractionDigits:Number.isInteger(v)?0:d,maximumFractionDigits:d});
const nf=v=>v==null?"–":Number(v).toLocaleString("lt-LT",{maximumFractionDigits:0});
const sgn=v=>(v>0?"+":v<0?"−":"")+fmt(Math.abs(v));
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

// tooltip (tas pats principas kaip ataskaitoje)
const tp=(head,rows,c)=>`data-tip="${esc(`<b>${head}</b>`+rows.map(r=>`<div class="r"><span>${r[0]}</span><em>${r[1]}</em></div>`).join(""))}" data-c="${c||""}"`;
const tipEl=document.createElement("div");tipEl.className="tip";document.body.appendChild(tipEl);
document.addEventListener("mouseover",e=>{const t=e.target.closest&&e.target.closest("[data-tip]");if(!t){tipEl.classList.remove("on");return}
  tipEl.innerHTML=t.dataset.tip;tipEl.style.borderLeftColor=t.dataset.c||"";tipEl.classList.add("on")});
document.addEventListener("mousemove",e=>{if(!tipEl.classList.contains("on"))return;const w=tipEl.offsetWidth,h=tipEl.offsetHeight;
  let x=e.clientX+16,y=e.clientY+16;if(x+w>innerWidth-8)x=e.clientX-w-16;if(y+h>innerHeight-8)y=e.clientY-h-16;
  tipEl.style.left=Math.max(8,x)+"px";tipEl.style.top=Math.max(8,y)+"px"});

$("title").textContent=D.name;
$("period").textContent=D.period;
const instQ=(()=>{for(const i of D.indicators){let k=i.vals.length-1;while(k>=0&&i.vals[k]==null)k--;if(k>=0)return D.quarters[k]}return""})();
$("note").textContent=`Apylinkių reikšmės – ${D.apylPeriod}, įstaigos reikšmė – paskutinio turimo ketvirčio (${instQ}).`;

// apylinkių sąrašas (raktas – apylinkė + prisirašymo įstaigos kodas)
const key=r=>r.a+"|"+(r.pc??"–");
const all=new Map();
Object.values(D.apyl).forEach(rows=>rows.forEach(r=>{if(!all.has(key(r)))all.set(key(r),{a:r.a,pc:r.pc??"–"})}));
const list=[...all.entries()].sort((p,q)=>String(p[1].pc).localeCompare(String(q[1].pc),"lt",{numeric:true})||String(p[1].a).localeCompare(String(q[1].a),"lt",{numeric:true}));
const multiPc=new Set(list.map(([,v])=>v.pc)).size>1;
const sel=$("selA");
list.forEach(([k,v])=>sel.add(new Option(`Apylinkė ${v.a}`+(multiPc?` (prisirašymo įstaiga ${v.pc})`:""),k)));
if(!list.length){$("out").innerHTML=`<div class="empty">Šiai įstaigai apylinkių duomenų nėra.</div>`;$("cards").innerHTML=""}
else{
  const h=decodeURIComponent(location.hash.slice(1));if(all.has(h))sel.value=h;
  sel.onchange=()=>{history.replaceState(null,"","#"+encodeURIComponent(sel.value));render()};
  $("prev").onclick=()=>step(-1);$("next").onclick=()=>step(1);
  render();
}
function step(d){const i=sel.selectedIndex+d;if(i>=0&&i<sel.options.length){sel.selectedIndex=i;sel.onchange()}}

function render(){
  const k=sel.value;
  $("prev").disabled=sel.selectedIndex<=0;$("next").disabled=sel.selectedIndex>=sel.options.length-1;
  const items=D.indicators.map(i=>{
    // apylinkės su tuščia tiksline grupe (0) neturi prasmingos reikšmės – nelyginamos
    const rows=(D.apyl[i.nr]||[]).filter(r=>r.val!=null&&r.tg>0);
    const r=rows.find(x=>key(x)===k);
    let li=i.vals.length-1;while(li>=0&&i.vals[li]==null)li--;
    return {i,rows,r,inst:li>=0?i.vals[li]:null};
  });
  const withData=items.filter(x=>x.r);
  const cnt=f=>withData.filter(f).length,n=withData.length;
  $("cards").innerHTML=[
    ["Pasiekti 2027 m. tikslai",`${cnt(x=>reached(x.r.val,x.r.t27,x.i.lower))} iš ${n}`,1],
    ["Pasiekti 2029 m. tikslai",`${cnt(x=>reached(x.r.val,x.r.t29,x.i.lower))} iš ${n}`],
    ["Geriau už įstaigos reikšmę",`${cnt(x=>x.inst!=null&&better(x.r.val,x.inst,x.i.lower))} iš ${n}`],
    ["Geriau už šalies reikšmę",`${cnt(x=>x.i.country!=null&&better(x.r.val,x.i.country,x.i.lower))} iš ${n}`],
  ].map(c=>`<div class="card${c[2]?" main":""}"><div class="l">${c[0]}</div><div class="v">${c[1]}</div></div>`).join("");
  $("out").innerHTML=items.map(card).join("");
}

function zero(i){return (D.apyl[i.nr]||[]).some(x=>key(x)===sel.value&&!(x.tg>0))}
function card({i,rows,r,inst}){
  const dir=i.lower?"Mažesnė reikšmė – geresnė":"Didesnė reikšmė – geresnė";
  if(!r)return `<div class="ac"><div class="ph"><div><b>${i.name}</b><div class="s">${dir}</div></div><span class="badge na">Nėra duomenų</span></div>
    <div class="empty sm">${zero(i)?"Apylinkės tikslinė grupė šiam rodikliui lygi 0, todėl reikšmė nevertinama.":"Šiam rodikliui apylinkės duomenų nėra."} Įstaigos reikšmė (${instQ}): <b>${fmt(inst)}</b>.</div></div>`;
  const s=status(r.val,r.t27,r.t29,i.lower);
  const ord=[...rows].sort((p,q)=>i.lower?p.val-q.val:q.val-p.val),rank=ord.findIndex(x=>key(x)===key(r))+1;
  const cmp=[["2027 m. tikslas",r.t27,1],["2028 m. tikslas",r.t28,1],["2029 m. tikslas",r.t29,1],[`Įstaigos reikšmė (${instQ})`,inst,0],["Šalies reikšmė",i.country,0]]
    .filter(c=>c[1]!=null).map(([l,v,isT])=>{
      const d=r.val-v,ok=isT?reached(r.val,v,i.lower):better(r.val,v,i.lower)||d===0;
      const b=isT?(ok?`<span class="badge ok">Pasiektas</span>`:`<span class="badge bad">Trūksta ${fmt(Math.abs(d))}</span>`)
                 :(d===0?`<span class="badge na">Lygi</span>`:ok?`<span class="badge ok">Geresnė</span>`:`<span class="badge bad">Blogesnė</span>`);
      return `<tr><td>${l}</td><td>${fmt(v)}</td><td class="g">${sgn(d)}</td><td>${b}</td></tr>`}).join("");
  return `<div class="ac"><div class="ph"><div><b>${i.name}</b><div class="s">${dir}</div></div><span class="badge ${s.c}">${s.t}</span></div>
    <div class="ag"><div><div class="big">${fmt(r.val)}<small>Apylinkė ${esc(r.a)} · ${D.apylPeriod}</small></div>
      <div class="meta">Tikslinė grupė: <b>${nf(r.tg)}</b> · vieta tarp įstaigos apylinkių: <b>${rank}</b> iš ${rows.length}</div></div>
      <div class="tw"><table class="t cmp"><tr><th>Palyginimas</th><th>Reikšmė</th><th>Skirtumas</th><th>Vertinimas</th></tr>${cmp}</table></div></div>
    ${strip(i,rows,r,inst)}</div>`;
}

// juostinis grafikas: X – rodiklio reikšmė; taškai – įstaigos apylinkės, didelis – pasirinkta;
// vertikalios linijos – tikslai, įstaigos ir šalies reikšmės; žalsva sritis – 2027 m. tikslas pasiektas
function strip(i,rows,r,inst){
  const W=900,H=164,P={l:24,r:28,t:58,b:30},mid=(P.t+H-P.b)/2;
  const refs=[[r.t27,"2027 m.","","#645DC0",2],[r.t28,"2028 m.","6 5","#645DC0",1.5],[r.t29,"2029 m.","6 5","#645DC0",1.5],
              [i.country,"Šalis","2 4","#8A87A8",1.5],[inst,"Įstaiga","2 4","#220083",1.5]].filter(x=>x[0]!=null);
  const vs=rows.map(x=>x.val).sort((a,b)=>a-b),q90=vs[Math.floor((vs.length-1)*.9)];
  const need=Math.max(r.val,...refs.map(x=>x[0]));
  const xt=ticks(Math.max(need,Math.min(vs[vs.length-1],Math.max(q90,need)*1.5))*1.05,6),xm=xt[xt.length-1];
  const x=v=>P.l+Math.min(v,xm)/xm*(W-P.l-P.r);
  let zone="";
  if(r.t27!=null){const xt27=x(r.t27);zone=i.lower?`<rect x="${P.l}" y="${P.t-6}" width="${xt27-P.l}" height="${H-P.b-P.t+6}" fill="#009870" fill-opacity=".05"/>`
    :`<rect x="${xt27}" y="${P.t-6}" width="${W-P.r-xt27}" height="${H-P.b-P.t+6}" fill="#009870" fill-opacity=".05"/>`}
  // etiketės viršuje – dviem eilėmis, kad nesikirstų
  const rowsEnd=[-1e9,-1e9,-1e9],rowY=[44,30,16];
  const lab=[...refs].sort((a,b)=>x(a[0])-x(b[0])).map(f=>{const t=`${f[1]}: ${fmt(f[0])}`,w=textW(t,"600 11px"),cx=Math.max(P.l+w/2,Math.min(W-P.r-w/2,x(f[0])));
    let row=rowsEnd.findIndex(e=>cx-w/2>e+6);if(row<0)row=rowsEnd.indexOf(Math.min(...rowsEnd));rowsEnd[row]=cx+w/2;
    return `<text x="${cx}" y="${rowY[row]}" font-size="11" font-weight="600" text-anchor="middle" fill="${f[3]==="#8A87A8"?"#6B6890":"#220083"}">${t}</text>`}).join("");
  const lines=refs.map(f=>`<line x1="${x(f[0])}" x2="${x(f[0])}" y1="${P.t-6}" y2="${H-P.b}" stroke="${f[3]}" stroke-width="${f[4]}" ${f[2]?`stroke-dasharray="${f[2]}"`:""}/>`).join("");
  const axis=`<line x1="${P.l}" x2="${W-P.r}" y1="${H-P.b}" y2="${H-P.b}" stroke="#220083"/>`+xt.map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="${H-P.b}" y2="${H-P.b+4}" stroke="#220083"/><text x="${x(v)}" y="${H-P.b+18}" font-size="11" text-anchor="middle" fill="#220083">${fmt(v)}</text>`).join("");
  const others=rows.filter(o=>key(o)!==key(r)).map((o,k)=>{const yy=mid+((k%5)-2)*7,t=tp(`Apylinkė ${esc(o.a)}`,[["Rodiklio reikšmė",fmt(o.val)],["Tikslinė grupė",nf(o.tg)]],"#C4A8F5");
    return o.val>xm?`<path d="M${W-P.r-8},${yy-5}L${W-P.r-8},${yy+5}L${W-P.r},${yy}Z" fill="#C4A8F5" ${t}/>`
      :`<circle cx="${x(o.val)}" cy="${yy}" r="5" fill="#C4A8F5" fill-opacity=".75" stroke="#fff" stroke-width=".8" ${t}/>`}).join("");
  const sx=x(r.val),lt=fmt(r.val),lw=textW(lt,"700 13px"),right=sx+14+lw<W-P.r;
  const me=`<circle cx="${sx}" cy="${mid}" r="9" fill="#220083" stroke="#fff" stroke-width="2.5" ${tp(`Apylinkė ${esc(r.a)}`,[["Rodiklio reikšmė",fmt(r.val)],["Tikslinė grupė",nf(r.tg)]],"#220083")}/>`
    +`<text x="${right?sx+14:sx-14}" y="${mid+4}" font-size="13" font-weight="700" text-anchor="${right?"start":"end"}" fill="#220083" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${lt}</text>`;
  return `<svg class="strip" viewBox="0 0 ${W} ${H}">${zone}${axis}${lines}${lab}${others}${me}</svg>`;
}
