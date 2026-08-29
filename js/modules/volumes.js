import {capacity} from "../units.js";
export function annularCapacity(holeId,pipeOd){return holeId>pipeOd?(holeId*holeId-pipeOd*pipeOd)/1029.4:0}
export function metalDisplacementCapacity(od,id){return od>id?(od*od-id*id)/1029.4:0}
export function calculateVolumes({holeSections=[],stringRows=[],pumpDisplacement=0,pumpEfficiency=1}){
 let annulusVolume=0,stringVolume=0,metalDisplacement=0,stringLength=0,depthTop=0;
 for(const row of stringRows){
  const L=Number(row.totalLength)||0,od=Number(row.rec?.od)||0,id=Number(row.rec?.id)||0;
  stringVolume+=capacity(id)*L; metalDisplacement+=metalDisplacementCapacity(od,id)*L; stringLength+=L;
  let remaining=L,localTop=depthTop;
  while(remaining>1e-9){
   const hs=holeSections.find(h=>localTop>=h.top&&localTop<h.bottom)||holeSections.find(h=>localTop<h.bottom);
   if(!hs) break;
   const seg=Math.min(remaining,Math.max(0,hs.bottom-localTop)); if(seg<=0) break;
   annulusVolume+=annularCapacity(hs.id,od)*seg; localTop+=seg; remaining-=seg;
  }
  depthTop+=L;
 }
 const totalHoleVolume=holeSections.reduce((a,h)=>a+capacity(h.id)*(h.bottom-h.top),0);
 const totalWellVolume=annulusVolume+stringVolume;
 const effectivePump=pumpDisplacement*pumpEfficiency;
 return {annulusVolume,stringVolume,totalWellVolume,totalHoleVolume,metalDisplacement,stringLength,effectivePump,
  strokes:effectivePump>0?totalWellVolume/effectivePump:0,
  strokesAnnulus:effectivePump>0?annulusVolume/effectivePump:0,
  strokesString:effectivePump>0?stringVolume/effectivePump:0};
}