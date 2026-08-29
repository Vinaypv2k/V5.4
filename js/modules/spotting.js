import {capacity} from "../units.js";

export function annularCapacity(holeId, pipeOd){
  return holeId>pipeOd ? (holeId*holeId-pipeOd*pipeOd)/1029.4 : 0;
}
export function pipeCapacity(id){ return capacity(id); }

function overlap(a1,a2,b1,b2){ return Math.max(0,Math.min(a2,b2)-Math.max(a1,b1)); }

function pipeAtDepth(depth,stringRows){
  let top=0;
  for(const row of stringRows){
    const bottom=top+(Number(row.totalLength)||0);
    if(depth>=top && depth<bottom) return {top,bottom,row};
    top=bottom;
  }
  return null;
}
function holeAtDepth(depth,holeSections){
  return holeSections.find(h=>depth>=h.top && depth<h.bottom) || null;
}

/**
 * Segmented balanced-pill model.
 * Base units:
 * diameter in, MD/TVD/length ft, density ppg, pressure psi, volume bbl, flow gpm.
 * TVD mapping is assumed proportional to MD within each interval if only MD is supplied.
 */
export function calculateSegmentedSpotting({
  holeSections=[],
  stringRows=[],
  pillTopMD,
  pillBottomMD,
  pillTopTVD,
  pillBottomTVD,
  baseMudPpg,
  pillPpg,
  pumpRateGpm=0,
  pipeFrictionPsi=0,
  annularFrictionPsi=0,
  surfaceBackpressurePsi=0
}){
  const topMD=Math.min(pillTopMD,pillBottomMD);
  const botMD=Math.max(pillTopMD,pillBottomMD);
  const topTVD=Math.min(pillTopTVD,pillBottomTVD);
  const botTVD=Math.max(pillTopTVD,pillBottomTVD);
  const mdSpan=botMD-topMD;
  const tvdSpan=botTVD-topTVD;

  let annulusVolume=0, pipeVolume=0, metalDisplacement=0;
  let annulusSegments=[], pipeSegments=[];

  // Build piecewise breakpoints from hole + string boundaries.
  const breaks=new Set([topMD,botMD]);
  for(const h of holeSections){ if(h.top>topMD&&h.top<botMD)breaks.add(h.top); if(h.bottom>topMD&&h.bottom<botMD)breaks.add(h.bottom); }
  let sTop=0;
  for(const s of stringRows){
    const sBottom=sTop+(Number(s.totalLength)||0);
    if(sTop>topMD&&sTop<botMD)breaks.add(sTop);
    if(sBottom>topMD&&sBottom<botMD)breaks.add(sBottom);
    sTop=sBottom;
  }
  const pts=[...breaks].sort((a,b)=>a-b);

  for(let i=0;i<pts.length-1;i++){
    const a=pts[i], b=pts[i+1], L=b-a, mid=(a+b)/2;
    if(L<=0)continue;
    const h=holeAtDepth(mid,holeSections), p=pipeAtDepth(mid,stringRows);
    if(!h || !p) continue;
    const od=Number(p.row.rec?.od)||0, id=Number(p.row.rec?.id)||0;
    const annCap=annularCapacity(h.id,od), pipeCap=pipeCapacity(id);
    const annV=annCap*L, pipeV=pipeCap*L, metalV=((od*od-id*id)/1029.4)*L;
    annulusVolume+=annV; pipeVolume+=pipeV; metalDisplacement+=metalV;
    annulusSegments.push({topMD:a,bottomMD:b,length:L,holeId:h.id,pipeOd:od,capacity:annCap,volume:annV});
    pipeSegments.push({topMD:a,bottomMD:b,length:L,pipeId:id,capacity:pipeCap,volume:pipeV});
  }

  const pillVolume=annulusVolume+pipeVolume;

  // Displacement volume from surface to pill top through the actual string IDs.
  let displacementVolume=0, dispSegments=[];
  let top=0;
  for(const row of stringRows){
    const bottom=top+(Number(row.totalLength)||0);
    if(top>=topMD)break;
    const seg=overlap(top,bottom,0,topMD);
    if(seg>0){
      const id=Number(row.rec?.id)||0, cap=pipeCapacity(id), vol=cap*seg;
      displacementVolume+=vol;
      dispSegments.push({topMD:top,bottomMD:top+seg,length:seg,pipeId:id,capacity:cap,volume:vol});
    }
    top=bottom;
  }

  const totalPumpVolume=pillVolume+displacementVolume;

  // Hydrostatics: replace base mud by pill only over the spotted TVD interval.
  const baseHydroAtBottom=0.052*baseMudPpg*botTVD;
  const baseHydroInSpot=0.052*baseMudPpg*tvdSpan;
  const pillHydroInSpot=0.052*pillPpg*tvdSpan;
  const hydrostaticChange=pillHydroInSpot-baseHydroInSpot;
  const lossOfHydrostaticHead=Math.max(0,-hydrostaticChange);
  const hydrostaticGain=Math.max(0,hydrostaticChange);
  const bhpBefore=baseHydroAtBottom;
  const bhpAfter=baseHydroAtBottom+hydrostaticChange;

  const densityPressureIncrement=Math.max(0,hydrostaticChange);
  const frictionIncrement=Math.max(0,pipeFrictionPsi)+Math.max(0,annularFrictionPsi);
  const extraPumpPressure=densityPressureIncrement+frictionIncrement+Math.max(0,surfaceBackpressurePsi);
  const pumpTimeMin=pumpRateGpm>0 ? totalPumpVolume*42/pumpRateGpm : 0;

  return {
    annulusSegments,pipeSegments,dispSegments,
    annulusVolume,pipeVolume,pillVolume,displacementVolume,totalPumpVolume,metalDisplacement,
    baseHydroAtBottom,baseHydroInSpot,pillHydroInSpot,hydrostaticChange,lossOfHydrostaticHead,hydrostaticGain,
    bhpBefore,bhpAfter,densityPressureIncrement,frictionIncrement,extraPumpPressure,pumpTimeMin,
    topMD,botMD,topTVD,botTVD,mdSpan,tvdSpan
  };
}

// Backward-compatible simplified interface retained for old callers.
export function calculateBalancedPill(args){
  const holeSections=[{top:0,bottom:args.spotColumnFt,id:args.holeId}];
  const stringRows=[{totalLength:args.spotColumnFt,rec:{od:args.pipeOd,id:args.pipeId}}];
  return calculateSegmentedSpotting({
    holeSections,stringRows,pillTopMD:0,pillBottomMD:args.spotColumnFt,
    pillTopTVD:0,pillBottomTVD:args.spotColumnFt,baseMudPpg:args.baseMudPpg,pillPpg:args.pillPpg,
    pumpRateGpm:args.pumpRateGpm,pipeFrictionPsi:args.pipeFrictionPsi,
    annularFrictionPsi:args.annularFrictionPsi,surfaceBackpressurePsi:args.surfaceBackpressurePsi
  });
}
