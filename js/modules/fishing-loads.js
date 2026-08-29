export function fishingLoads(hook,over,allow){const planned=hook+over;return {planned,margin:allow-planned,utilization:allow?planned/allow*100:0}}
