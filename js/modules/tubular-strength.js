export function bodyArea(od,id){return Math.PI/4*(od*od-id*id)}
export function strength(rec,grade,eff=1,df=1,load=0){const gd=rec.grade_data[grade]||{},A=bodyArea(rec.od,rec.id),body=A*(gd.smys||0),connection=body*eff,allow=connection*df;return {A,smys:gd.smys||0,uts:gd.uts||0,body,connection,allow,margin:allow-load}}
