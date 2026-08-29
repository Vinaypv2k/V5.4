export const U={oil:{len:"ft",dia:"in",lin:"lb/ft",vol:"bbl",press:"psi",force:"lb"},si:{len:"m",dia:"mm",lin:"kg/m",vol:"m³",press:"MPa",force:"kN"}};
export function fromBase(v,t,m){if(m==="oil")return v;const c={len:v*0.3048,dia:v*25.4,lin:v*1.48816394,vol:v*0.1589872949,press:v*0.00689475729,force:v*0.00444822162};return c[t]??v}
export function toBase(v,t,m){if(m==="oil")return v;const c={len:v/0.3048,dia:v/25.4,lin:v/1.48816394,vol:v/0.1589872949,press:v/0.00689475729,force:v/0.00444822162};return c[t]??v}
export const capacity=id=>id*id/1029.4;
