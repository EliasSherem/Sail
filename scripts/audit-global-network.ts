import fs from 'node:fs';
import {PORTS,portById} from '../src/data/ports';
import {EXPANDED_PORTS} from '../src/data/expandedPorts';
import {buildRoute,routeFromPosition} from '../src/geo/routes';
import {worldFromGeoJSON} from '../src/geo/world';
import {canPlaceVessel,createVessel} from '../src/sim/engine';
const data=JSON.parse(fs.readFileSync('public/data/land.geojson','utf8'));const w=worldFromGeoJSON(data),land=worldFromGeoJSON(data,[]);
const time=performance.now(),failures:string[]=[],legs:object[]=[];
for(const p of PORTS){if(p.id!=='marseille'&&!buildRoute(w,'marseille',p.id))failures.push(`disconnected:${p.id}`);if(!canPlaceVessel(createVessel('cargo',p,p.heading),w))failures.push(`hull:${p.id}`);if(EXPANDED_PORTS.includes(p)){const dock=w.docks.find(d=>d.portId===p.id)!;const ring=w.dockPolygon(dock);if(ring.some((x,i)=>land.sweep(x,ring[(i+1)%ring.length],0).hit))failures.push(`dock:${p.id}`);}}
const chain=['gibraltar','cadiz','lisbon','porto','vigo','a-coruna','brest','cork','killybegs','stornoway','torshavn','hofn','vestmannaeyjar','reykjavik','isafjordur','tasiilaq','prins-christian-sund','nanortalik','qaqortoq','paamiut','nuuk','sisimiut','qikiqtarjuaq','pangnirtung','iqaluit','saglek','nain','cartwright','st-anthony','st-johns','saint-pierre','halifax','boston','new-york'];
for(let i=1;i<chain.length;i++){const route=buildRoute(w,chain[i-1],chain[i]);if(!route){failures.push(`northern:${chain[i]}`);continue;} legs.push({from:chain[i-1],to:chain[i],distance:route.distance});if(route.distance>740000)failures.push(`range:${chain[i-1]}/${chain[i]}:${route.distance}`);}
const antaroute=routeFromPosition(w,{lat:-25,lon:-170},'sydney');console.log('dateline route',antaroute?.points.findIndex((p,i)=>i>0&&Math.abs(p.lon-antaroute!.points[i-1].lon)>180),antaroute?.distance);
const audit={ports:PORTS.length,failures,northernChain:chain,legs,maxLeg:Math.max(...legs.map((x:any)=>x.distance)),durationMs:performance.now()-time};fs.writeFileSync('docs/global-network-audit.json',JSON.stringify(audit,null,2));console.log(JSON.stringify(audit,null,2));
