import {capacity} from "../units.js";
export function componentCalc(rec,lengthFt,qty=1){const totalLength=lengthFt*qty,air=rec.weight*totalLength,volume=capacity(rec.id)*totalLength;return {totalLength,air,volume}}
export function tallyCalc(rows){return rows.reduce((a,r)=>({length:a.length+r.totalLength,air:a.air+r.air,volume:a.volume+r.volume}),{length:0,air:0,volume:0})}
