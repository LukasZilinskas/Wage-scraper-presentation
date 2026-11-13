const D=JSON.parse(document.getElementById("data").textContent);
const $=id=>document.getElementById(id);
const tabs=[...document.querySelectorAll("#tabs .seg button")];
function show(id){
  if(!document.getElementById(id))id=tabs[0].dataset.p;
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  tabs.forEach(b=>{const a=b.dataset.p===id;b.classList.toggle("active",a);b.setAttribute("aria-selected",a)});
  history.replaceState(null,"","#"+id);
}
tabs.forEach(b=>b.onclick=()=>{show(b.dataset.p);window.scrollTo({top:0})});
document.addEventListener("keydown",e=>{
  const k=tabs.findIndex(b=>b.classList.contains("active")),d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;
  if(d&&tabs[k+d])show(tabs[k+d].dataset.p);
});
show(location.hash.slice(1));addEventListener("load",()=>window.scrollTo(0,0));
const eur=v=>Number(v).toLocaleString("lt-LT",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
$("title").textContent=D.name;
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
// teksto plotis SVG vienetais (veikia ir paslėptame skirtuke); be canvas – atsarginis įvertis
const textW=(s,font)=>{try{const c=textW.c||(textW.c=document.createElement("canvas").getContext("2d"));c.font=`${font} ${getComputedStyle(document.body).fontFamily}`;return c.measureText(s).width}catch(e){return s.length*8}};
// tooltip atributas: antraštė (HTML), eilutės [pavadinimas, reikšmė], spalva
const tp=(head,rows,c)=>`data-tip="${esc(`<b>${head.replace(/<\/?b>/g,"")}</b>`+rows.map(r=>r[0]?`<div class="r"><span>${r[0]}</span><em>${r[1]}</em></div>`:`<div class="n">${r[1]}</div>`).join(""))}" data-c="${c||""}"`;
const tipEl=document.createElement("div");tipEl.className="tip";document.body.appendChild(tipEl);
document.addEventListener("mouseover",e=>{
  const t=e.target.closest&&e.target.closest("[data-tip]");
  if(!t){tipEl.classList.remove("on");return}
  tipEl.innerHTML=t.dataset.tip;tipEl.style.borderLeftColor=t.dataset.c||"";tipEl.classList.add("on");
});
document.addEventListener("mousemove",e=>{
  if(!tipEl.classList.contains("on"))return;
  const w=tipEl.offsetWidth,h=tipEl.offsetHeight;
  let x=e.clientX+16,y=e.clientY+16;
  if(x+w>innerWidth-8)x=e.clientX-w-16;
  if(y+h>innerHeight-8)y=e.clientY-h-16;
  tipEl.style.left=Math.max(8,x)+"px";tipEl.style.top=Math.max(8,y)+"px";
});
$("period").textContent=D.period;
const galima=D.indicators.reduce((s,i)=>s+i.galima,0);
const mokama=D.indicators.reduce((s,i)=>s+i.mokama,0);
const reached=D.indicators.filter(i=>i.mokama>0).length;
$("cards").innerHTML=[
 ["Mokėtina ketvirtinė suma",eur(mokama),"",1],
 ["Galima ketvirtinė suma",eur(galima),""],
 ["Realizuota dalis",Math.round(mokama/galima*100)+"%",""],
 ["Pasiekti rodikliai",reached+" iš "+D.indicators.length,""]
].map(c=>`<div class="card${c[3]?" main":""}"><div class="l">${c[0]}</div><div class="v">${c[1]}</div>${c[2]?`<div class="d">${c[2]}</div>`:""}</div>`).join("");
const nf=v=>Number(v).toLocaleString("lt-LT",{maximumFractionDigits:0});
$("sums").innerHTML=`<tr><th>Rodiklis</th><th>Tikslinė grupė</th><th>Galima suma, €</th><th>Mokėtina suma, €</th></tr>`
 +D.indicators.map(i=>`<tr><td><span class="dot ${i.mokama>0?"ok":"bad"}"></span>${i.name}</td><td class="g">${nf(i.tg)}</td><td class="g">${eur(i.galima)}</td><td class="k">${eur(i.mokama)}</td></tr>`).join("")
 +`<tr class="tot"><td>Iš viso</td><td class="g">–</td><td class="g">${eur(galima)}</td><td>${eur(mokama)}</td></tr>`;

const fmt=(v,d=2)=>v==null?"–":Number(v).toLocaleString("lt-LT",{minimumFractionDigits:Number.isInteger(v)?0:d,maximumFractionDigits:d});
const status=(v,t27,t29,low)=>{
  if(v==null||t27==null)return{c:"na",t:"Nėra duomenų"};
  const ok=(a,t)=>low?a<=t:a>=t;
  if(t29!=null&&ok(v,t29))return{c:"top",t:"Pasiektas 2029 m. tikslas"};
  if(ok(v,t27))return{c:"ok",t:"Pasiektas 2027 m. tikslas"};
  return{c:"bad",t:"Nepasiektas 2027 m. tikslas"};
};
D.indicators.forEach((i,k)=>$("selI").add(new Option(i.name,k)));
function lineChart(i){
  const W=900,H=170,P={l:40,r:180,t:22,b:28},n=D.quarters.length;
  const pv=i.vals.map((t,k)=>({t,k})).filter(p=>p.t!=null);
  const all=pv.map(p=>p.t).concat([i.t27,i.t28,i.t29,i.country].filter(v=>v!=null)),mn=Math.min(...all),mx=Math.max(...all),pad=(mx-mn)*.2||1,lo=mn-pad,hi=mx+pad;
  const x=k=>P.l+k*(W-P.l-P.r)/(n-1),y=t=>P.t+(hi-t)*(H-P.t-P.b)/(hi-lo);
  const pts=pv.map(p=>x(p.k)+","+y(p.t)).join(" "),last=pv[pv.length-1];
  const tl=targetLines(i,y,P,W,H),ry=tl.ry;
  const near=(a,b)=>ry.some(v=>v>a&&v<b);
  const lbl=p=>{const yy=y(p.t),up=yy-11;let ly=up;if(near(up-12,up+4)&&!near(yy+8,yy+24))ly=yy+20;return `<text x="${x(p.k)}" y="${ly}" font-size="12" text-anchor="middle" fill="#1F2937" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${fmt(p.t)}</text>`};
  return `<svg viewBox="0 0 ${W} ${H}">
  ${tl.zone}${tl.lines}
  <polyline points="${pts}" fill="none" stroke="#220083" stroke-width="3"/>
  ${pv.map(p=>`<circle cx="${x(p.k)}" cy="${y(p.t)}" r="${p===last?7:5}" fill="#220083" stroke="#fff" stroke-width="2"/>`).join("")}
  ${pv.map(lbl).join("")}
  ${D.quarters.map((q,k)=>`<text x="${x(k)}" y="${H-8}" font-size="12" text-anchor="middle" fill="#8A87A8">${q}</text>`).join("")}</svg>`;
}
function renderInd(){$("ind").innerHTML=indHTML(D.indicators[$("selI").value])}
function indHTML(i){
  const st=(l,v,c)=>`<div class="stat"><span>${l}</span><b class="${c||""}">${v}</b></div>`;
  let li=i.vals.length-1;while(i.vals[li]==null)li--;
  const cur=i.vals[li],s=status(cur,i.t27,i.t29,i.lower);
  return `<div class="ph"><div><b>${i.name}</b><div class="s">${i.lower?"Mažesnė reikšmė – geresnė":"Didesnė reikšmė – geresnė"}. Suma skaičiuojama pagal paskutinio ketvirčio reikšmę.</div></div><span class="badge ${s.c}">${s.t}</span></div>
    <div class="big">${fmt(cur)}<small>${D.quarters[li]}</small></div>${lineChart(i)}
    <div class="stats">${st("2027 m. tikslas",fmt(i.t27))}${st("2028 m. tikslas",fmt(i.t28))}${st("2029 m. tikslas",fmt(i.t29))}${st("Tikslinė grupė",fmt(i.tg))}<div class="sep"></div>${st("Galima suma",eur(i.galima))}${st("Mokėtina suma",eur(i.mokama),i.mokama>0?"ok":"bad")}</div>`;
}
$("selI").onchange=()=>sync("selI");
const niceStep=r=>{const e=Math.pow(10,Math.floor(Math.log10(r))),f=r/e;return(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*e};
function ticks(max,cnt){if(!(max>0))max=1;const s=niceStep(max/cnt),a=[];for(let v=0;v<=max+s*.999;v+=s)a.push(+v.toFixed(6));return a}
// Tikslų linijos ir zona – vienodai visuose grafikuose:
// 2027 m. tikslas ištisinis (nuo jo priklauso mokėjimas), 2028 ir 2029 m. – brūkšniniai;
// šalies reikšmė pilka taškinė, įstaigos reikšmė (apylinkių grafike) tamsi taškinė;
// žalsva zona – sritis, kurioje 2027 m. tikslas pasiektas (pagal rodiklio kryptį).
function targetLines(t,y,P,W,H){
  // [reikšmė, pavadinimas, brūkšniai, storis, paryškinta, linijos spalva, etiketės spalva]
  const L=[[t.t27,"2027 m. tikslas","",2,1,"#645DC0","#220083"],[t.t28,"2028 m. tikslas","6 5",1.5,0,"#645DC0","#220083"],
    [t.t29,"2029 m. tikslas","6 5",1.5,0,"#645DC0","#220083"],[t.country,"Šalies reikšmė","2 4",1.5,0,"#8A87A8","#6B6890"],
    [t.own,"Įstaigos reikšmė","2 4",1.5,0,"#220083","#220083"]].filter(r=>r[0]!=null);
  const top=P.t,bot=H-P.b,ry=L.map(r=>Math.max(top,Math.min(bot,y(r[0])))),ord=L.map((r,k)=>k).sort((a,b)=>ry[a]-ry[b]),ly={},G=14;
  ord.forEach((k,j)=>{ly[k]=j?Math.max(ry[k],ly[ord[j-1]]+G):ry[k]});
  for(let j=ord.length-1;j>=0;j--){const lim=j===ord.length-1?bot+6:ly[ord[j+1]]-G;if(ly[ord[j]]>lim)ly[ord[j]]=lim}
  // linija tęsiasi už grafiko ir (jei etiketė pastumta) palinksta iki savo etiketės – aišku, kuri etiketė kurios linijos
  const R=W-P.r;
  const lines=L.map((r,k)=>{const st=`stroke="${r[5]}" stroke-width="${r[3]}" ${r[2]?`stroke-dasharray="${r[2]}"`:""}`;
    return `<line x1="${P.l}" x2="${R}" y1="${ry[k]}" y2="${ry[k]}" ${st}/><polyline points="${R},${ry[k]} ${R+8},${ly[k]} ${R+28},${ly[k]}" fill="none" ${st}/>`
      +`<text x="${R+34}" y="${ly[k]+4}" font-size="12" fill="${r[6]}" ${r[4]?'font-weight="700"':""}>${r[1]}: ${fmt(r[0])}</text>`}).join("");
  let zone="";
  if(t.t27!=null){
    const yt=Math.max(top,Math.min(bot,y(t.t27))),zy=t.lower?yt:top,zh=Math.max(0,t.lower?bot-yt:yt-top);
    zone=`<rect x="${P.l}" y="${zy}" width="${W-P.l-P.r}" height="${zh}" fill="#009870" fill-opacity=".05"/>`;
  }
  return {zone,lines,ry};
}
function scatter(i,rows){
  rows=rows.filter(r=>r.v!=null&&r.g!=null);
  if(!rows.length)return `<div class="empty">Pasirinktai prisirašymo įstaigai duomenų nėra.</div>`;
  const f=D.apyl[i.nr][0],t27=f.t27,t28=f.t28,t29=f.t29,own=[...i.vals].reverse().find(v=>v!=null),tg={t27,t28,t29,country:i.country,own,lower:i.lower};
  const W=900,H=360,P={l:60,r:180,t:14,b:52};
  // Y skalė: pavienės išskirtys (>1,5 karto virš 90-ojo procentilio ir tikslų) žymimos ▲ viršuje, kad tikslų linijos nesusispaustų
  const vs=rows.map(r=>r.v).sort((a,b)=>a-b),tmax=Math.max(0,...[t27,t28,t29,i.country,own].filter(v=>v!=null));
  const ytop=Math.min(vs[vs.length-1],Math.max(vs[Math.floor((vs.length-1)*.9)],tmax)*1.5);
  const xt=ticks(Math.max(...rows.map(r=>r.g))*1.05,6),yt=ticks(Math.max(ytop,tmax)*1.08,6);
  const xm=xt[xt.length-1],ym=yt[yt.length-1];
  const x=v=>P.l+v/xm*(W-P.l-P.r),y=v=>H-P.b-v/ym*(H-P.t-P.b);
  // spalvos (violetinės): tamsiausia – pasiekta 2029 m.; vidutinė – pasiekta 2027 m.; šviesi – nepasiekta 2027 m.
  const C={bad:"#C4A8F5",ok:"#645DC0",top:"#220083"};
  const hit=v=>i.lower?v<=t27:v>=t27,hit29=v=>i.lower?v<=t29:v>=t29,col=v=>hit29(v)?C.top:hit(v)?C.ok:C.bad;
  // „0“ ašių susikirtime nerašomas
  const grid=xt.map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="${P.t}" y2="${H-P.b}" stroke="#E6E4F5"/>`+(v?`<text x="${x(v)}" y="${H-P.b+20}" font-size="12" text-anchor="middle" fill="#220083">${nf(v)}</text>`:"")).join("")
   +yt.map(v=>`<line x1="${P.l}" x2="${W-P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#E6E4F5"/>`+(v?`<text x="${P.l-8}" y="${y(v)+4}" font-size="12" text-anchor="end" fill="#220083">${fmt(v)}</text>`:"")).join("");
  const tl=targetLines(tg,y,P,W,H);
  let nY=0;
  const dots=rows.map(r=>{
    const rr=[["Prisirašymo įstaigos kodas",esc(r.pc)],["Rodiklio reikšmė",fmt(r.v)],["Tikslinė grupė",nf(r.g)]],t=tp(`<b>Apylinkė ${esc(r.a)}</b>`,r.v>ym?rr.concat([["","už skalės ribų"]]):rr,col(r.v));
    if(r.v<=ym)return `<circle cx="${x(r.g)}" cy="${y(r.v)}" r="6" fill="${col(r.v)}" stroke="#fff" stroke-width="1" ${t}/>`;
    nY++;const tx=x(r.g),ty=P.t+2;return `<path d="M${tx-6},${ty+10}L${tx+6},${ty+10}L${tx},${ty}Z" fill="${col(r.v)}" ${t}/>`;
  }).join("");
  const note=nY?`<div class="hint">${nY%10===1&&nY%100!==11?`${nY} apylinkės reikšmė viršija skalę (žymima ▲ viršuje).`:`${nY} apylinkių reikšmės viršija skalę (žymimos ▲ viršuje).`}</div>`:"";
  return `<div class="lg"><span><i class="c-top"></i>Pasiektas 2029 m. tikslas</span><span><i class="c-ok"></i>Pasiektas 2027 m. tikslas</span><span><i class="c-bad"></i>Nepasiektas 2027 m. tikslas</span></div><svg viewBox="0 0 ${W} ${H}">${tl.zone}${grid}<line x1="${P.l}" x2="${P.l}" y1="${P.t}" y2="${H-P.b}" stroke="#220083"/><line x1="${P.l}" x2="${W-P.r}" y1="${H-P.b}" y2="${H-P.b}" stroke="#220083"/>
  ${tl.lines}${dots}
  <text x="${(P.l+W-P.r)/2}" y="${H-12}" font-size="14" text-anchor="middle" fill="#220083">Tikslinės grupės asmenų skaičius</text>
  <text transform="translate(16 ${(P.t+H-P.b)/2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#220083">Rodiklio reikšmė</text></svg>${note}`;
}
D.indicators.forEach((i,k)=>{if(D.apyl[i.nr])$("selO").add(new Option(i.name,k))});
function renderOv(){
  const i=D.indicators[$("selO").value];
  if(!i)return;  // įstaiga be apylinkių duomenų – kiti skirtukai turi veikti
  const f=D.apyl[i.nr][0];
  const all=D.apyl[i.nr].map(r=>({a:r.a,pc:r.pc??"–",v:r.val,g:r.tg}));
  // prisirašymo įstaigų filtras: numatyta – visos; pasirinkimas išlaikomas keičiant rodiklį, jei toks kodas yra
  const sp=$("selP"),prev=sp.value||"*",codes=[...new Set(all.map(r=>r.pc))].sort((a,b)=>a.localeCompare(b,"lt",{numeric:true}));
  sp.innerHTML="";sp.add(new Option("Visos įstaigos","*"));codes.forEach(c=>sp.add(new Option(c==="–"?"Nenurodytas":c,c)));
  sp.value=codes.includes(prev)?prev:"*";
  // filtras rodomas tik tada, kai apylinkės priklauso kelioms prisirašymo įstaigoms
  const multi=codes.length>1,fw=sp.parentElement;
  fw.hidden=!multi;fw.parentElement.classList.toggle("two",multi);fw.parentElement.classList.toggle("one",!multi);
  if(!multi)sp.value="*";
  const sel=all.filter(r=>sp.value==="*"||r.pc===sp.value);
  const rows=sel.filter(r=>r.v!=null).sort((p,q)=>i.lower?p.v-q.v:q.v-p.v);
  const bd=v=>{const s=status(v,f.t27,f.t29,i.lower);return `<span class="badge ${s.c}">${s.t}</span>`};
  const cur=[...i.vals].reverse().find(v=>v!=null);
  $("ov").innerHTML=scatter(i,sel)+`<div class="tw narrow"><div class="thead"><h2>Apylinkės pagal rodiklio reikšmę</h2></div><table class="t"><tr><th>Apylinkė</th><th>Prisirašymo įstaigos kodas</th><th>Tikslinė grupė</th><th>Rodiklio reikšmė</th><th>Būsena</th></tr>`
   +`<tr class="tot"><td>Visa įstaiga <small>(${D.quarters[D.quarters.length-1]})</small></td><td class="pi">–</td><td class="g">${nf(i.tg)}</td><td>${fmt(cur)}</td><td>${bd(cur)}</td></tr>`
   +rows.map(r=>`<tr><td>Apylinkė ${esc(r.a)}</td><td class="pi">${esc(r.pc)}</td><td class="g">${nf(r.g)}</td><td class="k">${fmt(r.v)}</td><td>${bd(r.v)}</td></tr>`).join("")+`</table></div>`;
}
D.indicators.forEach((i,k)=>$("selC").add(new Option(i.name,k)));
function countryChart(i){
  const last=[...i.vals].reverse().find(v=>v!=null);
  const pe=(D.peers[i.nr]||[]).filter(p=>p[0]>0&&p[1]!=null);
  const W=900,H=380,P={l:60,r:180,t:20,b:56};
  // abi ašys ribojamos ties 97-uoju procentiliu, kad pavienės išskirtys nesuspaustų grafiko
  const q97=a=>{const s=[...a].sort((p,q)=>p-q);return s.length?s[Math.floor((s.length-1)*.97)]:0};
  const xt=ticks(Math.max(q97(pe.map(p=>p[0])),i.tg??0)*1.05,6),xmax=xt[xt.length-1];
  const x=v=>P.l+Math.min(v,xmax)/xmax*(W-P.l-P.r);
  const yt=ticks(Math.max(q97(pe.map(p=>p[1])),last??0,i.t27,i.t28,i.t29,i.country??0)*1.1,5),ym=yt[yt.length-1];
  const yd=Math.max(0,-Math.floor(Math.log10(yt[1]-yt[0]+1e-12))),yf=v=>v.toLocaleString("lt-LT",{minimumFractionDigits:yd,maximumFractionDigits:yd});
  const y=v=>H-P.b-Math.min(v,ym)/ym*(H-P.t-P.b);
  // „0“ ašių susikirtime nerašomas
  const grid=xt.map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="${P.t}" y2="${H-P.b}" stroke="#E6E4F5"/>`+(v?`<text x="${x(v)}" y="${H-P.b+20}" font-size="12" text-anchor="middle" fill="#220083">${nf(v)}</text>`:"")).join("")
   +yt.map(v=>`<line x1="${P.l}" x2="${W-P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#E6E4F5"/>`+(v?`<text x="${P.l-8}" y="${y(v)+4}" font-size="12" text-anchor="end" fill="#220083">${yf(v)}</text>`:"")).join("");
  const tl=targetLines(i,y,P,W,H),ry=tl.ry;
  // taškai: viduje – apskritimai; už Y ribų – ▲ viršuje; už X ribų – ▶ dešinėje
  const tip=(p,o)=>tp("<b>Kita įstaiga</b>",[["Tikslinė grupė",nf(p[0])],["Rodiklio reikšmė",fmt(p[1])]].concat(o?[["","už skalės ribų"]]:[]),"#B9A3F0");
  const F='fill="#B9A3F0"';
  let nY=0,nX=0;
  const dots=pe.map(p=>{
    const oy=p[1]>ym,ox=p[0]>xmax;
    if(oy)nY++;if(ox)nX++;
    const cx=x(p[0]),cy=y(p[1]);
    if(!oy&&!ox)return `<circle cx="${cx}" cy="${cy}" r="4.5" ${F} fill-opacity=".55" stroke="#fff" stroke-width=".8" ${tip(p)}/>`;
    if(oy){const tx=ox?cx-6:cx,ty=P.t+2;return `<path d="M${tx-5},${ty+8}L${tx+5},${ty+8}L${tx},${ty}Z" ${F} ${tip(p,1)}/>`}
    const tx=W-P.r-2;return `<path d="M${tx-8},${cy-5}L${tx-8},${cy+5}L${tx},${cy}Z" ${F} ${tip(p,1)}/>`;
  }).join("");
  let me="";
  if(last!=null&&i.tg>0){
    // etiketė: dešinėje nuo taško, jei netelpa – kairėje, jei ir ten netelpa – virš taško (ilgi pavadinimai)
    const cx=x(i.tg),cy=y(last),lbl=`${D.name}: ${fmt(last)}`,w=textW(lbl,"700 13px"),clash=v=>v<P.t+12||ry.some(r=>Math.abs(r-(v-4))<10);
    let tx,ty;
    if(cx+14+w<=W-P.r||cx-14-w>=P.l){tx=cx+14+w<=W-P.r?cx+14:cx-14-w;ty=clash(cy-12)?cy+24:cy-12}
    else{tx=Math.max(4,Math.min(cx-w/2,W-P.r-w));ty=clash(cy-18)?cy+30:cy-18}
    me=`<line x1="${cx}" x2="${cx}" y1="${cy}" y2="${H-P.b}" stroke="#220083" stroke-width="1" stroke-dasharray="2 3"/>
    <line x1="${P.l}" x2="${cx}" y1="${cy}" y2="${cy}" stroke="#220083" stroke-width="1" stroke-dasharray="2 3"/>
    <circle cx="${cx}" cy="${cy}" r="8" fill="#220083" stroke="#fff" stroke-width="2.5" ${tp(`<b>${esc(D.name)}</b>`,[["Rodiklio reikšmė",fmt(last)],["Tikslinė grupė",nf(i.tg)]],"#220083")}/>
    <text x="${tx}" y="${ty}" font-size="13" font-weight="700" text-anchor="start" fill="#220083" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${esc(lbl)}</text>`;
  }
  const one=n=>n%10===1&&n%100!==11,gen=n=>one(n)?"įstaigos":"įstaigų";
  const note=[];
  if(nY)note.push(one(nY)?`${nY} įstaigos reikšmė viršija skalę (žymima ▲ viršuje).`:`${nY} įstaigų reikšmės viršija skalę (žymimos ▲ viršuje).`);
  if(nX)note.push(one(nX)?`${nX} įstaigos tikslinė grupė viršija skalę (žymima ▶ dešinėje).`:`${nX} įstaigų tikslinės grupės viršija skalę (žymimos ▶ dešinėje).`);
  return `<div class="lg"><span><i class="c-me"></i>${esc(D.name)}</span><span><i class="c-peer"></i>Kitos įstaigos</span></div>
  <svg viewBox="0 0 ${W} ${H}">${tl.zone}${grid}${dots}${tl.lines}
  <line x1="${P.l}" x2="${P.l}" y1="${P.t}" y2="${H-P.b}" stroke="#220083"/><line x1="${P.l}" x2="${W-P.r}" y1="${H-P.b}" y2="${H-P.b}" stroke="#220083"/>${me}
  <text x="${(P.l+W-P.r)/2}" y="${H-12}" font-size="14" text-anchor="middle" fill="#220083">Tikslinės grupės asmenų skaičius</text>
  <text transform="translate(16 ${(P.t+H-P.b)/2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#220083">Rodiklio reikšmė</text></svg>${note.length?`<div class="hint">${note.join(" ")}</div>`:""}`;
}
function renderCo(){$("co").innerHTML=countryChart(D.indicators[$("selC").value])}
function sync(src){
  const v=$(src).value;
  [["selI",renderInd],["selO",renderOv],["selC",renderCo]].forEach(([id,fn])=>{
    if(id!==src&&[...$(id).options].some(o=>o.value===v))$(id).value=v;
    fn();
  });
}
$("selO").onchange=()=>sync("selO");$("selP").onchange=renderOv;$("selC").onchange=()=>sync("selC");renderOv();renderCo();
renderInd();

// ===== 2 versija =====
// Perjungiklis šone: 1 versija (numatyta) – kaip anksčiau. 2 versija: rodikliai ir palyginimas šalyje – visi iš eilės be pasirinkimo,
// apylinkių skirtuke – visi rodikliai vienoje vietoje (visa įstaiga arba pasirinkta apylinkė), duomenų lentelė su filtrais.
// 2 versija sugeneruojama tik pirmą kartą ją įjungus.
const verBtns=[...document.querySelectorAll("#tabs .ver button")];
let v2done=false;
function setVer(v){
  document.body.classList.toggle("ver2",v==="2");
  verBtns.forEach(b=>{const a=b.dataset.v===v;b.classList.toggle("active",a);b.setAttribute("aria-pressed",a)});
  if(v==="2"&&!v2done){v2done=true;renderV2()}
}
verBtns.forEach(b=>b.onclick=()=>setVer(b.dataset.v));
function renderV2(){
  $("ind2").innerHTML=D.indicators.map(i=>`<div class="panel stack">${indHTML(i)}</div>`).join("");
  $("co2").innerHTML=D.indicators.map(i=>`<div class="panel stack"><div class="ph"><b>${i.name}</b></div>${countryChart(i)}</div>`).join("");
  apyl2();
}

function apyl2(){
  const nf2=v=>v==null?"–":nf(v);
  const reached=(v,t,low)=>t!=null&&v!=null&&(low?v<=t:v>=t),better=(a,b,low)=>low?a<b:a>b;
  const badge=s=>`<span class="badge ${s.c}">${s.t}</span>`;
  const DOT={top:"#220083",ok:"#645DC0",bad:"#C4A8F5"};
  const plural=(n,a,b,c)=>`${n} ${n%10===1&&n%100!==11?a:(n%10>=2&&n%10<=9&&!(n%100>=12&&n%100<=19))?b:c}`;
  const instQ=(()=>{for(const i of D.indicators){let k=i.vals.length-1;while(k>=0&&i.vals[k]==null)k--;if(k>=0)return D.quarters[k]}return""})();

  // apylinkių sąrašas (raktas – apylinkė + prisirašymo įstaigos kodas)
  const key=r=>r.a+"|"+(r.pc??"–");
  const all=new Map();
  Object.values(D.apyl).forEach(rows=>rows.forEach(r=>{if(!all.has(key(r)))all.set(key(r),{a:r.a,pc:r.pc??"–"})}));
  const list=[...all.entries()].sort((p,q)=>String(p[1].pc).localeCompare(String(q[1].pc),"lt",{numeric:true})||String(p[1].a).localeCompare(String(q[1].a),"lt",{numeric:true}));
  if(!list.length){$("ov2").innerHTML=`<div class="empty">Šiai įstaigai apylinkių duomenų nėra.</div>`;return}
  const pcs=[...new Set(list.map(([,v])=>v.pc))],multiPc=pcs.length>1;
  const sel=$("aSel");
  sel.add(new Option("Visos apylinkės (visa įstaiga)",""));
  list.forEach(([k,v])=>sel.add(new Option(`Apylinkė ${v.a}`+(multiPc?` (prisirašymo įstaiga ${v.pc})`:""),k)));

  // rodiklių duomenys (apylinkės su tuščia tiksline grupe (0) neturi prasmingos reikšmės – nelyginamos)
  const IND=D.indicators.map(i=>{
    let li=i.vals.length-1;while(li>=0&&i.vals[li]==null)li--;
    return {i,rows:(D.apyl[i.nr]||[]).filter(r=>r.val!=null&&r.tg>0),inst:li>=0?i.vals[li]:null};
  });
  const rankOf=(it,r)=>[...it.rows].sort((p,q)=>it.i.lower?p.val-q.val:q.val-p.val).findIndex(x=>key(x)===key(r))+1;

  // lentelės filtrai; įjungus filtrą išskleidžiama viskas, kad atrinktos eilutės būtų matomos
  IND.forEach((it,k)=>$("aFI").add(new Option(it.i.name,k)));
  [["top","Pasiektas 2029 m. tikslas"],["ok","Pasiektas 2027 m. tikslas"],["bad","Nepasiektas 2027 m. tikslas"]].forEach(([v,t])=>$("aFS").add(new Option(t,v)));
  pcs.sort((a,b)=>String(a).localeCompare(String(b),"lt",{numeric:true})).forEach(c=>$("aFP").add(new Option(c==="–"?"Nenurodytas":c,c)));
  const opened=new Set(),F=["aFI","aFS","aFP"];
  F.forEach(id=>$(id).onchange=()=>{if(F.some(f=>$(f).value!=="*"))IND.forEach((x,n)=>opened.add(n));else opened.clear();renderTable()});

  sel.onchange=render;
  const step=d=>{const i=sel.selectedIndex+d;if(i>=0&&i<sel.options.length){sel.selectedIndex=i;render()}};
  $("aPrev").onclick=()=>step(-1);$("aNext").onclick=()=>step(1);
  // taško grafike ar apylinkės lentelėje paspaudimas – pasirenkama ta apylinkė
  document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-k]");if(!t||!t.closest("#ov2,#aZc"))return;
    sel.value=t.dataset.k;render();
    if(t.closest("#aTt"))$("aPick").scrollIntoView({behavior:"smooth"})});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&zoomK!=null)closeZoom()});

  const ZOOM_IN=`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 3h5v5M8 17H3v-5M17 3l-6 6M3 17l6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ZOOM_OUT=`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  const cards=a=>a.map(c=>`<div class="card${c[2]?" main":""}"><div class="l">${c[0]}</div><div class="v">${c[1]}</div></div>`).join("");

  // Padidintas rodiklis – atskirame sluoksnyje virš puslapio; uždaroma ×, Esc arba paspaudus šalia
  let zoomK=null,zoomFrom=null,zoomW=1000;

  function render(){
    const k=sel.value;
    $("aPrev").disabled=sel.selectedIndex<=0;$("aNext").disabled=sel.selectedIndex>=sel.options.length-1;
    if(!k){$("aCards").innerHTML="";$("aCards").hidden=true}  // visos įstaigos vaizde KPI kortelių nėra
    else{
      const w=IND.map(x=>({...x,r:x.rows.find(o=>key(o)===k)})).filter(x=>x.r),n=w.length,cnt=f=>w.filter(f).length;
      $("aCards").innerHTML=cards([
        ["Pasiekti 2027 m. tikslai",`${cnt(x=>reached(x.r.val,x.r.t27,x.i.lower))} iš ${n}`,1],
        ["Pasiekti 2029 m. tikslai",`${cnt(x=>reached(x.r.val,x.r.t29,x.i.lower))} iš ${n}`],
        ["Geriau už įstaigos reikšmę",`${cnt(x=>x.inst!=null&&better(x.r.val,x.inst,x.i.lower))} iš ${n}`],
      ]);
      $("aCards").hidden=false;
    }
    $("aLgd").innerHTML=`<span><i class="c-top"></i>Pasiektas 2029 m. tikslas</span><span><i class="c-ok"></i>Pasiektas 2027 m. tikslas</span><span><i class="c-bad"></i>Nepasiektas 2027 m. tikslas</span>`
      +(k?`<span><i class="c-sel"></i>Pasirinkta apylinkė</span>`:"");
    $("aOut").innerHTML=IND.map((it,n)=>card(it,n,false)).join("");
    $("aOut").querySelectorAll(".zb").forEach(b=>b.onclick=()=>openZoom(+b.dataset.n));
    if(zoomK!=null)fillZoom();
    // prisirašymo įstaigos filtras – tik visos įstaigos vaizde ir tik kai kodų keli
    $("aFP").parentElement.hidden=!(multiPc&&!k);
    renderTable();
  }

  const zero=i=>(D.apyl[i.nr]||[]).some(x=>key(x)===sel.value&&!(x.tg>0));
  function card(it,n,big){
    const {i,rows,inst}=it,k=sel.value,r=k?rows.find(x=>key(x)===k):null;
    const btn=big?`<button type="button" class="zb x" id="aZx" aria-label="Sumažinti ir grįžti">${ZOOM_OUT}</button>`
      :rows.length&&(!k||r)?`<button type="button" class="zb" data-n="${n}" aria-label="Padidinti grafiką" title="Padidinti">${ZOOM_IN}</button>`:"";
    if(!k){
      const s=status(inst,i.t27,i.t29,i.lower),ok=rows.filter(x=>reached(x.val,x.t27,i.lower)).length;
      return `<div class="ac${big?" zoomed":""}"><div class="ph"><b>${i.name}</b>${badge(s)}</div>${btn}
        <div class="vr"><span class="v">${fmt(inst)}</span>`+(rows.length?`<span class="m">Apylinkių, pasiekusių 2027 m. tikslą: <b>${ok}</b> iš ${rows.length}</span>`:"")+`</div>`
        +(rows.length?chart(i,rows,null,inst,i,big):`<div class="empty sm">Šiam rodikliui apylinkių duomenų nėra.</div>`)+`</div>`;
    }
    if(!r)return `<div class="ac"><div class="ph"><b>${i.name}</b><span class="badge na">Nėra duomenų</span></div>
      <div class="empty sm">${zero(i)?"Apylinkės tikslinė grupė šiam rodikliui lygi 0, todėl reikšmė nevertinama.":"Šiam rodikliui apylinkės duomenų nėra."} Įstaigos reikšmė: <b>${fmt(inst)}</b>.</div></div>`;
    const s=status(r.val,r.t27,r.t29,i.lower);
    return `<div class="ac${big?" zoomed":""}"><div class="ph"><b>${i.name}</b>${badge(s)}</div>${btn}
      <div class="vr"><span class="v">${fmt(r.val)}</span><span class="m">Tikslinė grupė <b>${nf2(r.tg)}</b><br>Vieta tarp įstaigos apylinkių <b>${rankOf(it,r)}</b> iš ${rows.length}</span></div>
      ${chart(i,rows,r,inst,r,big)}</div>`;
  }

  function openZoom(n){zoomK=n;zoomFrom=document.activeElement;$("aZm").hidden=false;fillZoom();document.body.classList.add("noscroll");if($("aZx"))$("aZx").focus()}
  function fillZoom(){
    zoomW=Math.max(600,Math.min(1120,innerWidth-48)-52);  // lango plotis be vidinių paraščių – grafiko tekstas tokio pat dydžio kaip aplinkinis
    $("aZc").innerHTML=card(IND[zoomK],zoomK,true);
    if(!$("aZx")){closeZoom();return}
    $("aZx").onclick=closeZoom;
  }
  function closeZoom(){zoomK=null;$("aZm").hidden=true;$("aZc").innerHTML="";document.body.classList.remove("noscroll");if(zoomFrom&&document.contains(zoomFrom))zoomFrom.focus()}
  $("aZbg").onclick=closeZoom;
  addEventListener("resize",()=>{if(zoomK!=null)fillZoom()});

  // Grafikas: Y – rodiklio reikšmė, X – tikslinė grupė; horizontalios linijos – tikslai, įstaigos ir šalies reikšmės,
  // linija nueina iki savo etiketės dešinėje. r – pasirinkta apylinkė (null – visos įstaigos vaizdas), T – tikslų šaltinis.
  function chart(i,rows,r,inst,T,big){
    big=big&&innerWidth>=760;
    const W=big?zoomW:560,H=big?Math.round(Math.min(zoomW*.52,Math.max(380,innerHeight-230))):440,P=big?{l:64,r:150,t:16,b:54}:{l:58,r:142,t:16,b:54};
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
    // apylinkių taškai spalvinami pagal pasiektą tikslą; spustelėjus pasirenkama apylinkė
    let nY=0;
    const others=rows.filter(o=>!r||key(o)!==key(r)).map(o=>{const oc=DOT[status(o.val,o.t27,o.t29,i.lower).c]||DOT.bad;
      const t=tp(`Apylinkė ${esc(o.a)}`,[["Rodiklio reikšmė",fmt(o.val)],["Tikslinė grupė",nf2(o.tg)],["","Spustelėkite – rodyti šią apylinkę"]],oc);
      const dk=`data-k="${esc(key(o))}" class="pt"`;
      if(o.val>ym){nY++;const tx=x(o.tg),ty=top+2;return `<path d="M${tx-6},${ty+10}L${tx+6},${ty+10}L${tx},${ty}Z" fill="${oc}" ${dk} ${t}/>`}
      return `<circle cx="${x(o.tg)}" cy="${y(o.val)}" r="${big?7:6}" fill="${oc}" stroke="#fff" stroke-width="1" ${dk} ${t}/>`}).join("");
    let me="";
    if(r){const sx=x(r.tg),sy=y(r.val),lt=fmt(r.val),lw=textW(lt,"700 16px"),right=sx+20+lw<R;
      me=`<circle cx="${sx}" cy="${sy}" r="14" fill="none" stroke="#220083" stroke-width="2"/><circle cx="${sx}" cy="${sy}" r="9" fill="${DOT[status(r.val,r.t27,r.t29,i.lower).c]||DOT.bad}" stroke="#fff" stroke-width="2.5" ${tp(`Apylinkė ${esc(r.a)}`,[["Rodiklio reikšmė",fmt(r.val)],["Tikslinė grupė",nf2(r.tg)]],"#220083")}/>`
      +`<text x="${right?sx+20:sx-20}" y="${sy-12}" font-size="16" font-weight="700" text-anchor="${right?"start":"end"}" fill="#220083" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${lt}</text>`}
    const axes=`<line x1="${P.l}" x2="${P.l}" y1="${top}" y2="${bot}" stroke="#220083"/><line x1="${P.l}" x2="${R}" y1="${bot}" y2="${bot}" stroke="#220083"/>`
      +`<text x="${(P.l+R)/2}" y="${H-8}" font-size="14" text-anchor="middle" fill="#220083">Tikslinės grupės asmenų skaičius</text>`
      +`<text transform="translate(14 ${(top+bot)/2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#220083">Rodiklio reikšmė</text>`;
    const note=nY?`<div class="hint">${nY%10===1&&nY%100!==11?`${nY} apylinkės reikšmė viršija skalę (▲ viršuje).`:`${nY} apylinkių reikšmės viršija skalę (▲ viršuje).`}</div>`:"";
    return `<svg class="ch" viewBox="0 0 ${W} ${H}">${zone}${grid}${axes}${lines}${others}${me}</svg>${note}`;
  }

  // Duomenų lentelė: visos įstaigos vaizde – rodiklių eilutės (visa įstaiga), išskleidžiamos iki apylinkių;
  // pasirinkus apylinkę – tik tos apylinkės eilutės (po vieną kiekvienam rodikliui)
  function renderTable(){
    const k=sel.value,fi=$("aFI").value,fs=$("aFS").value,fp=k?"*":$("aFP").value;
    const pass=(v,t27,t29,low)=>fs==="*"||status(v,t27,t29,low).c===fs;
    const its=IND.map((it,n)=>({...it,n})).filter(it=>fi==="*"||String(it.n)===fi);
    let body="",cnt=0;
    if(!k){
      $("aTh").textContent="Rodiklių duomenys";
      const pcCol=multiPc,ex0=[];
      body=`<tr><th>Rodiklis / apylinkė</th>${pcCol?"<th>Prisirašymo įstaigos kodas</th>":""}<th>Tikslinė grupė</th><th>Rodiklio reikšmė</th><th>Būsena</th></tr>`;
      let shown=0;
      its.forEach(({i,rows,inst,n})=>{
        const rs=rows.filter(r=>(fp==="*"||String(r.pc??"–")===fp)&&pass(r.val,r.t27,r.t29,i.lower)).sort((p,q)=>i.lower?p.val-q.val:q.val-p.val);
        if((fs!=="*"||fp!=="*")&&!rs.length)return;
        shown++;cnt+=rs.length;
        const ex=rs.length>0&&opened.has(n);
        if(rs.length)ex0.push(n);
        const nm=rs.length?`<button type="button" class="ex" data-x="${n}" aria-expanded="${ex}"><span class="ar"></span>${i.name}</button>`:`<span class="ex">${i.name}</span>`;
        body+=`<tr class="aind${ex?" open":""}"><td>${nm}<small>Visa įstaiga · ${instQ} · ${rs.length?plural(rs.length,"apylinkė","apylinkės","apylinkių"):"apylinkių duomenų nėra"}</small></td>${pcCol?`<td class="pi">–</td>`:""}<td class="g">${nf2(i.tg)}</td><td class="k">${fmt(inst)}</td><td>${badge(status(inst,i.t27,i.t29,i.lower))}</td></tr>`;
        if(ex)body+=rs.map(r=>`<tr class="asub"><td><button type="button" class="alink" data-k="${esc(key(r))}">Apylinkė ${esc(r.a)}</button></td>${pcCol?`<td class="pi">${esc(r.pc??"–")}</td>`:""}<td class="g">${nf2(r.tg)}</td><td class="k">${fmt(r.val)}</td><td>${badge(status(r.val,r.t27,r.t29,i.lower))}</td></tr>`).join("");
      });
      if(!shown)body="";
      const allOpen=ex0.length&&ex0.every(n=>opened.has(n));
      $("aTc").innerHTML=ex0.length?`<button type="button" class="exall" id="aExall">${allOpen?"Suskleisti visus":"Išskleisti visus"}</button>`:"";
      if($("aExall"))$("aExall").onclick=()=>{ex0.forEach(n=>allOpen?opened.delete(n):opened.add(n));renderTable()};
      $("aTt").innerHTML=body||`<tr><td class="none">Pagal pasirinktus filtrus duomenų nėra.</td></tr>`;
      $("aTt").querySelectorAll("button.ex").forEach(b=>b.onclick=()=>{const n=+b.dataset.x;opened.has(n)?opened.delete(n):opened.add(n);renderTable();const f=$("aTt").querySelector(`button.ex[data-x="${n}"]`);if(f)f.focus()});
      return;
    }
    $("aTh").textContent=sel.options[sel.selectedIndex].text+" – duomenys";
    const rs=its.map(it=>({...it,r:it.rows.find(o=>key(o)===k)})).filter(x=>x.r&&pass(x.r.val,x.r.t27,x.r.t29,x.i.lower));
    cnt=rs.length;
    if(cnt)body=`<tr><th>Rodiklis</th><th>Tikslinė grupė</th><th>Apylinkės reikšmė</th><th>Įstaigos reikšmė</th><th>Šalies reikšmė</th><th>Vieta</th><th>Būsena</th></tr>`
      +rs.map(x=>`<tr><td>${x.i.name}</td><td class="g">${nf2(x.r.tg)}</td><td class="k">${fmt(x.r.val)}</td><td>${fmt(x.inst)}</td><td>${fmt(x.i.country)}</td><td class="g">${rankOf(x,x.r)} iš ${x.rows.length}</td><td>${badge(status(x.r.val,x.r.t27,x.r.t29,x.i.lower))}</td></tr>`).join("");
    $("aTc").textContent=cnt?plural(cnt,"eilutė","eilutės","eilučių"):"";
    $("aTt").innerHTML=body||`<tr><td class="none">Pagal pasirinktus filtrus duomenų nėra.</td></tr>`;
  }

  render();
}
