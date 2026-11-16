"use strict";
const D=JSON.parse(document.getElementById("data").textContent);
const $=id=>document.getElementById(id);
const tabs=[...document.querySelectorAll("#tabs .seg button")];
// Adresas po „#“: skirtukas ir, jei pasirinkta ne numatytoji reikšmė, rodiklis (jo numeris) bei apylinkių grafikas.
// Tokią nuorodą galima persiųsti – atsidarys tas pats vaizdas. Ši adreso dalis serveriui nesiunčiama.
const GRAF=["dydis","reitingas"];
const [h0,h1]=location.hash.slice(1).split("?"),hp=new URLSearchParams(h1||"");
let rod=(k=>k>=0?String(k):"*")(D.indicators.findIndex(i=>String(i.nr)===hp.get("rodiklis")));
let graf=GRAF.includes(hp.get("grafikas"))?hp.get("grafikas"):GRAF[0];
function adresas(){
  const id=(tabs.find(b=>b.classList.contains("active"))||tabs[0]).dataset.p,q=new URLSearchParams();
  if(rod!=="*")q.set("rodiklis",D.indicators[rod].nr);
  if(graf!==GRAF[0])q.set("grafikas",graf);
  try{history.replaceState(null,"","#"+id+(q+""?"?"+q:""))}catch(e){/* įterptame rėmelyje adreso keisti neleidžiama – vaizdas vis tiek perjungiamas */}
}
function show(id){
  if(!tabs.some(b=>b.dataset.p===id))id=tabs[0].dataset.p;
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  // aktyvus skirtukas pasiekiamas Tab klavišu, kiti – rodyklėmis (įprastas skirtukų valdymas klaviatūra)
  tabs.forEach(b=>{const a=b.dataset.p===id;b.classList.toggle("active",a);b.setAttribute("aria-selected",a);b.tabIndex=a?0:-1});
  adresas();
}
tabs.forEach(b=>b.onclick=()=>{show(b.dataset.p);window.scrollTo({top:0})});
document.addEventListener("keydown",e=>{
  // rodyklės neperjungia skirtukų, kai jos reikalingos kitam valdikliui (sąrašui, padidintam grafikui)
  // arba spaudžiamos su Alt/Ctrl (naršyklės „atgal“ ir pan.)
  if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey||e.defaultPrevented)return;
  const t=e.target;
  if(t.closest&&t.closest("select,input,textarea,[role=dialog]"))return;
  const k=tabs.findIndex(b=>b.classList.contains("active")),d=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;
  if(!d||!tabs[k+d])return;
  const onTab=tabs.includes(document.activeElement);
  show(tabs[k+d].dataset.p);
  if(onTab)tabs[k+d].focus();
});
show(h0);addEventListener("load",()=>window.scrollTo(0,0));
const eur=v=>Number(v).toLocaleString("lt-LT",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
$("title").textContent=D.name;
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
// paskutinė turima rodiklio reikšmė ir jos ketvirčio numeris (-1, jei reikšmių nėra)
const lastIdx=vals=>{let k=vals.length-1;while(k>=0&&vals[k]==null)k--;return k};
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
const vertinami=D.indicators.filter(i=>i.tg>0).length;  // rodikliai be tikslinės grupės nevertinami
const dotC=i=>i.tg>0?(i.mokama>0?"ok":"bad"):"na";
$("cards").innerHTML=[
 ["Mokėtina ketvirtinė suma",eur(mokama),"",1],
 ["Galima ketvirtinė suma",eur(galima),""],
 ["Realizuota dalis",galima>0?Math.round(mokama/galima*100)+"%":"–",""],  // be tikslinės grupės galima suma 0 – dalies nėra
 ["Pasiekti rodikliai",reached+" iš "+vertinami,""]
].map(c=>`<div class="card${c[3]?" main":""}"><div class="l">${c[0]}</div><div class="v">${c[1]}</div>${c[2]?`<div class="d">${c[2]}</div>`:""}</div>`).join("");
const nf=v=>v==null?"–":Number(v).toLocaleString("lt-LT",{maximumFractionDigits:0});
$("sums").innerHTML=`<tr><th scope="col">Rodiklis</th><th scope="col">Tikslinė grupė</th><th scope="col">Galima suma, €</th><th scope="col">Mokėtina suma, €</th></tr>`
 +D.indicators.map(i=>`<tr><td><span class="dot ${dotC(i)}"></span>${esc(i.name)}</td><td class="g">${nf(i.tg)}</td><td class="g">${eur(i.galima)}</td><td class="k">${eur(i.mokama)}</td></tr>`).join("")
 +`<tr class="tot"><td>Iš viso</td><td class="g">–</td><td class="g">${eur(galima)}</td><td>${eur(mokama)}</td></tr>`;

const fmt=(v,d=2)=>v==null?"–":Number(v).toLocaleString("lt-LT",{minimumFractionDigits:Number.isInteger(v)?0:d,maximumFractionDigits:d});
const status=(v,t27,t29,low)=>{
  if(v==null||t27==null)return{c:"na",t:"Nėra duomenų"};
  const ok=(a,t)=>low?a<=t:a>=t;
  if(t29!=null&&ok(v,t29))return{c:"top",t:"Pasiektas 2029 m. tikslas"};
  if(ok(v,t27))return{c:"ok",t:"Pasiektas 2027 m. tikslas"};
  return{c:"bad",t:"Nepasiektas 2027 m. tikslas"};
};
// Įstaigos rodiklio būsena. Be tikslinės grupės (0 arba nėra) rodiklis nevertinamas ir už jį nemokama,
// todėl rodoma „Nėra duomenų“, o ne „pasiektas“ – taip pat kaip piniginėje išraiškoje.
const iStatus=(i,v)=>i.tg>0?status(v,i.t27,i.t29,i.lower):{c:"na",t:"Nėra duomenų"};
// Rodiklio reikšmės rašymas. Dalys (i.pct) rašomos procentais su vienu skaičiumi po kablelio.
// Jei suapvalinta reikšmė sutaptų su tikslu, kurio ji nepasiekė (55,96 % ir 56,0 %), rodomi du skaičiai po kablelio.
const pct=(x,d)=>x.toLocaleString("lt-LT",{minimumFractionDigits:d,maximumFractionDigits:d})+" %";
const fv=(i,v)=>{
  if(v==null)return"–";
  if(!i.pct)return fmt(v);
  const x=v*100,r1=a=>a.toFixed(1);
  return pct(x,[i.t27,i.t28,i.t29].some(t=>t!=null&&t!==v&&r1(t*100)===r1(x))?2:1);
};
// dalies negali būti daugiau nei 100 %, todėl tokiems rodikliams Y ašis baigiasi ties 100 %
const capY=(i,a)=>{const b=i.pct?a.filter(v=>v<=1+1e-9):a;return b.length>1?b:a};
// Apylinkių taškų spalvos grafikuose pagal pasiektą tikslą – violetiniai atspalviai nuo šviesiausio (nepasiektas 2027 m.)
// iki tamsiausio (pasiektas 2029 m.); tos pačios reikšmės legendoje (app.css: .c-bad, .c-ok, .c-top)
const ST_C={bad:"#C4A8F5",ok:"#645DC0",top:"#220083"};
// šviesiausias taškas baltame fone blankus, todėl jam – tamsesnis kontūras; kitiems – baltas
const dotS=c=>`stroke="${c===ST_C.bad?ST_C.ok:"#fff"}" stroke-width="1"`;
// ašių žymos: dalims – procentai be nereikalingų nulių
const ft=(i,v)=>i.pct?(+(v*100).toFixed(4)).toLocaleString("lt-LT",{maximumFractionDigits:2})+" %":fmt(v);
function lineChart(i){
  const W=900,H=170,P={l:40,r:180,t:22,b:28},n=D.quarters.length;
  const pv=i.vals.map((t,k)=>({t,k})).filter(p=>p.t!=null);
  const all=pv.map(p=>p.t).concat([i.t27,i.t28,i.t29,i.country].filter(v=>v!=null));
  if(!all.length)return `<div class="empty">Šiam rodikliui duomenų nėra.</div>`;
  const mn=Math.min(...all),mx=Math.max(...all),pad=(mx-mn)*.2||1,lo=mn-pad,hi=mx+pad;
  const x=k=>n>1?P.l+k*(W-P.l-P.r)/(n-1):(P.l+W-P.r)/2,y=t=>P.t+(hi-t)*(H-P.t-P.b)/(hi-lo);
  const pts=pv.map(p=>x(p.k)+","+y(p.t)).join(" "),last=pv[pv.length-1];
  const tl=targetLines(i,y,P,W,H),ry=tl.ry;
  const near=(a,b)=>ry.some(v=>v>a&&v<b);
  const lbl=p=>{const yy=y(p.t),up=yy-11;let ly=up;if(near(up-12,up+4)&&!near(yy+8,yy+24))ly=yy+20;return `<text x="${x(p.k)}" y="${ly}" font-size="12" text-anchor="middle" fill="#1F2937" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${fv(i,p.t)}</text>`};
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(i.name)}: reikšmės pagal ketvirčius ir tikslai">
  ${tl.zone}${tl.lines}
  <polyline points="${pts}" fill="none" stroke="#220083" stroke-width="3"/>
  ${pv.map(p=>`<circle cx="${x(p.k)}" cy="${y(p.t)}" r="${p===last?7:5}" fill="#220083" stroke="#fff" stroke-width="2"/>`).join("")}
  ${pv.map(lbl).join("")}
  ${D.quarters.map((q,k)=>`<text x="${x(k)}" y="${H-8}" font-size="12" text-anchor="middle" fill="#8A87A8">${esc(q)}</text>`).join("")}</svg>`;
}
function indHTML(i){
  const st=(l,v,c)=>`<div class="stat"><span>${l}</span><b class="${c||""}">${v}</b></div>`;
  // jei rodiklis neturi nė vienos reikšmės, rodoma „–“ (anksčiau paieška čia nesibaigdavo ir puslapis užstrigdavo)
  // be tikslinės grupės rodiklis nevertinamas, todėl vietoj reikšmės (0) rodoma „–“
  const li=lastIdx(i.vals),cur=li>=0&&i.tg>0?i.vals[li]:null,s=iStatus(i,cur);
  return `<div class="ph"><div><b>${esc(i.name)}</b><div class="s">Siektina reikšmė – ${i.lower?"mažesnė":"didesnė"}. Reikšmė skaičiuojama už keturis ketvirčius, kurie baigiasi nurodytu ketvirčiu.${i.unit?` Vienetas – ${esc(i.unit)}.`:""}</div></div><span class="badge ${s.c}">${s.t}</span></div>
    <div class="big">${fv(i,cur)}<small>${cur!=null?esc(D.quarters[li]):""}</small></div>${lineChart(i)}
    <div class="stats">${st("2027 m. tikslas",fv(i,i.t27))}${st("2028 m. tikslas",fv(i,i.t28))}${st("2029 m. tikslas",fv(i,i.t29))}${st("Tikslinė grupė",fmt(i.tg))}<div class="sep"></div>${st("Galima suma",eur(i.galima))}${st("Mokėtina suma",eur(i.mokama),i.tg>0?(i.mokama>0?"ok":"bad"):"")}</div>`;
}
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
      +`<text x="${R+34}" y="${ly[k]+4}" font-size="12" fill="${r[6]}" ${r[4]?'font-weight="700"':""}>${r[1]}: ${fv(t,r[0])}</text>`}).join("");
  let zone="";
  if(t.t27!=null){
    const yt=Math.max(top,Math.min(bot,y(t.t27))),zy=t.lower?yt:top,zh=Math.max(0,t.lower?bot-yt:yt-top);
    zone=`<rect x="${P.l}" y="${zy}" width="${W-P.l-P.r}" height="${zh}" fill="#009870" fill-opacity=".05"/>`;
  }
  return {zone,lines,ry};
}
function countryChart(i){
  const last=i.vals[lastIdx(i.vals)];
  const pe=(D.peers[i.nr]||[]).filter(p=>p[0]>0&&p[1]!=null);
  const W=900,H=380,P={l:60,r:180,t:20,b:56};
  // abi ašys ribojamos ties 97-uoju procentiliu, kad pavienės išskirtys nesuspaustų grafiko
  const q97=a=>{const s=[...a].sort((p,q)=>p-q);return s.length?s[Math.floor((s.length-1)*.97)]:0};
  const xt=ticks(Math.max(q97(pe.map(p=>p[0])),i.tg??0)*1.05,6),xmax=xt[xt.length-1];
  const x=v=>P.l+Math.min(v,xmax)/xmax*(W-P.l-P.r);
  const yt=capY(i,ticks(Math.max(q97(pe.map(p=>p[1])),last??0,i.t27,i.t28,i.t29,i.country??0)*1.1,5)),ym=yt[yt.length-1];
  const yd=Math.max(0,-Math.floor(Math.log10(yt[1]-yt[0]+1e-12))),yf=v=>v.toLocaleString("lt-LT",{minimumFractionDigits:yd,maximumFractionDigits:yd});
  const y=v=>H-P.b-Math.min(v,ym)/ym*(H-P.t-P.b);
  // „0“ ašių susikirtime nerašomas
  const grid=xt.map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="${P.t}" y2="${H-P.b}" stroke="#E6E4F5"/>`+(v?`<text x="${x(v)}" y="${H-P.b+20}" font-size="12" text-anchor="middle" fill="#220083">${nf(v)}</text>`:"")).join("")
   +yt.map(v=>`<line x1="${P.l}" x2="${W-P.r}" y1="${y(v)}" y2="${y(v)}" stroke="#E6E4F5"/>`+(v?`<text x="${P.l-8}" y="${y(v)+4}" font-size="12" text-anchor="end" fill="#220083">${i.pct?ft(i,v):yf(v)}</text>`:"")).join("");
  const tl=targetLines(i,y,P,W,H),ry=tl.ry;
  // taškai: viduje – apskritimai; už Y ribų – ▲ viršuje; už X ribų – ▶ dešinėje
  const tip=(p,o)=>tp("<b>Kita įstaiga</b>",[["Tikslinė grupė",nf(p[0])],["Rodiklio reikšmė",fv(i,p[1])]].concat(o?[["","už skalės ribų"]]:[]),"#B9A3F0");
  const F='fill="#B9A3F0"';
  const dots=pe.map(p=>{
    const oy=p[1]>ym,ox=p[0]>xmax;
    const cx=x(p[0]),cy=y(p[1]);
    if(!oy&&!ox)return `<circle cx="${cx}" cy="${cy}" r="4.5" ${F} fill-opacity=".55" stroke="#fff" stroke-width=".8" ${tip(p)}/>`;
    if(oy){const tx=ox?cx-6:cx,ty=P.t+2;return `<path d="M${tx-5},${ty+8}L${tx+5},${ty+8}L${tx},${ty}Z" ${F} ${tip(p,1)}/>`}
    const tx=W-P.r-2;return `<path d="M${tx-8},${cy-5}L${tx-8},${cy+5}L${tx},${cy}Z" ${F} ${tip(p,1)}/>`;
  }).join("");
  let me="";
  if(last!=null&&i.tg>0){
    // etiketė: dešinėje nuo taško, jei netelpa – kairėje, jei ir ten netelpa – virš taško (ilgi pavadinimai)
    const cx=x(i.tg),cy=y(last),lbl=`${D.name}: ${fv(i,last)}`,w=textW(lbl,"700 13px"),clash=v=>v<P.t+12||ry.some(r=>Math.abs(r-(v-4))<10);
    let tx,ty;
    if(cx+14+w<=W-P.r||cx-14-w>=P.l){tx=cx+14+w<=W-P.r?cx+14:cx-14-w;ty=clash(cy-12)?cy+24:cy-12}
    else{tx=Math.max(4,Math.min(cx-w/2,W-P.r-w));ty=clash(cy-18)?cy+30:cy-18}
    me=`<line x1="${cx}" x2="${cx}" y1="${cy}" y2="${H-P.b}" stroke="#220083" stroke-width="1" stroke-dasharray="2 3"/>
    <line x1="${P.l}" x2="${cx}" y1="${cy}" y2="${cy}" stroke="#220083" stroke-width="1" stroke-dasharray="2 3"/>
    <circle cx="${cx}" cy="${cy}" r="8" fill="#220083" stroke="#fff" stroke-width="2.5" ${tp(`<b>${esc(D.name)}</b>`,[["Rodiklio reikšmė",fv(i,last)],["Tikslinė grupė",nf(i.tg)]],"#220083")}/>
    <text x="${tx}" y="${ty}" font-size="13" font-weight="700" text-anchor="start" fill="#220083" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${esc(lbl)}</text>`;
  }
  return `<div class="lg"><span><i class="c-me"></i>${esc(D.name)}</span><span><i class="c-peer"></i>Kitos įstaigos</span></div>
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(i.name)}: įstaigos vieta tarp kitų įstaigų">${tl.zone}${grid}${dots}${tl.lines}
  <line x1="${P.l}" x2="${P.l}" y1="${P.t}" y2="${H-P.b}" stroke="#220083"/><line x1="${P.l}" x2="${W-P.r}" y1="${H-P.b}" y2="${H-P.b}" stroke="#220083"/>${me}
  <text x="${(P.l+W-P.r)/2}" y="${H-12}" font-size="14" text-anchor="middle" fill="#220083">Tikslinės grupės asmenų skaičius</text>
  <text transform="translate(16 ${(P.t+H-P.b)/2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#220083">Rodiklio reikšmė</text></svg>`;
}
// ===== Rodiklio filtras =====
// Bendras skirtukams „Rodikliai“, „Apylinkių palyginimas“ ir „Palyginimas šalyje“: pasirinkimas viename skirtuke galioja ir kituose.
// Parinktys imamos iš duomenų; numatyta – visi rodikliai. Rodiklio kortelės pažymėtos data-rod (rodiklio eilės numeris).
const rodSel=[...document.querySelectorAll("select.rod")];
let poFiltro=()=>{};
const rodOn=n=>rod==="*"||String(n)===rod;
function rodRodyk(){
  document.querySelectorAll("[data-rod]").forEach(e=>{e.hidden=!rodOn(e.dataset.rod)});
  const g=$("aOut");if(g)g.classList.toggle("one",rod!=="*");  // įstaigoje be apylinkių šio tinklelio nėra
}
rodSel.forEach(s=>{
  s.add(new Option("Visi rodikliai","*"));
  D.indicators.forEach((i,k)=>s.add(new Option(i.name,k)));
  s.value=rod;
  s.onchange=()=>{rod=s.value;rodSel.forEach(o=>{o.value=rod});rodRodyk();poFiltro();adresas()};
});
$("ind").innerHTML=D.indicators.map((i,n)=>`<div class="panel" data-rod="${n}">${indHTML(i)}</div>`).join("");
$("co").innerHTML=D.indicators.map((i,n)=>`<div class="panel" data-rod="${n}"><div class="ph"><b>${esc(i.name)}</b></div>${countryChart(i)}</div>`).join("");

// ===== Apylinkių palyginimas =====
// Du grafikai, perjungiami mygtukais: „Pagal tikslinės grupės dydį“ (taškinė diagrama, numatytasis) ir „Apylinkių reitingas“.
// Apylinkės su tuščia tiksline grupe (0) neturi prasmingos reikšmės – nelyginamos.
const pasiekta=(v,t,low)=>t!=null&&v!=null&&(low?v<=t:v>=t);
const raktas=r=>r.a+"|"+(r.pc??"–");  // apylinkė + prisirašymo įstaigos kodas
const IND=D.indicators.map(i=>{
  const li=lastIdx(i.vals),rows=(D.apyl[i.nr]||[]).filter(r=>r.val!=null&&r.tg>0),kiek=t=>rows.filter(r=>pasiekta(r.val,r[t],i.lower)).length;
  return {i,rows,inst:li>=0&&i.tg>0?i.vals[li]:null,ok27:kiek("t27"),ok29:kiek("t29")};
});
const apylM=it=>`Apylinkių, pasiekusių 2027 m. tikslą: <b>${it.ok27}</b> iš ${it.rows.length}<br>Apylinkių, pasiekusių 2029 m. tikslą: <b>${it.ok29}</b> iš ${it.rows.length}`;
const LEG=`<span><i class="c-top"></i>Pasiektas 2029 m. tikslas</span><span><i class="c-ok"></i>Pasiektas 2027 m. tikslas</span><span><i class="c-bad"></i>Nepasiektas 2027 m. tikslas</span>`;
const swB=[...document.querySelectorAll("#ovSw button")];
function rodykGrafika(g){
  graf=g;
  swB.forEach(o=>{const a=o.dataset.g===g;o.classList.toggle("active",a);o.setAttribute("aria-pressed",a)});
  $("ovDydis").hidden=g!=="dydis";$("ovReit").hidden=g!=="reitingas";
}
swB.forEach(b=>b.onclick=()=>{rodykGrafika(b.dataset.g);adresas()});
if(Object.keys(D.apyl).length){apylTaskai();apylReitingas();rodykGrafika(graf)}
else{graf=GRAF[0];$("ovBar").hidden=true;$("ovDydis").innerHTML=`<div class="empty">Šiai įstaigai apylinkių duomenų nėra.</div>`}
rodRodyk();adresas();

// Grafikas „Pagal tikslinės grupės dydį“: visi rodikliai vienoje vietoje (visa įstaiga arba pasirinkta apylinkė) ir duomenų lentelė.
function apylTaskai(){
  const better=(a,b,low)=>low?a<b:a>b;
  const badge=s=>`<span class="badge ${s.c}">${s.t}</span>`;
  const plural=(n,a,b,c)=>`${n} ${n%10===1&&n%100!==11?a:(n%10>=2&&n%10<=9&&!(n%100>=12&&n%100<=19))?b:c}`;
  const instQ=(()=>{for(const i of D.indicators){const k=lastIdx(i.vals);if(k>=0)return esc(D.quarters[k])}return""})();

  // apylinkių sąrašas
  const all=new Map();
  Object.values(D.apyl).forEach(rows=>rows.forEach(r=>{if(!all.has(raktas(r)))all.set(raktas(r),{a:r.a,pc:r.pc??"–"})}));
  const list=[...all.entries()].sort((p,q)=>String(p[1].pc).localeCompare(String(q[1].pc),"lt",{numeric:true})||String(p[1].a).localeCompare(String(q[1].a),"lt",{numeric:true}));
  const pcs=[...new Set(list.map(([,v])=>v.pc))],multiPc=pcs.length>1;
  const sel=$("aSel");
  sel.add(new Option("Visos apylinkės (visa įstaiga)",""));
  list.forEach(([k,v])=>sel.add(new Option(`Apylinkė ${v.a}`+(multiPc?` (prisirašymo įstaiga ${v.pc})`:""),k)));

  const rankOf=(it,r)=>[...it.rows].sort((p,q)=>it.i.lower?p.val-q.val:q.val-p.val).findIndex(x=>raktas(x)===raktas(r))+1;

  // lentelės filtrai; įjungus filtrą išskleidžiama viskas, kad atrinktos eilutės būtų matomos
  [["top","Pasiektas 2029 m. tikslas"],["ok","Pasiektas 2027 m. tikslas"],["bad","Nepasiektas 2027 m. tikslas"]].forEach(([v,t])=>$("aFS").add(new Option(t,v)));
  pcs.sort((a,b)=>String(a).localeCompare(String(b),"lt",{numeric:true})).forEach(c=>$("aFP").add(new Option(c==="–"?"Nenurodytas":c,c)));
  const opened=new Set(),F=["aFS","aFP"];
  F.forEach(id=>$(id).onchange=()=>{if(F.some(f=>$(f).value!=="*"))IND.forEach((x,n)=>opened.add(n));else opened.clear();renderTable()});

  sel.onchange=render;
  const step=d=>{const i=sel.selectedIndex+d;if(i>=0&&i<sel.options.length){sel.selectedIndex=i;render()}};
  $("aPrev").onclick=()=>step(-1);$("aNext").onclick=()=>step(1);
  // taško grafike ar apylinkės lentelėje paspaudimas – pasirenkama ta apylinkė
  document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-k]");if(!t||!t.closest("#ovDydis,#aZc"))return;
    sel.value=t.dataset.k;render();
    if(t.closest("#aTt"))$("aPick").scrollIntoView({behavior:"smooth"})});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&zoomK!=null)closeZoom()});

  const ZOOM_IN=`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12 3h5v5M8 17H3v-5M17 3l-6 6M3 17l6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const ZOOM_OUT=`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  const cards=a=>a.map(c=>`<div class="card${c[2]?" main":""}"><div class="l">${c[0]}</div><div class="v">${c[1]}</div></div>`).join("");

  // Padidintas rodiklis – atskirame sluoksnyje virš puslapio; uždaroma ×, Esc arba paspaudus šalia
  // kol langas atidarytas, puslapis po juo neaktyvus (inert) – Tab klavišas lieka lange
  let zoomK=null,zoomFrom=null,zoomW=1000;const wrapEl=document.querySelector(".wrap");

  function render(){
    const k=sel.value;
    $("aPrev").disabled=sel.selectedIndex<=0;$("aNext").disabled=sel.selectedIndex>=sel.options.length-1;
    if(!k){$("aCards").innerHTML="";$("aCards").hidden=true}  // visos įstaigos vaizde KPI kortelių nėra
    else{
      const w=IND.map(x=>({...x,r:x.rows.find(o=>raktas(o)===k)})).filter(x=>x.r),n=w.length,cnt=f=>w.filter(f).length;
      $("aCards").innerHTML=cards([
        ["Pasiekti 2027 m. tikslai",`${cnt(x=>pasiekta(x.r.val,x.r.t27,x.i.lower))} iš ${n}`,1],
        ["Pasiekti 2029 m. tikslai",`${cnt(x=>pasiekta(x.r.val,x.r.t29,x.i.lower))} iš ${n}`],
        ["Geriau už įstaigos reikšmę",`${cnt(x=>x.inst!=null&&better(x.r.val,x.inst,x.i.lower))} iš ${n}`],
      ]);
      $("aCards").hidden=false;
    }
    $("aLgd").innerHTML=LEG+(k?`<span><i class="c-sel"></i>Pasirinkta apylinkė</span>`:"");
    $("aOut").innerHTML=IND.map((it,n)=>card(it,n,false)).join("");
    $("aOut").querySelectorAll(".zb").forEach(b=>b.onclick=()=>openZoom(+b.dataset.n));
    rodRodyk();
    if(zoomK!=null)fillZoom();
    // prisirašymo įstaigos filtras – tik visos įstaigos vaizde ir tik kai kodų keli
    $("aFP").parentElement.hidden=!(multiPc&&!k);
    renderTable();
  }

  const zero=i=>(D.apyl[i.nr]||[]).some(x=>raktas(x)===sel.value&&!(x.tg>0));
  function card(it,n,big){
    const {i,rows,inst}=it,k=sel.value,r=k?rows.find(x=>raktas(x)===k):null;
    const btn=big?`<button type="button" class="zb x" id="aZx" aria-label="Sumažinti ir grįžti">${ZOOM_OUT}</button>`
      :rows.length&&(!k||r)?`<button type="button" class="zb" data-n="${n}" aria-label="Padidinti grafiką" title="Padidinti">${ZOOM_IN}</button>`:"";
    if(!k){
      const s=iStatus(i,inst);
      return `<div class="ac"${big?"":` data-rod="${n}"`}><div class="ph"><b>${esc(i.name)}</b>${badge(s)}</div>${btn}
        <div class="vr"><span class="v">${fv(i,inst)}</span>`+(rows.length?`<span class="m">${apylM(it)}</span>`:"")+`</div>`
        +(rows.length?chart(i,rows,null,inst,i,big):`<div class="empty sm">Šiam rodikliui apylinkių duomenų nėra.</div>`)+`</div>`;
    }
    if(!r)return `<div class="ac" data-rod="${n}"><div class="ph"><b>${esc(i.name)}</b><span class="badge na">Nėra duomenų</span></div>
      <div class="empty sm">${zero(i)?"Apylinkės tikslinė grupė šiam rodikliui lygi 0, todėl reikšmė nevertinama.":"Šiam rodikliui apylinkės duomenų nėra."} Įstaigos reikšmė: <b>${fv(i,inst)}</b>.</div></div>`;
    const s=status(r.val,r.t27,r.t29,i.lower);
    return `<div class="ac"${big?"":` data-rod="${n}"`}><div class="ph"><b>${esc(i.name)}</b>${badge(s)}</div>${btn}
      <div class="vr"><span class="v">${fv(i,r.val)}</span><span class="m">Tikslinė grupė <b>${nf(r.tg)}</b><br>Vieta tarp įstaigos apylinkių <b>${rankOf(it,r)}</b> iš ${rows.length}</span></div>
      ${chart(i,rows,r,inst,r,big)}</div>`;
  }

  function openZoom(n){zoomK=n;zoomFrom=document.activeElement;$("aZm").hidden=false;fillZoom();document.body.classList.add("noscroll");wrapEl.inert=true;if($("aZx"))$("aZx").focus()}
  function fillZoom(){
    zoomW=Math.max(600,Math.min(1120,innerWidth-48)-52);  // lango plotis be vidinių paraščių – grafiko tekstas tokio pat dydžio kaip aplinkinis
    $("aZc").innerHTML=card(IND[zoomK],zoomK,true);
    if(!$("aZx")){closeZoom();return}
    $("aZx").onclick=closeZoom;
  }
  function closeZoom(){zoomK=null;$("aZm").hidden=true;$("aZc").innerHTML="";document.body.classList.remove("noscroll");wrapEl.inert=false;if(zoomFrom&&document.contains(zoomFrom))zoomFrom.focus()}
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
    const yt=capY(i,ticks(Math.max(need,Math.min(vs[vs.length-1],Math.max(q90,need)*1.5))*1.08,6)),ym=yt[yt.length-1];
    const xt=ticks(Math.max(...rows.map(o=>o.tg))*1.05,big?8:4),xm=xt[xt.length-1];
    const x=v=>P.l+Math.min(v,xm)/xm*(W-P.l-P.r),y=v=>H-P.b-Math.min(v,ym)/ym*(H-P.t-P.b),R=W-P.r,top=P.t,bot=H-P.b;
    let zone="";
    if(T.t27!=null){const yt27=y(T.t27),zy=i.lower?yt27:top,zh=i.lower?bot-yt27:yt27-top;
      zone=`<rect x="${P.l}" y="${zy}" width="${R-P.l}" height="${Math.max(0,zh)}" fill="#009870" fill-opacity=".05"/>`}
    // „0“ ašių susikirtime nerašomas
    const grid=xt.map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="${top}" y2="${bot}" stroke="#E6E4F5"/>`+(v?`<text x="${x(v)}" y="${bot+20}" font-size="14" text-anchor="middle" fill="#220083">${nf(v)}</text>`:"")).join("")
      +yt.map(v=>`<line x1="${P.l}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="#E6E4F5"/>`+(v?`<text x="${P.l-8}" y="${y(v)+4}" font-size="14" text-anchor="end" fill="#220083">${ft(i,v)}</text>`:"")).join("");
    // etiketės be persidengimo: rūšiuojamos pagal aukštį, stumiamos per 17 px
    const ry=L.map(f=>y(f[0])),ord=L.map((f,k)=>k).sort((a,b)=>ry[a]-ry[b]),ly={},G=17;
    ord.forEach((k,j)=>{ly[k]=j?Math.max(ry[k],ly[ord[j-1]]+G):ry[k]});
    for(let j=ord.length-1;j>=0;j--){const lim=j===ord.length-1?bot+6:ly[ord[j+1]]-G;if(ly[ord[j]]>lim)ly[ord[j]]=lim}
    const lines=L.map((f,k)=>{const st=`stroke="${f[5]}" stroke-width="${f[3]}" ${f[2]?`stroke-dasharray="${f[2]}"`:""}`;
      return `<line x1="${P.l}" x2="${R}" y1="${ry[k]}" y2="${ry[k]}" ${st}/><polyline points="${R},${ry[k]} ${R+8},${ly[k]} ${R+24},${ly[k]}" fill="none" ${st}/>`
        +`<text x="${R+30}" y="${ly[k]+4}" font-size="14" fill="${f[6]}" ${f[4]?'font-weight="700"':""}>${f[1]}: ${fv(i,f[0])}</text>`}).join("");
    // apylinkių taškai spalvinami pagal pasiektą tikslą; spustelėjus pasirenkama apylinkė
    const others=rows.filter(o=>!r||raktas(o)!==raktas(r)).map(o=>{const oc=ST_C[status(o.val,o.t27,o.t29,i.lower).c]||ST_C.bad;
      const t=tp(`Apylinkė ${esc(o.a)}`,[["Rodiklio reikšmė",fv(i,o.val)],["Tikslinė grupė",nf(o.tg)],["","Spustelėkite – rodyti šią apylinkę"]],oc);
      const dk=`data-k="${esc(raktas(o))}" class="pt"`;
      if(o.val>ym){const tx=x(o.tg),ty=top+2;return `<path d="M${tx-6},${ty+10}L${tx+6},${ty+10}L${tx},${ty}Z" fill="${oc}" ${dotS(oc)} ${dk} ${t}/>`}
      return `<circle cx="${x(o.tg)}" cy="${y(o.val)}" r="${big?7:6}" fill="${oc}" ${dotS(oc)} ${dk} ${t}/>`}).join("");
    let me="";
    if(r){const sx=x(r.tg),sy=y(r.val),lt=fv(i,r.val),lw=textW(lt,"700 16px"),right=sx+20+lw<R;
      me=`<circle cx="${sx}" cy="${sy}" r="14" fill="none" stroke="#220083" stroke-width="2"/><circle cx="${sx}" cy="${sy}" r="9" fill="${ST_C[status(r.val,r.t27,r.t29,i.lower).c]||ST_C.bad}" stroke="#fff" stroke-width="2.5" ${tp(`Apylinkė ${esc(r.a)}`,[["Rodiklio reikšmė",fv(i,r.val)],["Tikslinė grupė",nf(r.tg)]],"#220083")}/>`
      +`<text x="${right?sx+20:sx-20}" y="${sy-12}" font-size="16" font-weight="700" text-anchor="${right?"start":"end"}" fill="#220083" stroke="#fff" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${lt}</text>`}
    const axes=`<line x1="${P.l}" x2="${P.l}" y1="${top}" y2="${bot}" stroke="#220083"/><line x1="${P.l}" x2="${R}" y1="${bot}" y2="${bot}" stroke="#220083"/>`
      +`<text x="${(P.l+R)/2}" y="${H-8}" font-size="14" text-anchor="middle" fill="#220083">Tikslinės grupės asmenų skaičius</text>`
      +`<text transform="translate(14 ${(top+bot)/2}) rotate(-90)" font-size="14" text-anchor="middle" fill="#220083">Rodiklio reikšmė</text>`;
    return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(i.name)}: apylinkių reikšmės pagal tikslinę grupę">${zone}${grid}${axes}${lines}${others}${me}</svg>`;
  }

  // Duomenų lentelė: visos įstaigos vaizde – rodiklių eilutės (visa įstaiga), išskleidžiamos iki apylinkių;
  // pasirinkus apylinkę – tik tos apylinkės eilutės (po vieną kiekvienam rodikliui)
  function renderTable(){
    const k=sel.value,fs=$("aFS").value,fp=k?"*":$("aFP").value;
    const pass=(v,t27,t29,low)=>fs==="*"||status(v,t27,t29,low).c===fs;
    const its=IND.map((it,n)=>({...it,n})).filter(it=>rodOn(it.n));
    let body="",cnt=0;
    if(!k){
      $("aTh").textContent="Rodiklių duomenys";
      const pcCol=multiPc,ex0=[];
      body=`<tr><th scope="col">Rodiklis / apylinkė</th>${pcCol?`<th scope="col">Prisirašymo įstaigos kodas</th>`:""}<th scope="col">Tikslinė grupė</th><th scope="col">Rodiklio reikšmė</th><th scope="col">Būsena</th></tr>`;
      let shown=0;
      its.forEach(({i,rows,inst,n})=>{
        const rs=rows.filter(r=>(fp==="*"||String(r.pc??"–")===fp)&&pass(r.val,r.t27,r.t29,i.lower)).sort((p,q)=>i.lower?p.val-q.val:q.val-p.val);
        if((fs!=="*"||fp!=="*")&&!rs.length)return;
        shown++;cnt+=rs.length;
        const ex=rs.length>0&&opened.has(n);
        if(rs.length)ex0.push(n);
        const nm=rs.length?`<button type="button" class="ex" data-x="${n}" aria-expanded="${ex}"><span class="ar"></span>${esc(i.name)}</button>`:`<span class="ex">${esc(i.name)}</span>`;
        body+=`<tr class="aind${ex?" open":""}"><td>${nm}<small>Visa įstaiga · ${instQ} · ${rs.length?plural(rs.length,"apylinkė","apylinkės","apylinkių"):"apylinkių duomenų nėra"}</small></td>${pcCol?`<td class="pi">–</td>`:""}<td class="g">${nf(i.tg)}</td><td class="k">${fv(i,inst)}</td><td>${badge(iStatus(i,inst))}</td></tr>`;
        if(ex)body+=rs.map(r=>`<tr class="asub"><td><button type="button" class="alink" data-k="${esc(raktas(r))}">Apylinkė ${esc(r.a)}</button></td>${pcCol?`<td class="pi">${esc(r.pc??"–")}</td>`:""}<td class="g">${nf(r.tg)}</td><td class="k">${fv(i,r.val)}</td><td>${badge(status(r.val,r.t27,r.t29,i.lower))}</td></tr>`).join("");
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
    const rs=its.map(it=>({...it,r:it.rows.find(o=>raktas(o)===k)})).filter(x=>x.r&&pass(x.r.val,x.r.t27,x.r.t29,x.i.lower));
    cnt=rs.length;
    if(cnt)body=`<tr><th scope="col">Rodiklis</th><th scope="col">Tikslinė grupė</th><th scope="col">Apylinkės reikšmė</th><th scope="col">Įstaigos reikšmė</th><th scope="col">Šalies reikšmė</th><th scope="col">Vieta</th><th scope="col">Būsena</th></tr>`
      +rs.map(x=>`<tr><td>${esc(x.i.name)}</td><td class="g">${nf(x.r.tg)}</td><td class="k">${fv(x.i,x.r.val)}</td><td>${fv(x.i,x.inst)}</td><td>${fv(x.i,x.i.country)}</td><td class="g">${rankOf(x,x.r)} iš ${x.rows.length}</td><td>${badge(status(x.r.val,x.r.t27,x.r.t29,x.i.lower))}</td></tr>`).join("");
    $("aTc").textContent=cnt?plural(cnt,"eilutė","eilutės","eilučių"):"";
    $("aTt").innerHTML=body||`<tr><td class="none">Pagal pasirinktus filtrus duomenų nėra.</td></tr>`;
  }

  poFiltro=renderTable;  // lentelėje – tik filtre pasirinktas rodiklis
  render();
}

// Grafikas „Apylinkių reitingas“: kiekvienam rodikliui apylinkės eilutėmis, surikiuotos nuo geriausios, su atstumu iki 2027 m. tikslo
// ir (dalies rodikliams) asmenų skaičiumi, kurio trūksta iki tikslo. Taško dydis – tikslinė grupė.
// Kai apylinkių daugiau nei ROWS_MAX, rodomos tik TOP apylinkių, labiausiai nutolusių nuo tikslo.
function apylReitingas(){
  const ROWS_MAX=40,TOP=10;
  const multiPc=new Set(Object.values(D.apyl).flat().map(r=>r.pc??"–")).size>1;
  const gap=(i,v)=>i.lower?v-i.t27:i.t27-v;                      // >0 – nepasiekta
  // kiek asmenų trūksta iki 2027 m. tikslo (tik dalies rodikliams, kur reikšmė = pasiekusių dalis tikslinėje grupėje)
  const need=(i,tg,v)=>i.pct&&i.t27!=null&&v!=null&&tg>0?Math.max(0,Math.ceil(i.t27*tg-1e-9)-Math.round(v*tg)):null;
  const asm=n=>`${nf(n)} asm.`;

  function rowsChart(i,rows){
    const W=900,RH=26,T=34,B=58,H=T+rows.length*RH+B,L=multiPc?285:170,R=i.pct?760:860,X0=L+20;
    const inst=i.vals[lastIdx(i.vals)];
    const xt=capY(i,ticks(Math.max(...rows.map(r=>r.val),i.t27??0,inst??0)*1.05,5)),xm=xt[xt.length-1];
    const x=v=>X0+Math.min(v,xm)/xm*(R-X0),top=T-8,bot=H-B+4;
    const hd=`font-size="12" fill="#8A87A8"`;
    let out=`<text x="0" y="14" ${hd}>Apylinkė${multiPc?" · prisirašymo kodas":""}</text><text x="${L}" y="14" ${hd} text-anchor="end">Tikslinė grupė</text>`
      +(i.pct?`<text x="${W}" y="14" ${hd} text-anchor="end">Trūksta iki 2027 m. tikslo</text>`:"");
    // kas antra eilutė patamsinta (po linijomis), kad akis nepamestų eilutės tarp numerio ir reikšmės
    out+=rows.map((r,k)=>k%2?`<rect x="0" y="${T+k*RH}" width="${W}" height="${RH}" fill="#F7F6FC"/>`:"").join("");
    if(i.t27!=null){const xt27=x(i.t27),zx=i.lower?X0:xt27,zw=i.lower?xt27-X0:R-xt27;
      out+=`<rect x="${zx}" y="${top}" width="${Math.max(0,zw)}" height="${bot-top}" fill="#009870" fill-opacity=".05"/>`}
    out+=xt.map(v=>`<line x1="${x(v)}" x2="${x(v)}" y1="${top}" y2="${bot}" stroke="${v?"#E6E4F5":"#220083"}"/>`+(v?`<text x="${x(v)}" y="${bot+16}" font-size="12" text-anchor="middle" fill="#220083">${ft(i,v)}</text>`:"")).join("");
    // tikslo ir įstaigos linijos; užrašai po ašimi dviem eilutėmis, kad nesusidurtų
    const ref=(v,lbl,dy,st,bold)=>{const tx=Math.max(X0+70,Math.min(R-70,x(v)));
      return `<line x1="${x(v)}" x2="${x(v)}" y1="${top-4}" y2="${bot}" ${st}/><text x="${tx}" y="${bot+dy}" font-size="12" text-anchor="middle" fill="#220083" ${bold?'font-weight="700"':""}>${lbl}: ${fv(i,v)}</text>`};
    if(inst!=null)out+=ref(inst,"Įstaiga",50,`stroke="#220083" stroke-width="1.5" stroke-dasharray="2 4"`,0);
    if(i.t27!=null)out+=ref(i.t27,"2027 m. tikslas",33,`stroke="#645DC0" stroke-width="2"`,1);
    const maxNeed=Math.max(0,...rows.map(r=>need(i,r.tg,r.val)??0));
    out+=rows.map((r,k)=>{
      const y=T+k*RH+RH/2,s=status(r.val,r.t27,r.t29,i.lower),c=ST_C[s.c]||ST_C.bad,cx=x(r.val),rad=Math.max(4,Math.min(10,3.5+Math.sqrt(r.tg)/2.2));
      const n=need(i,r.tg,r.val),lbl=fv(i,r.val),lw=textW(lbl,"13px")+8;
      // reikšmės užrašas – toje taško pusėje, kur nėra brūkšnio iki tikslo; jei netelpa – kitoje
      let left=i.t27!=null&&s.c==="bad"?cx<x(i.t27):false;
      if(left&&cx-rad-lw<X0)left=false;if(!left&&cx+rad+lw>R)left=true;
      const tip=tp(`Apylinkė ${esc(r.a)}`,[["Prisirašymo įstaigos kodas",esc(r.pc??"–")],["Rodiklio reikšmė",lbl],["Tikslinė grupė",nf(r.tg)]].concat(n?[["Trūksta iki 2027 m. tikslo",asm(n)]]:[]).concat([["",s.t]]),c);
      return `<text x="0" y="${y+4}" font-size="13" fill="#1F2937">Apylinkė ${esc(r.a)}${multiPc?`<tspan fill="#8A87A8"> · ${esc(r.pc??"–")}</tspan>`:""}</text>`
        +`<text x="${L}" y="${y+4}" font-size="13" text-anchor="end" fill="#8A87A8">${nf(r.tg)}</text>`
        +(s.c==="bad"&&i.t27!=null?`<line x1="${cx}" x2="${x(i.t27)}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="2" stroke-opacity=".55"/>`:"")
        +`<circle cx="${cx}" cy="${y}" r="${rad}" fill="${c}" ${dotS(c)} ${tip}/>`
        +`<text x="${left?cx-rad-5:cx+rad+5}" y="${y+4}" font-size="13" text-anchor="${left?"end":"start"}" fill="#1F2937" stroke="${k%2?"#F7F6FC":"#fff"}" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${lbl}</text>`
        +(n?`<text x="${W}" y="${y+4}" font-size="13" text-anchor="end" fill="#1F2937" ${n===maxNeed?'font-weight="700"':""}>${asm(n)}</text>`:"");
    }).join("");
    return `<div class="tw3"><svg class="rc" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(i.name)}: apylinkės, surikiuotos pagal reikšmę, ir atstumas iki 2027 m. tikslo">${out}</svg></div>`;
  }

  const visos=new Set();  // rodikliai, kuriems didelėje įstaigoje išskleistos visos apylinkės
  function kortele(it,n){
    const {i,rows,inst}=it,s=iStatus(i,inst),open=`<div class="panel" data-rod="${n}">`;
    const head=`<div class="ph"><b>${esc(i.name)}</b><span class="badge ${s.c}">${s.t}</span></div>`;
    if(!rows.length)return `${open}${head}<div class="empty sm">Šiam rodikliui apylinkių duomenų nėra. Įstaigos reikšmė: <b>${fv(i,inst)}</b>.</div></div>`;
    const ni=i.tg>0?need(i,i.tg,inst):null;
    const meta=`<div class="vr"><span class="v">${fv(i,inst)}</span><span class="m">${apylM(it)}`
      +(ni?`<br>Įstaigai iki 2027 m. tikslo trūksta: <b>${asm(ni)}</b>`:"")+`</span></div>`;
    const best=()=>[...rows].sort((p,q)=>i.lower?p.val-q.val:q.val-p.val);
    if(rows.length<=ROWS_MAX)return `${open}${head}${meta}${rowsChart(i,best())}</div>`;
    // didelė įstaiga: iš pradžių tik apylinkės, kurių atstumas iki tikslo, padaugintas iš tikslinės grupės, didžiausias
    const btn=t=>`<button type="button" class="exall" data-vis="${n}">${t}</button>`;
    if(visos.has(n))return `${open}${head}${meta}<div class="thead"><h2>Visos apylinkės</h2><span>${rows.length}, nuo geriausios reikšmės</span>${btn("Rodyti tik labiausiai nutolusias")}</div>${rowsChart(i,best())}</div>`;
    const worst=rows.filter(r=>gap(i,r.val)>0).sort((p,q)=>gap(i,q.val)*q.tg-gap(i,p.val)*p.tg).slice(0,TOP);
    return `${open}${head}${meta}<div class="thead"><h2>${worst.length?"Labiausiai nuo 2027 m. tikslo nutolusios apylinkės":"Visos apylinkės pasiekė 2027 m. tikslą"}</h2>`
      +(worst.length?`<span>${worst.length} iš ${rows.length}, atsižvelgiant į tikslinę grupę</span>`:"")+btn(`Rodyti visas apylinkes (${rows.length})`)+`</div>`
      +(worst.length?rowsChart(i,worst):"")+`</div>`;
  }
  const piesk=()=>{$("ovReit").innerHTML=`<div class="lg dots">${LEG}</div><div class="stackw">${IND.map(kortele).join("")}</div>`};
  $("ovReit").onclick=e=>{
    const b=e.target.closest&&e.target.closest("[data-vis]");
    if(!b)return;
    const n=+b.dataset.vis;
    visos.has(n)?visos.delete(n):visos.add(n);
    piesk();rodRodyk();
    const f=$("ovReit").querySelector(`[data-vis="${n}"]`);if(f)f.focus();
  };
  piesk();
}
