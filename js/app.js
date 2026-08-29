import {TUBULAR_LIBRARY} from "./data/tubular-library.js";
import {U,fromBase,toBase,capacity} from "./units.js";
import {componentCalc,tallyCalc} from "./modules/string-bha.js";
import {bodyArea,strength} from "./modules/tubular-strength.js";
import {fishingLoads} from "./modules/fishing-loads.js";
import {calculateVolumes} from "./modules/volumes.js";
import {calculateSegmentedSpotting} from "./modules/spotting.js";

const $=id=>document.getElementById(id),F=x=>Number(x).toLocaleString(undefined,{maximumFractionDigits:3});
let mode="oil",selected=null,tally=[],holeSections=[],lastAllow=0,reports=[];
const unit=t=>U[mode][t];\nconst mobileMenuBtn=document.getElementById("mobileMenuBtn");\nconst navOverlay=document.getElementById("navOverlay");\nfunction closeMobileNav(){document.body.classList.remove("nav-open")}\nif(mobileMenuBtn) mobileMenuBtn.onclick=()=>document.body.classList.toggle("nav-open");\nif(navOverlay) navOverlay.onclick=closeMobileNav;\ndocument.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",closeMobileNav));\nwindow.addEventListener("resize",()=>{if(window.innerWidth>820)closeMobileNav()});\n

document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.p).classList.add("active")});
$("system").onchange=()=>{mode=$("system").value;renderUnits();renderSelected();renderTally();renderHoleSections()};

function uniq(a){return [...new Set(a)]}
function populateCategories(){
 $("category").innerHTML=uniq(TUBULAR_LIBRARY.map(x=>x.category)).map(x=>`<option>${x}</option>`).join("");
 populateSizes();
}
function populateSizes(){
 const cat=$("category").value, list=TUBULAR_LIBRARY.filter(x=>x.category===cat);
 $("size").innerHTML=uniq(list.map(x=>x.size)).map(x=>`<option>${x}</option>`).join("");
 populateWeights();
}
function populateWeights(){
 const list=TUBULAR_LIBRARY.filter(x=>x.category===$("category").value&&x.size===$("size").value);
 $("weight").innerHTML=list.map((x,i)=>`<option value="${x.weight}">${x.weight} lb/ft</option>`).join("");
 populateGrades();
}
function currentRecord(){
 return TUBULAR_LIBRARY.find(x=>x.category===$("category").value&&x.size===$("size").value&&String(x.weight)===String($("weight").value))||null
}
function populateGrades(){
 selected=currentRecord(); if(!selected)return;
 $("grade").innerHTML=selected.grades.map(x=>`<option>${x}</option>`).join("");
 $("connection").innerHTML=selected.connections.map(x=>`<option>${x}</option>`).join("");
 renderSelected();
}
["category","size","weight","grade","connection"].forEach(id=>$(id).onchange=()=>{if(id==="category")populateSizes();else if(id==="size")populateWeights();else if(id==="weight")populateGrades();else renderSelected()});

function renderUnits(){
 $("uLen").textContent=unit("len");$("uForce").textContent=unit("force");$("uHook").textContent=unit("force");$("uOver").textContent=unit("force");$("uAllow").textContent=unit("force");$("uHoleDia").textContent=unit("dia");$("uHoleLen").textContent=unit("len");$("uPumpDisp").textContent=mode==="oil"?"bbl/stroke":"m³/stroke";$("uBaseMW").textContent=mode==="oil"?"ppg":"kg/m³";$("uPillMW").textContent=mode==="oil"?"ppg":"kg/m³";$("uSpotTopMD").textContent=unit("len");$("uSpotBottomMD").textContent=unit("len");$("uSpotTopTVD").textContent=unit("len");$("uSpotBottomTVD").textContent=unit("len");$("uSpotRate").textContent=mode==="oil"?"gpm":"L/min";$("uSpotPress1").textContent=unit("press");$("uSpotPress2").textContent=unit("press");$("uSpotPress3").textContent=unit("press");
}
function renderSelected(){
 selected=currentRecord(); if(!selected)return;
 const grade=$("grade").value||selected.grades[0],gd=selected.grade_data[grade]||{},A=bodyArea(selected.od,selected.id),yieldL=A*(gd.smys||0);
 const v=(x,t)=>F(fromBase(x,t,mode));
 $("componentName").value=`${selected.category} ${selected.size}" ${selected.weight} lb/ft ${grade} ${$("connection").value||""}`;
 $("selected").innerHTML=`<h4>Selected tubular</h4><b>${$("componentName").value}</b><br>${selected.standard}<br>${selected.source}`;
 $("dOD").textContent=`${v(selected.od,"dia")} ${unit("dia")}`;
 $("dID").textContent=`${v(selected.id,"dia")} ${unit("dia")}`;
 $("dWall").textContent=`${v(selected.wall,"dia")} ${unit("dia")}`;
 $("dDrift").textContent=selected.drift?`${v(selected.drift,"dia")} ${unit("dia")}`:"N/A";
 $("dWt").textContent=`${v(selected.weight,"lin")} ${unit("lin")}`;
 $("dSMYS").textContent=gd.smys?`${v(gd.smys,"press")} ${unit("press")}`:"Verify";
 $("dUTS").textContent=gd.uts?`${v(gd.uts,"press")} ${unit("press")}`:"Verify";
 $("dArea").textContent=`${F(A)} in²`;
 $("dYield").textContent=yieldL?`${v(yieldL,"force")} ${unit("force")}`:"Verify";
 $("dTJOD").textContent=selected.tool_joint_od?`${v(selected.tool_joint_od,"dia")} ${unit("dia")}`:"N/A";
 $("dTJID").textContent=selected.tool_joint_id?`${v(selected.tool_joint_id,"dia")} ${unit("dia")}`:"N/A";
 $("dSource").textContent=selected.standard;
 $("kTub").textContent=`${selected.category} ${selected.size}"`;
 $("kGrade").textContent=grade;$("kOD").textContent=$("dOD").textContent;$("kID").textContent=$("dID").textContent;$("kWt").textContent=$("dWt").textContent;$("kArea").textContent=$("dArea").textContent;
}
window.addSelectedTubular=()=>{
 if(!selected)return;
 const L=toBase(Number($("componentLength").value)||0,"len",mode), q=Number($("quantity").value)||1;
 if(L<=0)return alert("Enter component length.");
 const c=componentCalc(selected,L,q);
 tally.push({name:$("componentName").value,grade:$("grade").value,connection:$("connection").value,rec:selected,...c});
 renderTally();
};
function renderTally(){
 $("tallyBody").innerHTML=tally.map((x,i)=>`<tr><td>${x.name}</td><td>${x.grade}</td><td>${x.connection}</td><td>${F(fromBase(x.rec.od,"dia",mode))}</td><td>${F(fromBase(x.rec.id,"dia",mode))}</td><td>${F(fromBase(x.rec.weight,"lin",mode))}</td><td>${F(fromBase(x.totalLength,"len",mode))}</td><td>${F(fromBase(x.air,"force",mode))}</td><td>${F(fromBase(x.volume,"vol",mode))}</td><td><button onclick="removeRow(${i})">×</button></td></tr>`).join("");
 const t=tallyCalc(tally);
 $("tallyResult").innerHTML=tally.length?`<h4>Intermediate calculation steps</h4>1. Air weight = Σ(linear weight × length) = <b>${F(fromBase(t.air,"force",mode))} ${unit("force")}</b><br>2. Internal volume = Σ(ID²/1029.4 × length) = <b>${F(fromBase(t.volume,"vol",mode))} ${unit("vol")}</b><br>3. Total string length = <b>${F(fromBase(t.length,"len",mode))} ${unit("len")}</b>`:"No components added.";
}
window.removeRow=i=>{tally.splice(i,1);renderTally()};


window.addHoleSection=()=>{
 const name=$("volSectionName").value||`Section ${holeSections.length+1}`,id=toBase(Number($("volHoleId").value)||0,"dia",mode),length=toBase(Number($("volHoleLength").value)||0,"len",mode);
 if(!(id>0&&length>0))return alert("Enter valid hole/casing ID and section length.");
 const top=holeSections.length?holeSections[holeSections.length-1].bottom:0;
 holeSections.push({name,id,length,top,bottom:top+length});renderHoleSections();
};
window.removeHoleSection=i=>{holeSections.splice(i,1);let top=0;holeSections=holeSections.map(h=>{const x={...h,top,bottom:top+h.length};top=x.bottom;return x});renderHoleSections()};
function renderHoleSections(){$("holeSectionBody").innerHTML=holeSections.map((h,i)=>`<tr><td>${h.name}</td><td>${F(fromBase(h.id,"dia",mode))} ${unit("dia")}</td><td>${F(fromBase(h.length,"len",mode))} ${unit("len")}</td><td>${F(fromBase(h.top,"len",mode))}</td><td>${F(fromBase(h.bottom,"len",mode))}</td><td><button onclick="removeHoleSection(${i})">×</button></td></tr>`).join("")}
window.calculateVolumeModule=()=>{
 if(!tally.length)return alert("Add String/BHA components first.");
 if(!holeSections.length)return alert("Add at least one hole/casing section.");
 let pump=Number($("pumpDisp").value)||0;if(mode==="si")pump=toBase(pump,"vol",mode);
 const eff=(Number($("pumpEff").value)||100)/100,r=calculateVolumes({holeSections,stringRows:tally,pumpDisplacement:pump,pumpEfficiency:eff});
 const vv=x=>`${F(fromBase(x,"vol",mode))} ${unit("vol")}`;
 $("vAnn").textContent=vv(r.annulusVolume);$("vString").textContent=vv(r.stringVolume);$("vWell").textContent=vv(r.totalWellVolume);$("vMetal").textContent=vv(r.metalDisplacement);
 $("vStrokes").textContent=r.effectivePump>0?`${F(r.strokes)} strokes`:"Enter pump displacement";$("vStrokesString").textContent=r.effectivePump>0?`${F(r.strokesString)} strokes`:"—";$("vStrokesAnn").textContent=r.effectivePump>0?`${F(r.strokesAnnulus)} strokes`:"—";
 $("vEffPump").textContent=r.effectivePump>0?`${F(fromBase(r.effectivePump,"vol",mode))} ${unit("vol")}/stroke`:"—";
 $("volumeResult").innerHTML=`<h4>Intermediate calculation steps</h4>
 1. Annular capacity = <b>(Hole ID² − Pipe OD²) / 1029.4</b> bbl/ft.<br>
 2. Total annulus volume = Σ(capacity × interval length) = <b>${vv(r.annulusVolume)}</b>.<br>
 3. String internal capacity = <b>ID² / 1029.4</b> bbl/ft; string volume = <b>${vv(r.stringVolume)}</b>.<br>
 4. Total well volume = annulus volume + string internal volume = <b>${vv(r.totalWellVolume)}</b>.<br>
 5. Metal displacement = Σ[(OD² − ID²)/1029.4 × length] = <b>${vv(r.metalDisplacement)}</b>.<br>
 6. Effective pump displacement = theoretical displacement × efficiency = <b>${r.effectivePump>0?F(fromBase(r.effectivePump,"vol",mode))+" "+unit("vol")+"/stroke":"—"}</b>.<br>
 7. Strokes required = required volume / effective displacement = <b>${r.effectivePump>0?F(r.strokes)+" strokes":"—"}</b>.`;
 reports.push(`<h3>Volumes & Pump Strokes</h3>${$("volumeResult").innerHTML}`);$("reportOut").innerHTML=reports.join("<hr>");
};


function densToBase(v){return mode==="oil"?v:v*0.008345404}
function flowToBase(v){return mode==="oil"?v:v/3.785411784}
window.calculateSpotting=()=>{
 if(!tally.length)return alert("Add the String/BHA tally first.");
 if(!holeSections.length)return alert("Add Hole/Casing Sections in the Volumes module first.");

 const topMD=toBase(Number($("spotTopMD").value)||0,"len",mode),
       bottomMD=toBase(Number($("spotBottomMD").value)||0,"len",mode),
       topTVD=toBase(Number($("spotTopTVD").value)||0,"len",mode),
       bottomTVD=toBase(Number($("spotBottomTVD").value)||0,"len",mode),
       base=densToBase(Number($("baseMW").value)||0),
       pill=densToBase(Number($("pillMW").value)||0),
       q=flowToBase(Number($("spotRate").value)||0),
       pf=toBase(Number($("spotPipeFric").value)||0,"press",mode),
       af=toBase(Number($("spotAnnFric").value)||0,"press",mode),
       sbp=toBase(Number($("spotSBP").value)||0,"press",mode);

 if(!(bottomMD>topMD&&bottomTVD>topTVD&&base>0&&pill>0)) return alert("Enter valid pill top/bottom MD & TVD and fluid weights.");

 const maxHole=holeSections.length?holeSections[holeSections.length-1].bottom:0;
 const maxString=tally.reduce((a,r)=>a+(Number(r.totalLength)||0),0);
 if(bottomMD>maxHole || bottomMD>maxString) return alert("Pill bottom MD exceeds the entered hole or string depth.");

 const r=calculateSegmentedSpotting({holeSections,stringRows:tally,pillTopMD:topMD,pillBottomMD:bottomMD,pillTopTVD:topTVD,pillBottomTVD:bottomTVD,baseMudPpg:base,pillPpg:pill,pumpRateGpm:q,pipeFrictionPsi:pf,annularFrictionPsi:af,surfaceBackpressurePsi:sbp});
 const vv=x=>`${F(fromBase(x,"vol",mode))} ${unit("vol")}`, pp=x=>`${F(fromBase(x,"press",mode))} ${unit("press")}`, ll=x=>`${F(fromBase(x,"len",mode))} ${unit("len")}`;

 $("sPillVol").textContent=vv(r.pillVolume);
 $("sDispVol").textContent=vv(r.displacementVolume);
 $("sTotalVol").textContent=vv(r.totalPumpVolume);
 $("sHydLoss").textContent=pp(r.lossOfHydrostaticHead);
 $("sHydGain").textContent=pp(r.hydrostaticGain);
 $("sExtraP").textContent=pp(r.extraPumpPressure);
 $("sAnnVol").textContent=vv(r.annulusVolume);
 $("sPumpTime").textContent=r.pumpTimeMin>0?`${F(r.pumpTimeMin)} min`:"—";
 $("sBHPBefore").textContent=pp(r.bhpBefore);
 $("sBHPAfter").textContent=pp(r.bhpAfter);

 const annSeg=r.annulusSegments.map((x,i)=>`${i+1}. ${ll(x.topMD)}–${ll(x.bottomMD)}: Hole ID ${F(fromBase(x.holeId,"dia",mode))} ${unit("dia")}, Pipe OD ${F(fromBase(x.pipeOd,"dia",mode))} ${unit("dia")}, Annulus ${vv(x.volume)}`).join("<br>");
 const pipeSeg=r.pipeSegments.map((x,i)=>`${i+1}. ${ll(x.topMD)}–${ll(x.bottomMD)}: Pipe ID ${F(fromBase(x.pipeId,"dia",mode))} ${unit("dia")}, Internal ${vv(x.volume)}`).join("<br>");

 $("spotResult").innerHTML=`<h4>Segmented balanced-pill calculation</h4>
 <b>Placement:</b> MD ${ll(r.topMD)} to ${ll(r.botMD)}; TVD ${ll(r.topTVD)} to ${ll(r.botTVD)}.<br><br>
 <b>Annular segments</b><br>${annSeg||"No valid annular segments"}<br><br>
 <b>Pipe segments</b><br>${pipeSeg||"No valid pipe segments"}<br><br>
 1. Pill annulus volume = Σ[(Hole ID² − Pipe OD²)/1029.4 × interval length] = <b>${vv(r.annulusVolume)}</b>.<br>
 2. Pill pipe-side volume = Σ[Pipe ID²/1029.4 × interval length] = <b>${vv(r.pipeVolume)}</b>.<br>
 3. Balanced pill volume required = annulus + pipe-side pill volume = <b>${vv(r.pillVolume)}</b>.<br>
 4. Displacement volume from surface to pill top = Σ(pipe capacity × string interval) = <b>${vv(r.displacementVolume)}</b>.<br>
 5. Total volume to pump = pill + displacement = <b>${vv(r.totalPumpVolume)}</b>.<br>
 6. Hydrostatic in spotted TVD with base mud = <b>${pp(r.baseHydroInSpot)}</b>.<br>
 7. Hydrostatic in spotted TVD with pill = <b>${pp(r.pillHydroInSpot)}</b>.<br>
 8. Hydrostatic change = 0.052 × (Pill MW − Mud MW) × spotted TVD interval = <b>${pp(r.hydrostaticChange)}</b>.<br>
 9. BHP before spot = <b>${pp(r.bhpBefore)}</b>; BHP after spot = <b>${pp(r.bhpAfter)}</b>.<br>
 10. Loss of hydrostatic head = <b>${pp(r.lossOfHydrostaticHead)}</b>; hydrostatic gain = <b>${pp(r.hydrostaticGain)}</b>.<br>
 11. Extra pump pressure expected = positive density increment + pipe friction + annular friction + surface backpressure = <b>${pp(r.extraPumpPressure)}</b>.<br>
 12. Estimated pump time = <b>${r.pumpTimeMin>0?F(r.pumpTimeMin)+" min":"—"}</b>.`;

 reports.push(`<h3>Segmented Balanced Pill Spotting</h3>${$("spotResult").innerHTML}`);
 $("reportOut").innerHTML=reports.join("<hr>");
};

window.calculateSelectedStrength=()=>{
 if(!selected)return alert("Select a tubular first.");
 const load=toBase(Number($("appliedLoad").value)||0,"force",mode), eff=(Number($("connectionEfficiency").value)||100)/100,df=Number($("designFactor").value)||0.8,grade=$("grade").value,r=strength(selected,grade,eff,df,load);
 lastAllow=r.allow;$("allowablePull").placeholder=F(fromBase(lastAllow,"force",mode));
 $("strengthResult").innerHTML=`<h4>Intermediate calculation steps</h4>1. Metal area = π/4 × (OD² − ID²) = <b>${F(r.A)} in²</b><br>2. Pipe-body yield = area × SMYS = <b>${F(fromBase(r.body,"force",mode))} ${unit("force")}</b><br>3. Connection-adjusted capacity = body yield × efficiency = <b>${F(fromBase(r.connection,"force",mode))} ${unit("force")}</b><br>4. Design allowable = adjusted capacity × design factor = <b>${F(fromBase(r.allow,"force",mode))} ${unit("force")}</b><br>5. Remaining axial margin = allowable − applied load = <b class="${r.margin>=0?"ok":"bad"}">${F(fromBase(r.margin,"force",mode))} ${unit("force")}</b>`;
 reports.push(`<h3>Tubular Strength</h3>${$("strengthResult").innerHTML}`);$("reportOut").innerHTML=reports.join("<hr>");
};
window.calculateFishingLoad=()=>{
 const hook=toBase(Number($("hookload").value)||0,"force",mode),over=toBase(Number($("plannedOverpull").value)||0,"force",mode),allow=toBase(Number($("allowablePull").value)||0,"force",mode)||lastAllow,r=fishingLoads(hook,over,allow);
 $("fishingResult").innerHTML=`<h4>Intermediate calculation steps</h4>1. Planned hookload = hookload + overpull = <b>${F(fromBase(r.planned,"force",mode))} ${unit("force")}</b><br>2. Allowable pull = <b>${F(fromBase(allow,"force",mode))} ${unit("force")}</b><br>3. Remaining margin = allowable − planned = <b class="${r.margin>=0?"ok":"bad"}">${F(fromBase(r.margin,"force",mode))} ${unit("force")}</b><br>4. Utilization = planned / allowable × 100 = <b>${F(r.utilization)}%</b>`;
 reports.push(`<h3>Fishing Loads</h3>${$("fishingResult").innerHTML}`);$("reportOut").innerHTML=reports.join("<hr>");
};

populateCategories();renderUnits();
