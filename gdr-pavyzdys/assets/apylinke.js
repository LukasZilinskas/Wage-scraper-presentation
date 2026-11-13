// Bandomasis puslapis: vienos apylinkės visi rodikliai vienoje vietoje.
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
  // kiek trūksta iki kiekvieno tikslo – viena trumpa eilutė
  const gaps=[["2027",r.t27],["2028",r.t28],["2029",r.t29]].filter(g=>g[1]!=null)
    .map(([y,t])=>reached(r.val,t,i.lower)?`<span class="gp ok">${y} m. – pasiektas</span>`:`<span class="gp bad">${y} m. – trūksta ${fmt(Math.abs(r.val-t))}</span>`).join("");
  return `<div class="ac"><div class="ph"><div><b>${i.name}</b><div class="s">${dir}</div></div><span class="badge ${s.c}">${s.t}</span></div>
    <div class="big">${fmt(r.val)}<small>Apylinkė ${esc(r.a)} · ${D.apylPeriod}</small></div>
    <div class="meta">Tikslinė grupė: <b>${nf(r.tg)}</b> · vieta tarp įstaigos apylinkių: <b>${rank}</b> iš ${rows.length}</div>
    <div class="gaps">${gaps}</div>
    ${chart(i,rows,r,inst)}</div>`;
}

// Grafikas: Y – rodiklio reikšmė, X – tikslinė grupė (kaip „Apylinkių palyginime“);
// horizontalios linijos – tikslai, įstaigos ir šalies reikšmės; linija nueina iki savo etiketės dešinėje.
function chart(i,rows,r,inst){
  const W=560,H=440,P={l:58,r:142,t:16,b:54};
  const L=[[r.t27,"2027 m.","",2,1,"#645DC0","#220083"],[r.t28,"2028 m.","6 5",1.5,0,"#645DC0","#220083"],[r.t29,"2029 m.","6 5",1.5,0,"#645DC0","#220083"],
           [i.country,"Šalis","2 4",1.5,0,"#8A87A8","#6B6890"],[inst,"Įstaiga","2 4",1.5,0,"#220083","#220083"]].filter(x=>x[0]!=null);
  const vs=rows.map(x=>x.val).sort((a,b)=>a-b),q90=vs[Math.floor((vs.length-1)*.9)];
  const need=Math.max(r.val,...L.map(x=>x[0]));
  const yt=ticks(Math.max(need,Math.min(vs[vs.length-1],Math.max(q90,need)*1.5))*1.08,6),ym=yt[yt.length-1];
  const xt=ticks(Math.max(...rows.map(o=>o.tg))*1.05,4),xm=xt[xt.length-1];
  const x=v=>P.l+Math.min(v,xm)/xm*(W-P.l-P.r),y=v=>H-P.b-Math.min(v,ym)/ym*(H-P.t-P.b),R=W-P.r,top=P.t,bot=H-P.b;
  let zone="";
  if(r.t27!=null){const yt27=y(r.t27),zy=i.lower?yt27:top,zh=i.lower?bot-yt27:yt27-top;
    zone=`<rect x="${P.l}" y="${zy}" width="${R-P.l}" height="${Math.max(0,zh)}" fill="#009870" fill-opacity=".05"/>`}
  const grid=xt.map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="${top}" y2="${bot}" stroke="#E6E4F5"/><text x="${x(v)}" y="${bot+20}" font-size="14" text-anchor="middle" fill="#220083">${nf(v)}</text>`).join("")
    +yt.map(v=>`<line x1="${P.l}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="#E6E4F5"/><text x="${P.l-8}" y="${y(v)+4}" font-size="14" text-anchor="end" fill="#220083">${fmt(v)}</text>`).join("");
  // etiketės be persidengimo: rūšiuojamos pagal aukštį, stumiamos per 15 px
  const ry=L.map(f=>y(f[0])),ord=L.map((f,k)=>k).sort((a,b)=>ry[a]-ry[b]),ly={},G=17;
  ord.forEach((k,j)=>{ly[k]=j?Math.max(ry[k],ly[ord[j-1]]+G):ry[k]});
  for(let j=ord.length-1;j>=0;j--){const lim=j===ord.length-1?bot+6:ly[ord[j+1]]-G;if(ly[ord[j]]>lim)ly[ord[j]]=lim}
  const lines=L.map((f,k)=>{const st=`stroke="${f[5]}" stroke-width="${f[3]}" ${f[2]?`stroke-dasharray="${f[2]}"`:""}`;
    return `<line x1="${P.l}" x2="${R}" y1="${ry[k]}" y2="${ry[k]}" ${st}/><polyline points="${R},${ry[k]} ${R+8},${ly[k]} ${R+24},${ly[k]}" fill="none" ${st}/>`
      +`<text x="${R+30}" y="${ly[k]+4}" font-size="14" fill="${f[6]}" ${f[4]?'font-weight="700"':""}>${f[1]}: ${fmt(f[0])}</text>`}).join("");
  let nY=0;
  const others=rows.filter(o=>key(o)!==key(r)).map(o=>{const t=tp(`Apylinkė ${esc(o.a)}`,[["Rodiklio reikšmė",fmt(o.val)],["Tikslinė grupė",nf(o.tg)]],"#C4A8F5");
    if(o.val>ym){nY++;const tx=x(o.tg),ty=top+2;return `<path d="M${tx-6},${ty+10}L${tx+6},${ty+10}L${tx},${ty}Z" fill="#C4A8F5" ${t}/>`}
    return `<circle cx="${x(o.tg)}" cy="${y(o.val)}" r="6" fill="#C4A8F5" fill-opacity=".8" stroke="#fff" stroke-width="1" ${t}/>`}).join("");
  const sx=x(r.tg),sy=y(r.val),lt=fmt(r.val),lw=textW(lt,"700 16px"),right=sx+16+lw<R;
  const me=`<circle cx="${sx}" cy="${sy}" r="10" fill="#220083" stroke="#fff" stroke-width="2.5" ${tp(`Apylinkė ${esc(r.a)}`,[["Rodiklio reikšmė",fmt(r.val)],["Tikslinė grupė",nf(r.tg)]],"#220083")}/>`
    +`<text x="${right?sx+16:sx-16}" y="${sy-10}" font-size="16" font-weight="700" text-anchor="${right?"start":"end"}" fill="#220083" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${lt}</text>`;
  const axes=`<line x1="${P.l}" x2="${P.l}" y1="${top}" y2="${bot}" stroke="#220083"/><line x1="${P.l}" x2="${R}" y1="${bot}" y2="${bot}" stroke="#220083"/>`
    +`<text x="${(P.l+R)/2}" y="${H-8}" font-size="14" text-anchor="middle" fill="#220083">Tikslinės grupės asmenų skaičius</text>`
    +`<text transform="translate(14 ${(top+bot)/2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#220083">Rodiklio reikšmė</text>`;
  const note=nY?`<div class="hint">${nY%10===1&&nY%100!==11?`${nY} apylinkės reikšmė viršija skalę (▲ viršuje).`:`${nY} apylinkių reikšmės viršija skalę (▲ viršuje).`}</div>`:"";
  return `<svg class="ch" viewBox="0 0 ${W} ${H}">${zone}${grid}${axes}${lines}${others}${me}</svg>${note}`;
}
